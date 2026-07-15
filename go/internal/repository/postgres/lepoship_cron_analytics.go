package postgres

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"
	"time"

	entsql "entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleabusesignals"
	"trading/control-gateway/internal/data/ent/bundleanalyticsevents"
	"trading/control-gateway/internal/data/ent/bundlecrashreports"
	"trading/control-gateway/internal/data/ent/bundleinstallevents"
	"trading/control-gateway/internal/data/ent/bundleorders"
	"trading/control-gateway/internal/data/ent/bundlerankingscores"
	"trading/control-gateway/internal/data/ent/bundleretentionstats"
	"trading/control-gateway/internal/data/ent/bundles"
	"trading/control-gateway/internal/data/ent/bundlestats"
	"trading/control-gateway/internal/data/ent/bundletrendingsnapshots"
	"trading/control-gateway/internal/data/ent/bundleuserreports"
	entschema "trading/control-gateway/internal/data/ent/schema"
	"trading/control-gateway/internal/domain/repositories"
)

type bundleInstallCounts struct {
	Downloads  int64
	Installs   int64
	Uninstalls int64
}

func (r *LepoShipRepository) runBundleAbuse(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	reports, err := r.client.BundleUserReports.Query().Where(
		bundleuserreports.CreatedAtGTE(now.Add(-24*time.Hour)),
		bundleuserreports.ReporterFingerprintNotNil(),
	).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("scan abuse reports: %w", err)
	}
	fingerprints := make(map[uuid.UUID]map[string]struct{})
	for _, report := range reports {
		set := fingerprints[report.BundleId]
		if set == nil {
			set = make(map[string]struct{})
			fingerprints[report.BundleId] = set
		}
		set[*report.ReporterFingerprint] = struct{}{}
	}
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("begin abuse transaction: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	var processed, transitioned int64
	for bundleID, reporters := range fingerprints {
		if len(reporters) < 6 {
			continue
		}
		processed++
		anomaly := math.Min(float64(len(reporters))/20.0, 1)
		riskLevel := "low"
		if anomaly >= 0.7 {
			riskLevel = "high"
		} else if anomaly >= 0.4 {
			riskLevel = "medium"
		}
		if err := tx.BundleAbuseSignals.Create().SetID(uuid.New()).SetBundleId(bundleID).
			SetAnomalyScore(anomaly).SetOverallRiskScore(anomaly).SetRiskLevel(riskLevel).
			SetFlaggedForReview(true).SetLastCalculatedAt(now).
			OnConflictColumns(bundleabusesignals.FieldBundleId).
			Update(func(upsert *entdb.BundleAbuseSignalsUpsert) {
				upsert.SetAnomalyScore(anomaly).SetOverallRiskScore(anomaly).SetRiskLevel(riskLevel).
					SetFlaggedForReview(true).SetLastCalculatedAt(now)
			}).Exec(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert abuse signal: %w", err)
		}
		count, err := tx.Bundles.Update().Where(
			bundles.IDEQ(bundleID), bundles.StatusEQ(entschema.BundleCatalogStatusPublished),
		).SetStatus(entschema.BundleCatalogStatusSuspended).SetUpdatedAt(now).Save(ctx)
		if err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("transition bundle review state: %w", err)
		}
		if count > 0 {
			transitioned += int64(count)
			metadata, _ := json.Marshal(map[string]any{"reportCount": len(reporters), "anomalyScore": anomaly})
			if _, err := tx.BundleStateTransitions.Create().SetID(uuid.New()).SetBundleId(bundleID).
				SetFromState("published").SetToState("suspended").SetTrigger("abuse_threshold_reached").
				SetMetadata(string(metadata)).SetCreatedAt(now).Save(ctx); err != nil {
				return repositories.CronJobResult{}, fmt.Errorf("record state transition: %w", err)
			}
		}
	}
	if err := tx.Commit(); err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("commit abuse transaction: %w", err)
	}
	rollback = false
	return repositories.CronJobResult{Job: "bundle-abuse", Processed: processed, Skipped: transitioned, Message: "flagged abusive bundles and transitioned published bundles"}, nil
}

