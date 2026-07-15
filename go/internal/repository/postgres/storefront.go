package postgres

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleartifacts"
	"trading/control-gateway/internal/data/ent/bundlechannels"
	"trading/control-gateway/internal/data/ent/bundlefeaturedslots"
	"trading/control-gateway/internal/data/ent/bundleinstallevents"
	"trading/control-gateway/internal/data/ent/bundlepromotions"
	"trading/control-gateway/internal/data/ent/bundlereleases"
	"trading/control-gateway/internal/data/ent/bundles"
	"trading/control-gateway/internal/data/ent/bundlescreenshots"
	"trading/control-gateway/internal/data/ent/bundlestats"
	"trading/control-gateway/internal/data/ent/bundlestoreflags"
	"trading/control-gateway/internal/data/ent/predicate"
	entschema "trading/control-gateway/internal/data/ent/schema"
	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
	"trading/control-gateway/internal/storage"
)

type StorefrontRepository struct {
	client *entdb.Client
}

func NewStorefrontRepository(store *storage.Store) (*StorefrontRepository, error) {
	if store == nil || store.Postgres() == nil || store.Postgres().Ent() == nil {
		return nil, errors.New("storefront postgres is not configured")
	}
	return &StorefrontRepository{client: store.Postgres().Ent()}, nil
}

func (r *StorefrontRepository) catalogQuery() *entdb.BundlesQuery {
	return r.client.Bundles.Query().
		Where(bundles.StatusEQ(entschema.BundleCatalogStatusPublished), bundles.DeletedAtIsNil()).
		WithStats().WithStoreFlags().WithRuntimeConfig().
		WithScreenshots(func(q *entdb.BundleScreenshotsQuery) {
			q.Order(bundlescreenshots.BySortOrder(), bundlescreenshots.ByCreatedAt())
		}).WithTags().WithLanguages().WithInAppPurchasesRelation()
}

func (r *StorefrontRepository) ListBundles(ctx context.Context) ([]repositories.CatalogBundle, error) {
	rows, err := r.catalogQuery().Order(
		bundles.ByPublishedAt(sql.OrderDesc(), sql.OrderNullsLast()),
		bundles.ByCreatedAt(sql.OrderDesc()), bundles.ByID(),
	).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list published bundles: %w", err)
	}
	result := make([]repositories.CatalogBundle, 0, len(rows))
	for _, row := range rows {
		result = append(result, catalogView(row))
	}
	return result, nil
}

func (r *StorefrontRepository) GetBundleStats(ctx context.Context, bundleID string) (repositories.BundleStatsView, error) {
	id, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return repositories.BundleStatsView{}, err
	}
	row, err := r.client.BundleStats.Query().Where(bundlestats.BundleIdEQ(id)).Only(ctx)
	if entdb.IsNotFound(err) {
		return repositories.BundleStatsView{}, nil
	}
	if err != nil {
		return repositories.BundleStatsView{}, fmt.Errorf("load bundle stats: %w", err)
	}
	rating := 0.0
	if row.Rating != nil {
		rating = *row.Rating
	}
	return repositories.BundleStatsView{TotalDownloads: row.DownloadCount, ActiveInstalls: row.ActiveInstalls, AverageRating: rating, TotalRatings: row.RatingCount}, nil
}

func (r *StorefrontRepository) ListPromotions(ctx context.Context, bundleID string, now time.Time) ([]repositories.PromotionView, error) {
	id, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return nil, err
	}
	rows, err := r.client.BundlePromotions.Query().Where(
		bundlepromotions.BundleIdEQ(id), bundlepromotions.PromoTypeEQ("percentage"),
		bundlepromotions.IsActiveEQ(true), bundlepromotions.StartsAtLTE(now),
		bundlepromotions.Or(bundlepromotions.EndsAtIsNil(), bundlepromotions.EndsAtGT(now)),
	).Order(bundlepromotions.ByDiscountValue(sql.OrderDesc()), bundlepromotions.ByCreatedAt(sql.OrderDesc()), bundlepromotions.ByID()).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bundle promotions: %w", err)
	}
	result := make([]repositories.PromotionView, 0, len(rows))
	for _, row := range rows {
		code, maxUses := "", 0
		if row.PromoCode != nil {
			code = *row.PromoCode
		}
		if row.MaxRedemptions != nil {
			maxUses = *row.MaxRedemptions
		}
		result = append(result, repositories.PromotionView{ID: row.ID.String(), BundleID: row.BundleId.String(), Code: code, DiscountPercent: row.DiscountValue, MaxUses: maxUses, CurrentUses: row.CurrentRedemptions, ExpiresAt: row.EndsAt, IsActive: row.IsActive})
	}
	return result, nil
}

