package httpadapter

import (
	"net/http"

	"github.com/gin-gonic/gin"

	commerce "trading/control-gateway/internal/modules/commerce/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

type Handler struct {
	paymentMethods    commerce.PaymentMethodsHandler
	savePaymentMethod commerce.SavePaymentMethodHandler
	checkout          commerce.CheckoutHandler
}

func New(service *commerce.Service) *Handler {
	return &Handler{paymentMethods: commerce.NewPaymentMethodsHandler(service), savePaymentMethod: commerce.NewSavePaymentMethodHandler(service), checkout: commerce.NewCheckoutHandler(service)}
}

func (h *Handler) PaymentMethods(c *gin.Context) {
	methods, err := h.paymentMethods.Handle(c.Request.Context(), commerce.PaymentMethodsQuery{})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	response := make([]gin.H, 0, len(methods))
	for _, method := range methods {
		response = append(response, gin.H{"id": method.ID, "type": method.Type, "brand": method.Brand, "last4": method.Last4, "isDefault": method.IsDefault})
	}
	c.JSON(http.StatusOK, response)
}

func (h *Handler) SavePaymentMethod(c *gin.Context) {
	var request struct {
		CardToken string `json:"cardToken"`
	}
	if c.ShouldBindJSON(&request) != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	response, err := h.savePaymentMethod.Handle(c.Request.Context(), commerce.SavePaymentMethodCommand{CardToken: request.CardToken})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": response.Status, "id": response.ID})
}

func (h *Handler) Checkout(c *gin.Context) {
	var request struct {
		BundleID        string `json:"bundleId"`
		PaymentMethodID string `json:"paymentMethodId"`
	}
	if c.ShouldBindJSON(&request) != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	principal, ok := httpx.Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	result, err := h.checkout.Handle(c.Request.Context(), commerce.CheckoutCommand{Principal: principal, BundleID: request.BundleID, PaymentMethodID: request.PaymentMethodID, IdempotencyKey: c.GetHeader("Idempotency-Key")})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"transactionId": result.TransactionID, "status": result.Status, "receiptUrl": result.ReceiptURL})
}