func (r *LepoShipRepository) runRetentionCalculator(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), now.Day()-1, 0, 0, 0, 0, time.UTC)
	end := start.Add(24*time.Hour - time.Millisecond)
	bundleIDs, err := r.client.Bundles.Query().IDs(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("list bundles: %w", err)
	}
	analytics, err := r.client.BundleAnalyticsEvents.Query().Where(
		bundleanalyticsevents.CreatedAtGTE(start.AddDate(0, 0, -30)), bundleanalyticsevents.CreatedAtLTE(end),
	).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load retention analytics: %w", err)
	}
	installs, err := r.client.BundleInstallEvents.Query().Where(
		bundleinstallevents.CreatedAtGTE(start.AddDate(0, 0, -30)), bundleinstallevents.CreatedAtLTE(end),
	).All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load retention installs: %w", err)
	}
	reviews, err := r.client.BundleReviews.Query().All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load bundle reviews: %w", err)
	}
	analyticsByBundle := make(map[uuid.UUID][]*entdb.BundleAnalyticsEvents)
	for _, event := range analytics {
		analyticsByBundle[event.BundleId] = append(analyticsByBundle[event.BundleId], event)
	}
	installsByBundle := make(map[uuid.UUID][]*entdb.BundleInstallEvents)
	for _, event := range installs {
		installsByBundle[event.BundleId] = append(installsByBundle[event.BundleId], event)
	}
	reviewsByBundle := make(map[uuid.UUID][]*entdb.BundleReviews)
	for _, review := range reviews {
		reviewsByBundle[review.BundleId] = append(reviewsByBundle[review.BundleId], review)
	}
	var aggregateRows []struct {
		BundleID  uuid.UUID `json:"bundleId"`
		EventType string    `json:"eventType"`
		Count     int64     `json:"count"`
	}
	if err := r.client.BundleInstallEvents.Query().
		GroupBy(bundleinstallevents.FieldBundleId, bundleinstallevents.FieldEventType).
		Aggregate(entdb.Count()).Scan(ctx, &aggregateRows); err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("aggregate install totals: %w", err)
	}
	installTotals := make(map[uuid.UUID]bundleInstallCounts)
	for _, aggregate := range aggregateRows {
		counts := installTotals[aggregate.BundleID]
		switch aggregate.EventType {
		case "download":
			counts.Downloads = aggregate.Count
		case "install":
			counts.Installs = aggregate.Count
		case "uninstall":
			counts.Uninstalls = aggregate.Count
		}
		installTotals[aggregate.BundleID] = counts
	}
	for _, bundleID := range bundleIDs {
		a := analyticsByBundle[bundleID]
		i := installsByBundle[bundleID]
		dau := distinctSubjects(a, start, end)
		mau := distinctSubjects(a, start.AddDate(0, 0, -29), end)
		d1 := retentionRatio(i, a, start.AddDate(0, 0, -1), end.AddDate(0, 0, -1), start, end)
		d7 := retentionRatio(i, a, start.AddDate(0, 0, -7), end.AddDate(0, 0, -7), start, end)
		d30 := retentionRatio(i, a, start.AddDate(0, 0, -30), end.AddDate(0, 0, -30), start, end)
		sessions := make(map[string]struct{})
		var durationTotal float64
		var durationCount int
		for _, event := range a {
			if event.CreatedAt.Before(start) || event.CreatedAt.After(end) {
				continue
			}
			if event.SessionId != nil {
				sessions[*event.SessionId] = struct{}{}
			}
			if event.EventType == "session_end" && event.EventData != nil {
				var data struct {
					DurationMS float64 `json:"durationMs"`
				}
				if json.Unmarshal([]byte(*event.EventData), &data) == nil && data.DurationMS > 0 {
					durationTotal += data.DurationMS / 1000
					durationCount++
				}
			}
		}
		var avgDuration *float64
		if durationCount > 0 {
			value := durationTotal / float64(durationCount)
			avgDuration = &value
		}
		if err := r.client.BundleRetentionStats.Create().SetID(uuid.New()).SetBundleId(bundleID).
			SetStatsDate(start.Format("2006-01-02")).SetNillableD1Retention(d1).SetNillableD7Retention(d7).SetNillableD30Retention(d30).
			SetDau(dau).SetMau(mau).SetSessionCount(int64(len(sessions))).SetNillableAvgSessionDuration(avgDuration).SetCreatedAt(now).
			OnConflictColumns(bundleretentionstats.FieldBundleId, bundleretentionstats.FieldStatsDate).
			Update(func(upsert *entdb.BundleRetentionStatsUpsert) {
				setRetentionUpsert(upsert, d1, d7, d30, avgDuration)
				upsert.SetDau(dau).SetMau(mau).SetSessionCount(int64(len(sessions)))
			}).Exec(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert retention stats: %w", err)
		}
		if err := r.refreshBundleStatsFromRows(ctx, bundleID, installTotals[bundleID], reviewsByBundle[bundleID], now); err != nil {
			return repositories.CronJobResult{}, err
		}
	}
	return repositories.CronJobResult{Job: "retention-calculator", Processed: int64(len(bundleIDs)), Message: "computed retention and refreshed bundle stats"}, nil
}