func (r *StorefrontRepository) GetFeatured(ctx context.Context, now time.Time) (repositories.FeaturedApp, error) {
	row, err := r.client.BundleFeaturedSlots.Query().Where(
		bundlefeaturedslots.IsActiveEQ(true), bundlefeaturedslots.StartsAtLTE(now),
		bundlefeaturedslots.Or(bundlefeaturedslots.EndsAtIsNil(), bundlefeaturedslots.EndsAtGT(now)),
		bundlefeaturedslots.HasBundleWith(bundles.StatusEQ(entschema.BundleCatalogStatusPublished), bundles.DeletedAtIsNil()),
	).WithBundle(func(q *entdb.BundlesQuery) { q.WithStats() }).
		Order(bundlefeaturedslots.BySortOrder(), bundlefeaturedslots.ByCreatedAt(sql.OrderDesc()), bundlefeaturedslots.ByID()).First(ctx)
	if entdb.IsNotFound(err) {
		return repositories.FeaturedApp{}, repositories.ErrNotFound
	}
	if err != nil {
		return repositories.FeaturedApp{}, fmt.Errorf("load featured app: %w", err)
	}
	bundle := row.Edges.Bundle
	app := miniApp(bundle)
	title := bundle.Name
	if row.Title != nil {
		title = *row.Title
	}
	subtitle := sfString(row.Subtitle, sfString(bundle.ShortDescription, ""))
	banner := sfString(row.BannerUrl, sfString(bundle.BannerUrl, ""))
	processedID := bundle.ID.String()
	if bundle.Slug != nil {
		processedID = *bundle.Slug
	} else if bundle.BundleKey != nil {
		processedID = *bundle.BundleKey
	}
	return repositories.FeaturedApp{ID: row.ID.String(), ProcessedID: processedID, Badge: strings.ToUpper(row.SlotType), Title: title, Subtitle: subtitle, BackgroundImageURL: banner, App: &app}, nil
}

func (r *StorefrontRepository) ListAppsWeLove(ctx context.Context) ([]repositories.MiniApp, error) {
	rows, err := r.rankedBundles(ctx, bundles.HasStoreFlagsWith(bundlestoreflags.IsEditorChoiceEQ(true)))
	if err != nil {
		return nil, err
	}
	return miniApps(rows), nil
}

func (r *StorefrontRepository) ListPersonalized(ctx context.Context, userID uuid.UUID) ([]repositories.MiniApp, error) {
	events, err := r.client.BundleInstallEvents.Query().Where(bundleinstallevents.UserIdEQ(userID)).WithBundle().All(ctx)
	if err != nil {
		return nil, fmt.Errorf("load personalized install history: %w", err)
	}
	installed := make([]uuid.UUID, 0, len(events))
	weights := map[string]int{}
	for _, event := range events {
		installed = append(installed, event.BundleId)
		if event.Edges.Bundle != nil && event.Edges.Bundle.Category != nil {
			weights[*event.Edges.Bundle.Category]++
		}
	}
	query := r.catalogQuery().WithRankingScores()
	if len(installed) > 0 {
		query.Where(bundles.IDNotIn(installed...))
	}
	rows, err := query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list personalized apps: %w", err)
	}
	sort.SliceStable(rows, func(i, j int) bool { return compareBundles(rows[i], rows[j], weights) })
	if len(rows) > 50 {
		rows = rows[:50]
	}
	return miniApps(rows), nil
}

func (r *StorefrontRepository) ListCollections(ctx context.Context) ([]repositories.AppCollection, error) {
	rows, err := r.rankedBundles(ctx)
	if err != nil {
		return nil, err
	}
	byCategory := map[string]*repositories.AppCollection{}
	for _, row := range rows {
		category := sfString(row.Category, "General")
		collection := byCategory[category]
		if collection == nil {
			collection = &repositories.AppCollection{ID: "category:" + slug(category), Name: category, Subtitle: "Top " + category + " apps", CoverImageURL: sfString(row.BannerUrl, sfString(row.IconUrl, "")), Apps: []repositories.MiniApp{}}
			byCategory[category] = collection
		}
		collection.Apps = append(collection.Apps, miniApp(row))
	}
	keys := make([]string, 0, len(byCategory))
	for key := range byCategory {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := make([]repositories.AppCollection, 0, len(keys))
	for _, key := range keys {
		result = append(result, *byCategory[key])
	}
	return result, nil
}

func (r *StorefrontRepository) rankedBundles(ctx context.Context, extra ...predicate.Bundles) ([]*entdb.Bundles, error) {
	query := r.catalogQuery().WithRankingScores()
	for _, predicate := range extra {
		query.Where(predicate)
	}
	rows, err := query.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list storefront apps: %w", err)
	}
	sort.SliceStable(rows, func(i, j int) bool { return compareBundles(rows[i], rows[j], nil) })
	if len(rows) > 50 {
		rows = rows[:50]
	}
	return rows, nil
}

