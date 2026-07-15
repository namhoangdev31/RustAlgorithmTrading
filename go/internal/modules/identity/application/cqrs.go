package application

import "context"

type FirebaseLoginCommand struct{ IDToken string }
type FirebaseLoginHandler struct{ commands Commands }

func NewFirebaseLoginHandler(commands Commands) FirebaseLoginHandler {
	return FirebaseLoginHandler{commands: commands}
}
func (h FirebaseLoginHandler) Handle(ctx context.Context, command FirebaseLoginCommand) (TokenResponse, error) {
	return h.commands.LoginWithFirebase(ctx, command.IDToken)
}

type RefreshCommand struct{ RefreshToken string }
type RefreshHandler struct{ commands Commands }

func NewRefreshHandler(commands Commands) RefreshHandler { return RefreshHandler{commands: commands} }
func (h RefreshHandler) Handle(ctx context.Context, command RefreshCommand) (TokenResponse, error) {
	return h.commands.Refresh(ctx, command.RefreshToken)
}

type MeQuery struct{ Principal Principal }
type MeHandler struct{ queries Queries }

func NewMeHandler(queries Queries) MeHandler { return MeHandler{queries: queries} }
func (h MeHandler) Handle(ctx context.Context, query MeQuery) (UserView, error) {
	return h.queries.Me(ctx, query.Principal)
}

type UsersQuery struct{}
type UsersHandler struct{ queries Queries }

func NewUsersHandler(queries Queries) UsersHandler { return UsersHandler{queries: queries} }
func (h UsersHandler) Handle(ctx context.Context, _ UsersQuery) ([]UserView, error) {
	return h.queries.ListUsers(ctx)
}
