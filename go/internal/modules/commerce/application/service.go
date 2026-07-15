package application

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"

	"trading/control-gateway/internal/shared/apperror"
	shared "trading/control-gateway/internal/shared/application"
)

type Service struct {
	repo         Repository
	transactor   shared.Transactor
	events       shared.EventAppender
	mockPayments bool
	now          func() time.Time
}

func NewService(repo Repository, transactor shared.Transactor, events shared.EventAppender, mockPayments bool) *Service {
	return &Service{repo: repo, transactor: transactor, events: events, mockPayments: mockPayments, now: func() time.Time { return time.Now().UTC() }}
}

func (s *Service) PaymentMethods(context.Context) ([]PaymentMethod, error) {
	if !s.mockPayments {
		return nil, apperror.ErrUnavailable
	}
	return []PaymentMethod{{ID: "mock_card_4242", Type: "credit_card", Brand: "Visa", Last4: "4242", IsDefault: true}}, nil
}

func (s *Service) SavePaymentMethod(_ context.Context, cardToken string) (SavePaymentMethodResult, error) {
	if !s.mockPayments {
		return SavePaymentMethodResult{}, apperror.ErrUnavailable
	}
	if !strings.HasPrefix(strings.TrimSpace(cardToken), "tok_") {
		return SavePaymentMethodResult{}, apperror.WithMessage(apperror.ErrInvalidArgument, "invalid sandbox card token")
	}
	return SavePaymentMethodResult{Status: "saved", ID: "mock_card_4242"}, nil
}

func (s *Service) Checkout(ctx context.Context, principal shared.Principal, bundleID, paymentMethodID, idempotencyKey string) (CheckoutResult, error) {
	if !s.mockPayments {
		return CheckoutResult{}, apperror.ErrUnavailable
	}
	if strings.TrimSpace(bundleID) == "" || strings.TrimSpace(paymentMethodID) == "" || strings.TrimSpace(idempotencyKey) == "" {
		return CheckoutResult{}, apperror.WithMessage(apperror.ErrInvalidArgument, "bundleId, paymentMethodId and Idempotency-Key are required")
	}
	if paymentMethodID != "mock_card_4242" {
		return CheckoutResult{}, apperror.WithMessage(apperror.ErrInvalidArgument, "unknown mock payment method")
	}
	if len(idempotencyKey) > 255 {
		return CheckoutResult{}, apperror.WithMessage(apperror.ErrInvalidArgument, "Idempotency-Key is too long")
	}
	userID, err := uuid.Parse(principal.UserID)
	if err != nil {
		return CheckoutResult{}, apperror.ErrUnauthorized
	}
	var result CheckoutResult
	err = s.transactor.Within(ctx, func(txCtx context.Context) error {
		var checkoutErr error
		result, checkoutErr = s.repo.MockCheckout(txCtx, userID, bundleID, idempotencyKey, s.now())
		if checkoutErr != nil {
			return checkoutErr
		}
		payload, marshalErr := json.Marshal(map[string]string{"orderId": result.TransactionID, "bundleId": bundleID, "userId": userID.String()})
		if marshalErr != nil {
			return marshalErr
		}
		eventID := uuid.New()
		return s.events.Append(txCtx, shared.Event{
			ID: eventID, EventKey: "checkout.completed:" + result.TransactionID, Type: "checkout.completed", Version: 1,
			AggregateType: "bundle_order", AggregateID: result.TransactionID, OccurredAt: s.now(), Payload: payload,
		})
	})
	return result, err
}
