package httpx

import (
	"github.com/gin-gonic/gin"

	shared "trading/control-gateway/internal/shared/application"
)

const principalKey = "authenticated_principal"

func SetPrincipal(c *gin.Context, principal shared.Principal) {
	c.Set(principalKey, principal)
}

func Principal(c *gin.Context) (shared.Principal, bool) {
	value, ok := c.Get(principalKey)
	if !ok {
		return shared.Principal{}, false
	}
	principal, ok := value.(shared.Principal)
	return principal, ok
}