func (r *LepoShipRepository) runRankingCalculator(ctx context.Context) (repositories.CronJobResult, error) {
	now := time.Now().UTC()
	rows, err := r.client.Bundles.Query().Where(bundles.StatusEQ(entschema.BundleCatalogStatusPublished)).
		WithStats().
		WithRetentionStats(func(q *entdb.BundleRetentionStatsQuery) {
			q.Order(bundleretentionstats.ByStatsDate(entsql.OrderDesc())).Limit(1)
		}).
		WithOrders(func(q *entdb.BundleOrdersQuery) {
			q.Where(bundleorders.StatusEQ("completed"), bundleorders.CreatedAtGTE(now.AddDate(0, 0, -30)))
		}).
		WithCrashReports(func(q *entdb.BundleCrashReportsQuery) { q.Where(bundlecrashreports.IsResolvedEQ(false)) }).
		All(ctx)
	if err != nil {
		return repositories.CronJobResult{}, fmt.Errorf("load ranking candidates: %w", err)
	}
	scores := make([]rankingBundleScore, 0, len(rows))
	var maxInstalls, maxOrders int64
	for _, bundle := range rows {
		score := rankingBundleScore{ID: bundle.ID, Category: bundle.Category, PaidOrders: int64(len(bundle.Edges.Orders))}
		if stats := bundle.Edges.Stats; stats != nil {
			score.ActiveInstalls, score.RatingCount = stats.ActiveInstalls, int64(stats.RatingCount)
			if stats.Rating != nil {
				score.Rating = *stats.Rating
			}
		}
		if len(bundle.Edges.RetentionStats) > 0 {
			latest := bundle.Edges.RetentionStats[0]
			score.D1Retention, score.D7Retention, score.D30Retention = latest.D1Retention, latest.D7Retention, latest.D30Retention
		}
		maxInstalls = max(maxInstalls, score.ActiveInstalls)
		maxOrders = max(maxOrders, score.PaidOrders)
		scores = append(scores, score)
	}
	for index, bundle := range rows {
		score := &scores[index]
		popularity := normalizedPopularity(score.ActiveInstalls, score.PaidOrders, maxInstalls, maxOrders)
		retention := firstFloat(score.D30Retention, score.D7Retention, score.D1Retention)
		bayesian := (float64(score.RatingCount)*score.Rating + 10*3.5) / (float64(score.RatingCount) + 10)
		quality := math.Max(0, (bayesian-1)/4)
		crashRatio := 0.0
		if score.ActiveInstalls > 0 {
			crashRatio = float64(len(bundle.Edges.CrashReports)) / float64(score.ActiveInstalls)
		}
		crashScore := math.Max(0, 1-math.Min(crashRatio, 1))
		score.OverallScore = 0.35*popularity + 0.25*retention + 0.3*quality + 0.1*crashScore
		if err := r.client.BundleRankingScores.Create().SetID(uuid.New()).SetBundleId(score.ID).
			SetPopularityScore(popularity).SetRetentionScore(retention).SetQualityScore(quality).SetCrashScore(crashScore).
			SetOverallScore(score.OverallScore).SetUpdatedAt(now).
			OnConflictColumns(bundlerankingscores.FieldBundleId).
			Update(func(upsert *entdb.BundleRankingScoresUpsert) {
				upsert.SetPopularityScore(popularity).SetRetentionScore(retention).SetQualityScore(quality).SetCrashScore(crashScore).
					SetOverallScore(score.OverallScore).SetUpdatedAt(now)
			}).Exec(ctx); err != nil {
			return repositories.CronJobResult{}, fmt.Errorf("upsert ranking score: %w", err)
		}
	}
	bundlesByID := rowsByID(rows)
	for _, category := range uniqueCategories(scores) {
		for index, score := range sortedByCategory(scores, category) {
			stats := bundlesByID[score.ID].Edges.Stats
			var downloads, active int64
			if stats != nil {
				downloads, active = stats.DownloadCount, stats.ActiveInstalls
			}
			if err := r.client.BundleTrendingSnapshots.Create().SetID(uuid.New()).SetBundleId(score.ID).
				SetSnapshotDate(now.Format("2006-01-02")).SetDownloadCount(downloads).SetActiveInstalls(active).
				SetRankPosition(index+1).SetCategory(coalescePtr(score.Category, "General")).SetCreatedAt(now).
				OnConflictColumns(bundletrendingsnapshots.FieldBundleId, bundletrendingsnapshots.FieldSnapshotDate).
				Update(func(upsert *entdb.BundleTrendingSnapshotsUpsert) {
					upsert.SetDownloadCount(downloads).SetActiveInstalls(active).SetRankPosition(index + 1).SetCategory(coalescePtr(score.Category, "General"))
				}).Exec(ctx); err != nil {
				return repositories.CronJobResult{}, fmt.Errorf("upsert trending snapshot: %w", err)
			}
		}
	}
	return repositories.CronJobResult{Job: "ranking-calculator", Processed: int64(len(scores)), Message: "updated ranking scores and trending snapshots"}, nil
}