func compareBundles(left, right *entdb.Bundles, categoryWeights map[string]int) bool {
	leftCategory, rightCategory := sfString(left.Category, "General"), sfString(right.Category, "General")
	if categoryWeights[leftCategory] != categoryWeights[rightCategory] {
		return categoryWeights[leftCategory] > categoryWeights[rightCategory]
	}
	lf, rf := left.Edges.StoreFlags, right.Edges.StoreFlags
	if lf != nil && rf != nil && lf.IsEditorChoice != rf.IsEditorChoice {
		return lf.IsEditorChoice
	}
	lr, rr := left.Edges.RankingScores, right.Edges.RankingScores
	if lr != nil && rr != nil && lr.OverallScore != rr.OverallScore {
		return lr.OverallScore > rr.OverallScore
	}
	ls, rs := left.Edges.Stats, right.Edges.Stats
	if rating(ls) != rating(rs) {
		return rating(ls) > rating(rs)
	}
	if left.Name != right.Name {
		return left.Name < right.Name
	}
	return left.ID.String() < right.ID.String()
}

func (r *StorefrontRepository) FindActiveRelease(ctx context.Context, bundleID string) (repositories.ActiveRelease, error) {
	id, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return repositories.ActiveRelease{}, err
	}
	channel, err := r.client.BundleChannels.Query().Where(bundlechannels.BundleIdEQ(id), bundlechannels.NameEQ("production"), bundlechannels.IsActiveEQ(true), bundlechannels.CurrentReleaseIdNotNil()).
		WithBundle().WithCurrentRelease(func(q *entdb.BundleReleasesQuery) {
		q.Where(bundlereleases.StatusEQ(entschema.BundleReleaseStatusActive)).WithArtifacts(func(a *entdb.BundleArtifactsQuery) {
			a.Where(bundleartifacts.KindEQ(entschema.BundleArtifactKindFull)).Order(bundleartifacts.ByCreatedAt(sql.OrderDesc())).Limit(1)
		})
	}).Only(ctx)
	if entdb.IsNotFound(err) {
		return repositories.ActiveRelease{}, repositories.ErrNotFound
	}
	if err != nil {
		return repositories.ActiveRelease{}, fmt.Errorf("load active release: %w", err)
	}
	if channel.Edges.CurrentRelease == nil {
		return repositories.ActiveRelease{}, repositories.ErrNotFound
	}
	release := channel.Edges.CurrentRelease
	changelog := sfString(release.ReleaseNotes, sfString(channel.Edges.Bundle.Changelog, ""))
	result := repositories.ActiveRelease{BundleID: id, Version: release.Version, BuildNumber: release.BuildNumber, Changelog: changelog}
	if len(release.Edges.Artifacts) > 0 {
		artifact := release.Edges.Artifacts[0]
		result.Artifact = &entities.BundleArtifact{ID: artifact.ID, ReleaseID: artifact.ReleaseId, Kind: string(artifact.Kind), StorageProvider: artifact.StorageProvider, StorageBucket: artifact.StorageBucket, StorageKey: artifact.StorageKey, ChecksumSHA256: artifact.ChecksumSha256, FileSize: artifact.FileSize, ContentType: artifact.ContentType, BaseBuildNumber: artifact.BaseBuildNumber, TargetBuildNumber: artifact.TargetBuildNumber, Metadata: artifact.Metadata, CreatedAt: artifact.CreatedAt}
	}
	return result, nil
}

func (r *StorefrontRepository) resolvePublishedBundleID(ctx context.Context, value string) (uuid.UUID, error) {
	predicate := bundles.Or(bundles.SlugEQ(value), bundles.BundleKeyEQ(value))
	if id, err := uuid.Parse(value); err == nil {
		predicate = bundles.Or(predicate, bundles.IDEQ(id))
	}
	row, err := r.client.Bundles.Query().Where(predicate, bundles.StatusEQ(entschema.BundleCatalogStatusPublished), bundles.DeletedAtIsNil()).Select(bundles.FieldID).Only(ctx)
	if entdb.IsNotFound(err) {
		return uuid.Nil, repositories.ErrNotFound
	}
	if err != nil {
		return uuid.Nil, fmt.Errorf("resolve published bundle: %w", err)
	}
	return row.ID, nil
}

