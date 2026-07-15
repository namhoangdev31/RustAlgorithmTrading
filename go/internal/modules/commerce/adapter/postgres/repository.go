package postgres

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/bundleorders"
	"trading/control-gateway/internal/data/ent/bundles"
	"trading/control-gateway/internal/data/ent/bundleuserentitlements"
	entschema "trading/control-gateway/internal/data/ent/schema"
	commerce "trading/control-gateway/internal/modules/commerce/application"
	"trading/control-gateway/internal/platform/database"
	"trading/control-gateway/internal/shared/apperror"
)

type Repository struct{ database *database.Postgres }

func New(database *database.Postgres) (*Repository, error) {
	if database == nil || database.Ent() == nil {
		return nil, apperror.WithMessage(apperror.ErrUnavailable, "commerce database is not configured")
	}
	return &Repository{database: database}, nil
}

func (r *Repository) MockCheckout(ctx context.Context, userID uuid.UUID, bundleID, idempotencyKey string, now time.Time) (commerce.CheckoutResult, error) {
	client := r.database.Client(ctx)
	bundleUUID, err := resolvePublishedBundleID(ctx, client, bundleID)
	if err != nil {
		return commerce.CheckoutResult{}, err
	}
	digest := sha256.Sum256([]byte(userID.String() + ":" + idempotencyKey))
	transactionRef := "mock:" + hex.EncodeToString(digest[:])
	bundle, err := client.Bundles.Get(ctx, bundleUUID)
	if err != nil {
		return commerce.CheckoutResult{}, fmt.Errorf("load checkout bundle: %w", err)
	}
	amount, currency := 0.0, "VND"
	if bundle.Price != nil {
		amount = *bundle.Price
	}
	if bundle.Currency != nil && *bundle.Currency != "" {
		currency = *bundle.Currency
	}
	proposedID := uuid.New()
	orderID, err := client.BundleOrders.Create().
		SetID(proposedID).SetBundleId(bundleUUID).SetUserId(userID).SetTotalAmount(amount).
		SetCurrency(currency).SetStatus("completed").SetPaymentProvider("mock").SetTransactionRef(transactionRef).
		SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundleorders.FieldTransactionRef).
		Update(func(upsert *entdb.BundleOrdersUpsert) { upsert.SetTransactionRef(transactionRef) }).
		ID(ctx)
	if err != nil {
		return commerce.CheckoutResult{}, fmt.Errorf("create idempotent mock order: %w", err)
	}
	if orderID != proposedID {
		existing, err := client.BundleOrders.Get(ctx, orderID)
		if err != nil {
			return commerce.CheckoutResult{}, fmt.Errorf("load idempotent mock order: %w", err)
		}
		if existing.UserId != userID || existing.BundleId != bundleUUID {
			return commerce.CheckoutResult{}, apperror.ErrConflict
		}
		return checkoutResponse(orderID), nil
	}
	if _, err := client.BundlePaymentLogs.Create().
		SetID(uuid.New()).SetOrderId(orderID).SetProvider("mock").SetEvent("checkout.completed").
		SetRawPayload("{}").SetStatus("processed").SetCreatedAt(now).Save(ctx); err != nil {
		return commerce.CheckoutResult{}, fmt.Errorf("create mock payment log: %w", err)
	}
	if err := client.BundleUserEntitlements.Create().
		SetID(uuid.New()).SetUserId(userID).SetBundleId(bundleUUID).SetOrderId(orderID).
		SetEntitlementType("purchase").SetIsActive(true).SetCreatedAt(now).SetUpdatedAt(now).
		OnConflictColumns(bundleuserentitlements.FieldUserId, bundleuserentitlements.FieldBundleId, bundleuserentitlements.FieldEntitlementType).
		Update(func(upsert *entdb.BundleUserEntitlementsUpsert) {
			upsert.SetOrderId(orderID).SetIsActive(true).ClearRevokedAt().SetUpdatedAt(now)
		}).Exec(ctx); err != nil {
		return commerce.CheckoutResult{}, fmt.Errorf("upsert mock entitlement: %w", err)
	}
	return checkoutResponse(orderID), nil
}

func resolvePublishedBundleID(ctx context.Context, client *entdb.Client, value string) (uuid.UUID, error) {
	query := client.Bundles.Query().Where(bundles.StatusEQ(entschema.BundleCatalogStatusPublished), bundles.DeletedAtIsNil())
	if id, err := uuid.Parse(value); err == nil {
		query.Where(bundles.IDEQ(id))
	} else {
		query.Where(bundles.Or(bundles.BundleKeyEQ(value), bundles.SlugEQ(value)))
	}
	id, err := query.OnlyID(ctx)
	if entdb.IsNotFound(err) {
		return uuid.Nil, apperror.ErrNotFound
	}
	if err != nil {
		return uuid.Nil, fmt.Errorf("resolve checkout bundle: %w", err)
	}
	return id, nil
}

func checkoutResponse(orderID uuid.UUID) commerce.CheckoutResult {
	return commerce.CheckoutResult{TransactionID: orderID.String(), Status: "success", ReceiptURL: "mock://receipts/" + orderID.String()}
}
