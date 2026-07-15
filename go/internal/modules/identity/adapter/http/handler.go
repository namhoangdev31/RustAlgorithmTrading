package httpadapter

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	identity "trading/control-gateway/internal/modules/identity/application"
	"trading/control-gateway/internal/platform/httpx"
	"trading/control-gateway/internal/shared/apperror"
)

type Handler struct {
	firebase identity.FirebaseLoginHandler
	refresh  identity.RefreshHandler
	me       identity.MeHandler
	users    identity.UsersHandler
}

func New(service identity.ServicePort) *Handler {
	return &Handler{firebase: identity.NewFirebaseLoginHandler(service), refresh: identity.NewRefreshHandler(service), me: identity.NewMeHandler(service), users: identity.NewUsersHandler(service)}
}

func (h *Handler) Firebase(c *gin.Context) {
	var request struct {
		IDToken string `json:"idToken"`
	}
	if c.ShouldBindJSON(&request) != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	response, err := h.firebase.Handle(c.Request.Context(), identity.FirebaseLoginCommand{IDToken: request.IDToken})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, mapTokens(response))
}

func (h *Handler) Refresh(c *gin.Context) {
	var request struct {
		RefreshToken string `json:"refreshToken"`
	}
	if c.ShouldBindJSON(&request) != nil {
		httpx.WriteError(c, apperror.ErrInvalidArgument)
		return
	}
	response, err := h.refresh.Handle(c.Request.Context(), identity.RefreshCommand{RefreshToken: request.RefreshToken})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, mapTokens(response))
}

func (h *Handler) Me(c *gin.Context) {
	principal, ok := Principal(c)
	if !ok {
		httpx.WriteError(c, apperror.ErrUnauthorized)
		return
	}
	response, err := h.me.Handle(c.Request.Context(), identity.MeQuery{Principal: principal})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, mapUser(response))
}

func (h *Handler) Users(c *gin.Context) {
	users, err := h.users.Handle(c.Request.Context(), identity.UsersQuery{})
	if err != nil {
		httpx.WriteError(c, err)
		return
	}
	response := make([]userResponse, 0, len(users))
	for _, user := range users {
		response = append(response, mapUser(user))
	}
	c.JSON(http.StatusOK, response)
}

type tokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int    `json:"expiresIn"`
}

func mapTokens(value identity.TokenResponse) tokenResponse {
	return tokenResponse{AccessToken: value.AccessToken, RefreshToken: value.RefreshToken, ExpiresIn: value.ExpiresIn}
}

type userResponse struct {
	ID        string     `json:"id"`
	Email     *string    `json:"email"`
	Phone     *string    `json:"phone"`
	SocialID  *string    `json:"socialId,omitempty"`
	FirstName *string    `json:"firstName,omitempty"`
	LastName  *string    `json:"lastName,omitempty"`
	FullName  *string    `json:"fullName,omitempty"`
	PhotoURL  *string    `json:"photoUrl,omitempty"`
	UserType  string     `json:"userType"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}

func mapUser(user identity.UserView) userResponse {
	return userResponse{ID: user.ID, Email: user.Email, Phone: user.Phone, SocialID: user.SocialID,
		FirstName: user.FirstName, LastName: user.LastName, FullName: user.FullName, PhotoURL: user.PhotoURL,
		UserType: user.UserType, CreatedAt: user.CreatedAt, UpdatedAt: user.UpdatedAt}
}