func catalogView(row *entdb.Bundles) repositories.CatalogBundle {
	view := repositories.CatalogBundle{ID: row.ID.String(), BundleKey: row.BundleKey, Name: row.Name, Slug: row.Slug, Version: row.Version, BuildNumber: row.BuildNumber, IconURL: row.IconUrl, BannerURL: row.BannerUrl, ShortDescription: row.ShortDescription, Description: row.Description, PrivacyPolicyURL: row.PrivacyPolicyUrl, SupportURL: row.SupportUrl, WebsiteURL: row.WebsiteUrl, DeveloperName: row.DeveloperName, DeveloperEmail: row.DeveloperEmail, Category: row.Category, SubCategory: row.SubCategory, StoragePath: row.StoragePath, Bucket: row.Bucket, FileSize: row.FileSize, Checksum: row.Checksum, Price: row.Price, Currency: row.Currency, IsFree: row.IsFree, IsOneTimePayment: row.IsOneTimePayment, HasInAppPurchases: row.HasInAppPurchases, HasSubscription: row.HasSubscription, Status: string(row.Status), RejectionReason: row.RejectionReason, PublishedAt: row.PublishedAt, ExpiresAt: row.ExpiresAt, Changelog: row.Changelog, ReleaseNotes: row.ReleaseNotes, RuntimeType: "standard", AgeRating: row.AgeRating, ContentAdvisory: row.ContentAdvisory, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt, Screenshots: []repositories.BundleScreenshotView{}, Tags: []repositories.BundleTagView{}, Languages: []repositories.BundleLanguageView{}, InAppPurchases: []repositories.BundleInAppPurchaseView{}}
	if row.DeveloperId != nil {
		value := row.DeveloperId.String()
		view.DeveloperID = &value
	}
	if stats := row.Edges.Stats; stats != nil {
		view.Rating, view.RatingCount, view.Rating1, view.Rating2, view.Rating3, view.Rating4, view.Rating5 = stats.Rating, stats.RatingCount, stats.Rating1, stats.Rating2, stats.Rating3, stats.Rating4, stats.Rating5
		view.DownloadCount, view.ActiveInstalls = stats.DownloadCount, stats.ActiveInstalls
	}
	if flags := row.Edges.StoreFlags; flags != nil {
		view.IsFeatured, view.IsVerified, view.IsEditorChoice, view.FeaturedOrder = flags.IsFeatured, flags.IsVerified, flags.IsEditorChoice, flags.FeaturedOrder
	}
	if runtime := row.Edges.RuntimeConfig; runtime != nil {
		view.MinOSVersion, view.RuntimeType = runtime.MinOsVersion, runtime.RuntimeType
	}
	for _, item := range row.Edges.Screenshots {
		view.Screenshots = append(view.Screenshots, repositories.BundleScreenshotView{ID: item.ID.String(), BundleID: item.BundleId.String(), ImageURL: item.URL, Caption: item.Caption, OrderIndex: item.SortOrder, DeviceType: item.DeviceType})
	}
	for _, item := range row.Edges.Tags {
		slugValue := slug(item.Tag)
		view.Tags = append(view.Tags, repositories.BundleTagView{ID: item.ID.String(), Name: item.Tag, Slug: &slugValue})
	}
	for i, item := range row.Edges.Languages {
		view.Languages = append(view.Languages, repositories.BundleLanguageView{ID: item.ID.String(), BundleID: item.BundleId.String(), LanguageCode: item.LanguageCode, IsDefault: i == 0})
	}
	for _, item := range row.Edges.InAppPurchasesRelation {
		view.InAppPurchases = append(view.InAppPurchases, repositories.BundleInAppPurchaseView{ID: item.ID.String(), BundleID: item.BundleId.String(), ProductID: item.ProductId, Name: item.Name, Description: item.Description, Price: item.Price, Currency: item.Currency, PurchaseType: item.PurchaseType})
	}
	return view
}

func miniApps(rows []*entdb.Bundles) []repositories.MiniApp {
	result := make([]repositories.MiniApp, 0, len(rows))
	for _, row := range rows {
		result = append(result, miniApp(row))
	}
	return result
}

func miniApp(row *entdb.Bundles) repositories.MiniApp {
	return repositories.MiniApp{ID: row.ID.String(), Name: row.Name, IconURL: sfString(row.IconUrl, ""), Category: sfString(row.Category, "General"), Rating: rating(row.Edges.Stats), Developer: sfString(row.DeveloperName, ""), Price: priceText(row)}
}

func rating(stats *entdb.BundleStats) float64 {
	if stats != nil && stats.Rating != nil {
		return *stats.Rating
	}
	return 0
}

func priceText(row *entdb.Bundles) *string {
	value := "Free"
	if !row.IsFree {
		price, currency := 0.0, ""
		if row.Price != nil {
			price = *row.Price
		}
		if row.Currency != nil {
			currency = *row.Currency
		}
		value = strings.TrimSpace(fmt.Sprintf("%v %s", price, currency))
	}
	return &value
}

func sfString(value *string, fallback string) string {
	if value == nil || strings.TrimSpace(*value) == "" {
		return fallback
	}
	return *value
}

func slug(value string) string {
	return strings.Trim(strings.Join(strings.Fields(strings.ToLower(value)), "-"), "-")
}
