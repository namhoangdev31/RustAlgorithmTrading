package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundlereviewreports"
	"trading/control-gateway/internal/data/ent/bundlereviews"
	"trading/control-gateway/internal/data/ent/bundlestats"
	"trading/control-gateway/internal/data/ent/user"
	"trading/control-gateway/internal/modules/catalog/application"
	"trading/control-gateway/internal/shared/apperror"
)

func (r *Repository) ListReviews(ctx context.Context, bundleID string) ([]application.ReviewView, error) {
	id, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return nil, err
	}
	rows, err := r.client.BundleReviews.Query().Where(bundlereviews.BundleIdEQ(id), bundlereviews.HasUserWith(user.DeletedAtIsNil())).
		WithUser().Order(bundlereviews.ByCreatedAt(sql.OrderDesc()), bundlereviews.ByID()).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bundle reviews: %w", err)
	}
	result := make([]application.ReviewView, 0, len(rows))
	for _, row := range rows {
		author := "Anonymous"
		if account := row.Edges.User; account != nil {
			if account.FullName != nil && strings.TrimSpace(*account.FullName) != "" {
				author = *account.FullName
			} else if account.Email != nil {
				if local, _, ok := strings.Cut(*account.Email, "@"); ok && local != "" {
					author = local
				}
			}
		}
		result = append(result, application.ReviewView{ID: row.ID.String(), Author: author, Rating: row.Rating, Date: row.CreatedAt, Title: sfString(row.Title, ""), Content: sfString(row.Body, "")})
	}
	return result, nil
}

func (r *Repository) CreateReview(ctx context.Context, bundleID string, userID uuid.UUID, input application.CreateReviewInput) (application.CreateReviewResult, error) {
	bundleUUID, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return application.CreateReviewResult{}, err
	}
	now, proposedID := time.Now().UTC(), uuid.New()
	id, err := r.client.BundleReviews.Create().SetID(proposedID).SetBundleId(bundleUUID).SetUserId(userID).
		SetRating(input.Rating).SetTitle(input.Title).SetBody(input.Content).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundlereviews.FieldBundleId, bundlereviews.FieldUserId).
		Update(func(upsert *entdb.BundleReviewsUpsert) { upsert.SetUserId(userID) }).ID(ctx)
	if err != nil {
		return application.CreateReviewResult{}, fmt.Errorf("create bundle review: %w", err)
	}
	if id != proposedID {
		return application.CreateReviewResult{}, apperror.ErrConflict
	}
	return application.CreateReviewResult{Status: "submitted", ReviewID: id.String()}, nil
}

func (r *Repository) CreateReviewReport(ctx context.Context, reviewID string, userID uuid.UUID, input application.CreateReportInput) (application.CreateReportResult, error) {
	reviewUUID, err := uuid.Parse(reviewID)
	if err != nil {
		return application.CreateReportResult{}, fmt.Errorf("%w: invalid review id", apperror.ErrInvalidArgument)
	}
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return application.CreateReportResult{}, fmt.Errorf("begin review report: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	review, err := tx.BundleReviews.Get(ctx, reviewUUID)
	if entdb.IsNotFound(err) {
		return application.CreateReportResult{}, apperror.ErrNotFound
	}
	if err != nil {
		return application.CreateReportResult{}, fmt.Errorf("find review for report: %w", err)
	}
	now, proposedID := time.Now().UTC(), uuid.New()
	description := strings.TrimSpace(input.Description)
	create := tx.BundleReviewReports.Create().SetID(proposedID).SetReviewId(reviewUUID).SetReportedBy(userID).SetReason(input.Reason).SetStatus("pending").SetCreatedAt(now).SetUpdatedAt(now)
	if description != "" {
		create.SetDescription(description)
	}
	id, err := create.OnConflictColumns(bundlereviewreports.FieldReviewId, bundlereviewreports.FieldReportedBy).
		Update(func(upsert *entdb.BundleReviewReportsUpsert) { upsert.SetReportedBy(userID) }).ID(ctx)
	if err != nil {
		return application.CreateReportResult{}, fmt.Errorf("create review report: %w", err)
	}
	if id != proposedID {
		return application.CreateReportResult{}, apperror.ErrConflict
	}
	if _, err := review.Update().AddReportCount(1).Save(ctx); err != nil {
		return application.CreateReportResult{}, fmt.Errorf("increment review report count: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return application.CreateReportResult{}, fmt.Errorf("commit review report: %w", err)
	}
	rollback = false
	return application.CreateReportResult{Status: "submitted", ReportID: id.String()}, nil
}

func (r *Repository) TrackDownload(ctx context.Context, bundleID string, userID uuid.UUID, now time.Time) error {
	bundleUUID, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return err
	}
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("begin download tracking: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	if _, err := tx.BundleInstallEvents.Create().SetID(uuid.New()).SetBundleId(bundleUUID).SetUserId(userID).SetEventType("download").SetCreatedAt(now).Save(ctx); err != nil {
		return fmt.Errorf("create download event: %w", err)
	}
	if err := tx.BundleStats.Create().SetID(uuid.New()).SetBundleId(bundleUUID).SetDownloadCount(1).SetUpdatedAt(now).
		OnConflictColumns(bundlestats.FieldBundleId).Update(func(upsert *entdb.BundleStatsUpsert) {
		upsert.AddDownloadCount(1).SetUpdatedAt(now)
	}).Exec(ctx); err != nil {
		return fmt.Errorf("increment download stats: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit download tracking: %w", err)
	}
	rollback = false
	return nil
}
