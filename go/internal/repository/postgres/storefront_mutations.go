package postgres

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleorders"
	"trading/control-gateway/internal/data/ent/bundlereviewreports"
	"trading/control-gateway/internal/data/ent/bundlereviews"
	"trading/control-gateway/internal/data/ent/bundlestats"
	"trading/control-gateway/internal/data/ent/bundleuserentitlements"
	"trading/control-gateway/internal/data/ent/notifications"
	"trading/control-gateway/internal/data/ent/user"
	"trading/control-gateway/internal/domain/repositories"
)

func (r *StorefrontRepository) ListReviews(ctx context.Context, bundleID string) ([]repositories.ReviewView, error) {
	id, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return nil, err
	}
	rows, err := r.client.BundleReviews.Query().Where(bundlereviews.BundleIdEQ(id), bundlereviews.HasUserWith(user.DeletedAtIsNil())).
		WithUser().Order(bundlereviews.ByCreatedAt(sql.OrderDesc()), bundlereviews.ByID()).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list bundle reviews: %w", err)
	}
	result := make([]repositories.ReviewView, 0, len(rows))
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
		result = append(result, repositories.ReviewView{ID: row.ID.String(), Author: author, Rating: row.Rating, Date: row.CreatedAt, Title: sfString(row.Title, ""), Content: sfString(row.Body, "")})
	}
	return result, nil
}

func (r *StorefrontRepository) CreateReview(ctx context.Context, bundleID string, userID uuid.UUID, input repositories.CreateReviewInput) (repositories.CreateReviewResult, error) {
	bundleUUID, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return repositories.CreateReviewResult{}, err
	}
	now, proposedID := time.Now().UTC(), uuid.New()
	id, err := r.client.BundleReviews.Create().SetID(proposedID).SetBundleId(bundleUUID).SetUserId(userID).
		SetRating(input.Rating).SetTitle(input.Title).SetBody(input.Content).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundlereviews.FieldBundleId, bundlereviews.FieldUserId).
		Update(func(upsert *entdb.BundleReviewsUpsert) { upsert.SetUserId(userID) }).ID(ctx)
	if err != nil {
		return repositories.CreateReviewResult{}, fmt.Errorf("create bundle review: %w", err)
	}
	if id != proposedID {
		return repositories.CreateReviewResult{}, repositories.ErrConflict
	}
	return repositories.CreateReviewResult{Status: "submitted", ReviewID: id.String()}, nil
}