func distinctSubjects(events []*entdb.BundleAnalyticsEvents, start, end time.Time) int64 {
	set := make(map[string]struct{})
	for _, event := range events {
		if event.CreatedAt.Before(start) || event.CreatedAt.After(end) {
			continue
		}
		if subject := analyticsSubject(event); subject != "" {
			set[subject] = struct{}{}
		}
	}
	return int64(len(set))
}

func retentionRatio(installs []*entdb.BundleInstallEvents, analytics []*entdb.BundleAnalyticsEvents, cohortStart, cohortEnd, activeStart, activeEnd time.Time) *float64 {
	cohort := make(map[string]struct{})
	for _, event := range installs {
		if event.EventType == "install" && !event.CreatedAt.Before(cohortStart) && !event.CreatedAt.After(cohortEnd) {
			if subject := installSubject(event); subject != "" {
				cohort[subject] = struct{}{}
			}
		}
	}
	if len(cohort) == 0 {
		return nil
	}
	retained := make(map[string]struct{})
	for _, event := range analytics {
		if !event.CreatedAt.Before(activeStart) && !event.CreatedAt.After(activeEnd) {
			if subject := analyticsSubject(event); subject != "" {
				if _, ok := cohort[subject]; ok {
					retained[subject] = struct{}{}
				}
			}
		}
	}
	value := float64(len(retained)) / float64(len(cohort))
	return &value
}

