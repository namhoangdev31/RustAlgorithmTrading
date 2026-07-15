package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/domain/entities"
)

type MiniApp struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	IconURL   string  `json:"iconUrl"`
	Category  string  `json:"category"`
	Rating    float64 `json:"rating"`
	Developer string  `json:"developer"`
	Price     *string `json:"price,omitempty"`
}

type FeaturedApp struct {
	ID                 string   `json:"id"`
	ProcessedID        string   `json:"processedId"`
	Badge              string   `json:"badge"`
	Title              string   `json:"title"`
	Subtitle           string   `json:"subtitle"`
	BackgroundImageURL string   `json:"backgroundImageUrl"`
	App                *MiniApp `json:"app,omitempty"`
}

type AppCollection struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Subtitle      string    `json:"subtitle"`
	CoverImageURL string    `json:"coverImageUrl"`
	Apps          []MiniApp `json:"apps"`
}

type BundleScreenshotView struct {
	ID         string  `json:"id"`
	BundleID   string  `json:"bundleId"`
	ImageURL   string  `json:"imageUrl"`
	Caption    *string `json:"caption,omitempty"`
	OrderIndex int     `json:"orderIndex"`
	DeviceType *string `json:"deviceType,omitempty"`
}

type BundleTagView struct {
	ID   string  `json:"id"`
	Name string  `json:"name"`
	Slug *string `json:"slug,omitempty"`
}

type BundleLanguageView struct {
	ID           string `json:"id"`
	BundleID     string `json:"bundleId"`
	LanguageCode string `json:"languageCode"`
	IsDefault    bool   `json:"isDefault"`
}

type BundleInAppPurchaseView struct {
	ID           string  `json:"id"`
	BundleID     string  `json:"bundleId"`
	ProductID    string  `json:"productId"`
	Name         string  `json:"name"`
	Description  *string `json:"description,omitempty"`
	Price        float64 `json:"price"`
	Currency     string  `json:"currency"`
	PurchaseType string  `json:"purchaseType"`
}

type CatalogBundle struct {
	ID                string                    `json:"id"`
	BundleKey         *string                   `json:"bundleKey,omitempty"`
	Name              string                    `json:"name"`
	Slug              *string                   `json:"slug,omitempty"`
	Version           string                    `json:"version"`
	BuildNumber       int                       `json:"buildNumber"`
	IconURL           *string                   `json:"iconUrl,omitempty"`
	BannerURL         *string                   `json:"bannerUrl,omitempty"`
	ShortDescription  *string                   `json:"shortDescription,omitempty"`
	Description       *string                   `json:"description,omitempty"`
	PrivacyPolicyURL  *string                   `json:"privacyPolicyUrl,omitempty"`
	SupportURL        *string                   `json:"supportUrl,omitempty"`
	WebsiteURL        *string                   `json:"websiteUrl,omitempty"`
	DeveloperName     *string                   `json:"developerName,omitempty"`
	DeveloperID       *string                   `json:"developerId,omitempty"`
	DeveloperEmail    *string                   `json:"developerEmail,omitempty"`
	Category          *string                   `json:"category,omitempty"`
	SubCategory       *string                   `json:"subCategory,omitempty"`
	StoragePath       string                    `json:"storagePath"`
	Bucket            string                    `json:"bucket"`
	FileSize          *int64                    `json:"fileSize,omitempty"`
	Checksum          *string                   `json:"checksum,omitempty"`
	Price             *float64                  `json:"price,omitempty"`
	Currency          *string                   `json:"currency,omitempty"`
	IsFree            bool                      `json:"isFree"`
	IsOneTimePayment  bool                      `json:"isOneTimePayment"`
	HasInAppPurchases bool                      `json:"hasInAppPurchases"`
	HasSubscription   bool                      `json:"hasSubscription"`
	Status            string                    `json:"status"`
	RejectionReason   *string                   `json:"rejectionReason,omitempty"`
	PublishedAt       *time.Time                `json:"publishedAt,omitempty"`
	ExpiresAt         *time.Time                `json:"expiresAt,omitempty"`
	Changelog         *string                   `json:"changelog,omitempty"`
	ReleaseNotes      *string                   `json:"releaseNotes,omitempty"`
	MinOSVersion      *string                   `json:"minOsVersion,omitempty"`
	RuntimeType       string                    `json:"runtimeType"`
	Rating            *float64                  `json:"rating,omitempty"`
	RatingCount       int                       `json:"ratingCount"`
	Rating1           int                       `json:"rating1"`
	Rating2           int                       `json:"rating2"`
	Rating3           int                       `json:"rating3"`
	Rating4           int                       `json:"rating4"`
	Rating5           int                       `json:"rating5"`
	AgeRating         *string                   `json:"ageRating,omitempty"`
	ContentAdvisory   *string                   `json:"contentAdvisory,omitempty"`
	DownloadCount     int64                     `json:"downloadCount"`
	ActiveInstalls    int64                     `json:"activeInstalls"`
	IsFeatured        bool                      `json:"isFeatured"`
	IsVerified        bool                      `json:"isVerified"`
	IsEditorChoice    bool                      `json:"isEditorChoice"`
	FeaturedOrder     *int                      `json:"featuredOrder,omitempty"`
	CreatedAt         time.Time                 `json:"createdAt"`
	UpdatedAt         time.Time                 `json:"updatedAt"`
	DeletedAt         *time.Time                `json:"deletedAt,omitempty"`
	Screenshots       []BundleScreenshotView    `json:"screenshots"`
	Tags              []BundleTagView           `json:"tags"`
	Languages         []BundleLanguageView      `json:"languages"`
	InAppPurchases    []BundleInAppPurchaseView `json:"inAppPurchases"`
}

