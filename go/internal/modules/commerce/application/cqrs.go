package application

import (
	"context"

	shared "trading/control-gateway/internal/shared/application"
)

type PaymentMethodsQuery struct{}
type PaymentMethodsHandler struct{ service *Service }

func NewPaymentMethodsHandler(service *Service) PaymentMethodsHandler {
	return PaymentMethodsHandler{service: service}
}
func (h PaymentMethodsHandler) Handle(ctx context.Context, _ PaymentMethodsQuery) ([]PaymentMethod, error) {
	return h.service.PaymentMethods(ctx)
}

type SavePaymentMethodCommand struct{ CardToken string }
type SavePaymentMethodResult struct {
	Status string
	ID     string
}
type SavePaymentMethodHandler struct{ service *Service }

func NewSavePaymentMethodHandler(service *Service) SavePaymentMethodHandler {
	return SavePaymentMethodHandler{service: service}
}
func (h SavePaymentMethodHandler) Handle(ctx context.Context, command SavePaymentMethodCommand) (SavePaymentMethodResult, error) {
	return h.service.SavePaymentMethod(ctx, command.CardToken)
}

type CheckoutCommand struct {
	Principal       shared.Principal
	BundleID        string
	PaymentMethodID string
	IdempotencyKey  string
}
type CheckoutHandler struct{ service *Service }

func NewCheckoutHandler(service *Service) CheckoutHandler { return CheckoutHandler{service: service} }
func (h CheckoutHandler) Handle(ctx context.Context, command CheckoutCommand) (CheckoutResult, error) {
	return h.service.Checkout(ctx, command.Principal, command.BundleID, command.PaymentMethodID, command.IdempotencyKey)
}