func (r *StorefrontRepository) CreateReviewReport(ctx context.Context, reviewID string, userID uuid.UUID, input repositories.CreateReportInput) (repositories.CreateReportResult, error) {
	reviewUUID, err := uuid.Parse(reviewID)
	if err != nil {
		return repositories.CreateReportResult{}, fmt.Errorf("%w: invalid review id", repositories.ErrBadRequest)
	}
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return repositories.CreateReportResult{}, fmt.Errorf("begin review report: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	review, err := tx.BundleReviews.Get(ctx, reviewUUID)
	if entdb.IsNotFound(err) {
		return repositories.CreateReportResult{}, repositories.ErrNotFound
	}
	if err != nil {
		return repositories.CreateReportResult{}, fmt.Errorf("find review for report: %w", err)
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
		return repositories.CreateReportResult{}, fmt.Errorf("create review report: %w", err)
	}
	if id != proposedID {
		return repositories.CreateReportResult{}, repositories.ErrConflict
	}
	if _, err := review.Update().AddReportCount(1).Save(ctx); err != nil {
		return repositories.CreateReportResult{}, fmt.Errorf("increment review report count: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return repositories.CreateReportResult{}, fmt.Errorf("commit review report: %w", err)
	}
	rollback = false
	return repositories.CreateReportResult{Status: "submitted", ReportID: id.String()}, nil
}

func (r *StorefrontRepository) TrackDownload(ctx context.Context, bundleID string, userID uuid.UUID, now time.Time) error {
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

func (r *StorefrontRepository) ListNotifications(ctx context.Context, userID uuid.UUID) ([]repositories.NotificationView, error) {
	rows, err := r.client.Notifications.Query().Where(notifications.RecipientIdEQ(userID), notifications.DeletedAtIsNil()).
		Order(notifications.ByCreatedAt(sql.OrderDesc()), notifications.ByID()).Limit(200).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list notifications: %w", err)
	}
	result := make([]repositories.NotificationView, 0, len(rows))
	for _, row := range rows {
		result = append(result, repositories.NotificationView{ID: row.ID.String(), Title: row.Title, Body: sfString(row.Body, ""), Type: row.Type, IsRead: row.IsRead, CreatedAt: row.CreatedAt})
	}
	return result, nil
}

func (r *StorefrontRepository) MarkNotificationRead(ctx context.Context, notificationID string, userID uuid.UUID, now time.Time) error {
	id, err := uuid.Parse(notificationID)
	if err != nil {
		return fmt.Errorf("%w: invalid notification id", repositories.ErrBadRequest)
	}
	count, err := r.client.Notifications.Update().Where(notifications.IDEQ(id), notifications.RecipientIdEQ(userID), notifications.DeletedAtIsNil()).SetIsRead(true).SetReadAt(now).SetUpdatedAt(now).Save(ctx)
	if err != nil {
		return fmt.Errorf("mark notification read: %w", err)
	}
	if count == 0 {
		return repositories.ErrNotFound
	}
	return nil
}

func (r *StorefrontRepository) MockCheckout(ctx context.Context, userID uuid.UUID, bundleID, idempotencyKey string, now time.Time) (repositories.CheckoutResult, error) {
	bundleUUID, err := r.resolvePublishedBundleID(ctx, bundleID)
	if err != nil {
		return repositories.CheckoutResult{}, err
	}
	digest := sha256.Sum256([]byte(userID.String() + ":" + idempotencyKey))
	transactionRef := "mock:" + hex.EncodeToString(digest[:])
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("begin mock checkout: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	bundle, err := tx.Bundles.Get(ctx, bundleUUID)
	if err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("load checkout bundle: %w", err)
	}
	amount, currency := 0.0, "VND"
	if bundle.Price != nil {
		amount = *bundle.Price
	}
	if bundle.Currency != nil && *bundle.Currency != "" {
		currency = *bundle.Currency
	}
	proposedID := uuid.New()
	orderID, err := tx.BundleOrders.Create().SetID(proposedID).SetBundleId(bundleUUID).SetUserId(userID).SetTotalAmount(amount).
		SetCurrency(currency).SetStatus("completed").SetPaymentProvider("mock").SetTransactionRef(transactionRef).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundleorders.FieldTransactionRef).Update(func(upsert *entdb.BundleOrdersUpsert) { upsert.SetTransactionRef(transactionRef) }).ID(ctx)
	if err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("create idempotent mock order: %w", err)
	}
	if orderID != proposedID {
		existing, err := tx.BundleOrders.Get(ctx, orderID)
		if err != nil {
			return repositories.CheckoutResult{}, fmt.Errorf("load idempotent mock order: %w", err)
		}
		if existing.UserId != userID || existing.BundleId != bundleUUID {
			return repositories.CheckoutResult{}, repositories.ErrConflict
		}
		if err := tx.Commit(); err != nil {
			return repositories.CheckoutResult{}, fmt.Errorf("commit idempotent checkout read: %w", err)
		}
		rollback = false
		return checkoutResponse(orderID), nil
	}
	if _, err := tx.BundlePaymentLogs.Create().SetID(uuid.New()).SetOrderId(orderID).SetProvider("mock").SetEvent("checkout.completed").SetRawPayload(`{}`).SetStatus("processed").SetCreatedAt(now).Save(ctx); err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("create mock payment log: %w", err)
	}
	if err := tx.BundleUserEntitlements.Create().SetID(uuid.New()).SetUserId(userID).SetBundleId(bundleUUID).SetOrderId(orderID).SetEntitlementType("purchase").SetIsActive(true).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundleuserentitlements.FieldUserId, bundleuserentitlements.FieldBundleId, bundleuserentitlements.FieldEntitlementType).
		Update(func(upsert *entdb.BundleUserEntitlementsUpsert) {
			upsert.SetOrderId(orderID).SetIsActive(true).ClearRevokedAt().SetUpdatedAt(now)
		}).Exec(ctx); err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("upsert mock entitlement: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return repositories.CheckoutResult{}, fmt.Errorf("commit mock checkout: %w", err)
	}
	rollback = false
	return checkoutResponse(orderID), nil
}

func checkoutResponse(orderID uuid.UUID) repositories.CheckoutResult {
	return repositories.CheckoutResult{TransactionID: orderID.String(), Status: "success", ReceiptURL: "mock://receipts/" + orderID.String()}
}