type BundleStatsView struct {
	TotalDownloads int64   `json:"totalDownloads"`
	ActiveInstalls int64   `json:"activeInstalls"`
	AverageRating  float64 `json:"averageRating"`
	TotalRatings   int     `json:"totalRatings"`
}

type PromotionView struct {
	ID              string     `json:"id"`
	BundleID        string     `json:"bundleId"`
	Code            string     `json:"code"`
	DiscountPercent float64    `json:"discountPercent"`
	MaxUses         int        `json:"maxUses"`
	CurrentUses     int        `json:"currentUses"`
	ExpiresAt       *time.Time `json:"expiresAt,omitempty"`
	IsActive        bool       `json:"isActive"`
}

type ReviewView struct {
	ID      string    `json:"id"`
	Author  string    `json:"author"`
	Rating  int       `json:"rating"`
	Date    time.Time `json:"date"`
	Title   string    `json:"title"`
	Content string    `json:"content"`
}

type CreateReviewInput struct {
	Rating  int
	Title   string
	Content string
}

type CreateReviewResult struct {
	Status   string `json:"status"`
	ReviewID string `json:"reviewId"`
}

type CreateReportInput struct {
	Reason      string
	Description string
}

type CreateReportResult struct {
	Status   string `json:"status"`
	ReportID string `json:"reportId"`
}

type NotificationView struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"`
	IsRead    bool      `json:"isRead"`
	CreatedAt time.Time `json:"createdAt"`
}

type InstalledBundle struct {
	BundleID           string `json:"bundleId"`
	CurrentVersion     string `json:"currentVersion"`
	CurrentBuildNumber int    `json:"currentBuildNumber"`
}

type ActiveRelease struct {
	BundleID    uuid.UUID
	Version     string
	BuildNumber int
	Changelog   string
	Artifact    *entities.BundleArtifact
}

type UpdateView struct {
	BundleID          string  `json:"bundleId"`
	UpdateAvailable   bool    `json:"updateAvailable"`
	LatestVersion     string  `json:"latestVersion"`
	LatestBuildNumber int     `json:"latestBuildNumber"`
	Changelog         string  `json:"changelog"`
	DownloadURL       *string `json:"downloadUrl"`
}

type CheckoutResult struct {
	TransactionID string `json:"transactionId"`
	Status        string `json:"status"`
	ReceiptURL    string `json:"receiptUrl"`
}

type PaymentMethodView struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Brand     string `json:"brand"`
	Last4     string `json:"last4"`
	IsDefault bool   `json:"isDefault"`
}

type StorefrontRepository interface {
	ListBundles(ctx context.Context) ([]CatalogBundle, error)
	GetBundleStats(ctx context.Context, bundleID string) (BundleStatsView, error)
	ListPromotions(ctx context.Context, bundleID string, now time.Time) ([]PromotionView, error)
	GetFeatured(ctx context.Context, now time.Time) (FeaturedApp, error)
	ListAppsWeLove(ctx context.Context) ([]MiniApp, error)
	ListCollections(ctx context.Context) ([]AppCollection, error)
	ListPersonalized(ctx context.Context, userID uuid.UUID) ([]MiniApp, error)
	ListReviews(ctx context.Context, bundleID string) ([]ReviewView, error)
	CreateReview(ctx context.Context, bundleID string, userID uuid.UUID, input CreateReviewInput) (CreateReviewResult, error)
	CreateReviewReport(ctx context.Context, reviewID string, userID uuid.UUID, input CreateReportInput) (CreateReportResult, error)
	FindActiveRelease(ctx context.Context, bundleID string) (ActiveRelease, error)
	TrackDownload(ctx context.Context, bundleID string, userID uuid.UUID, now time.Time) error
	ListNotifications(ctx context.Context, userID uuid.UUID) ([]NotificationView, error)
	MarkNotificationRead(ctx context.Context, notificationID string, userID uuid.UUID, now time.Time) error
	MockCheckout(ctx context.Context, userID uuid.UUID, bundleID, idempotencyKey string, now time.Time) (CheckoutResult, error)
}

type ArtifactSigner interface {
	PresignDownload(ctx context.Context, artifact entities.BundleArtifact, expires time.Duration) (string, error)
}