func analyticsSubject(event *entdb.BundleAnalyticsEvents) string {
	if event.DeviceFingerprint != nil {
		return *event.DeviceFingerprint
	}
	if event.UserId != nil {
		return event.UserId.String()
	}
	return ""
}

func installSubject(event *entdb.BundleInstallEvents) string {
	if event.DeviceFingerprint != nil {
		return *event.DeviceFingerprint
	}
	if event.UserId != nil {
		return event.UserId.String()
	}
	return ""
}

func (r *LepoShipRepository) refreshBundleStatsFromRows(ctx context.Context, bundleID uuid.UUID, counts bundleInstallCounts, reviews []*entdb.BundleReviews, now time.Time) error {
	ratingCounts := [6]int{}
	var ratingTotal int
	for _, review := range reviews {
		if review.Rating >= 1 && review.Rating <= 5 {
			ratingCounts[review.Rating]++
			ratingTotal += review.Rating
		}
	}
	active := max(int64(0), counts.Installs-counts.Uninstalls)
	var average *float64
	if len(reviews) > 0 {
		value := float64(ratingTotal) / float64(len(reviews))
		average = &value
	}
	return r.client.BundleStats.Create().SetID(uuid.New()).SetBundleId(bundleID).SetNillableRating(average).
		SetRatingCount(len(reviews)).SetRating1(ratingCounts[1]).SetRating2(ratingCounts[2]).SetRating3(ratingCounts[3]).SetRating4(ratingCounts[4]).SetRating5(ratingCounts[5]).
		SetDownloadCount(counts.Downloads).SetActiveInstalls(active).SetUpdatedAt(now).
		OnConflictColumns(bundlestats.FieldBundleId).
		Update(func(upsert *entdb.BundleStatsUpsert) {
			if average == nil {
				upsert.ClearRating()
			} else {
				upsert.SetRating(*average)
			}
			upsert.SetRatingCount(len(reviews)).SetRating1(ratingCounts[1]).SetRating2(ratingCounts[2]).
				SetRating3(ratingCounts[3]).SetRating4(ratingCounts[4]).SetRating5(ratingCounts[5]).
				SetDownloadCount(counts.Downloads).SetActiveInstalls(active).SetUpdatedAt(now)
		}).Exec(ctx)
}

func setRetentionUpsert(upsert *entdb.BundleRetentionStatsUpsert, d1, d7, d30, average *float64) {
	if d1 == nil {
		upsert.ClearD1Retention()
	} else {
		upsert.SetD1Retention(*d1)
	}
	if d7 == nil {
		upsert.ClearD7Retention()
	} else {
		upsert.SetD7Retention(*d7)
	}
	if d30 == nil {
		upsert.ClearD30Retention()
	} else {
		upsert.SetD30Retention(*d30)
	}
	if average == nil {
		upsert.ClearAvgSessionDuration()
	} else {
		upsert.SetAvgSessionDuration(*average)
	}
}

func normalizedPopularity(installs, orders, maxInstalls, maxOrders int64) float64 {
	value := 0.0
	if maxInstalls > 0 {
		value += 0.6 * math.Log(float64(installs)+1) / math.Log(float64(maxInstalls)+1)
	}
	if maxOrders > 0 {
		value += 0.4 * math.Log(float64(orders)+1) / math.Log(float64(maxOrders)+1)
	}
	return value
}

func rowsByID(rows []*entdb.Bundles) map[uuid.UUID]*entdb.Bundles {
	result := make(map[uuid.UUID]*entdb.Bundles, len(rows))
	for _, row := range rows {
		result[row.ID] = row
	}
	return result
}

func sortedScores(rows []rankingBundleScore) []rankingBundleScore {
	result := append([]rankingBundleScore(nil), rows...)
	sort.Slice(result, func(i, j int) bool { return result[i].OverallScore > result[j].OverallScore })
	return result
}
