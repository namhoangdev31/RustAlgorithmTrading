package postgres

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	entdb "trading/control-gateway/internal/data/ent"
	"trading/control-gateway/internal/data/ent/file"
	"trading/control-gateway/internal/data/ent/session"
	"trading/control-gateway/internal/data/ent/user"
	identity "trading/control-gateway/internal/modules/identity/application"
	"trading/control-gateway/internal/modules/identity/domain"
	"trading/control-gateway/internal/shared/apperror"
)

type Repository struct{ client *entdb.Client }

func New(client *entdb.Client) (*Repository, error) {
	if client == nil {
		return nil, apperror.WithMessage(apperror.ErrUnavailable, "identity database is not configured")
	}
	return &Repository{client: client}, nil
}

func (r *Repository) UpsertFirebaseUser(ctx context.Context, firebaseUser identity.FirebaseUser) (domain.User, error) {
	if firebaseUser.LocalID == "" {
		return domain.User{}, apperror.WithMessage(apperror.ErrInvalidArgument, "firebase local id is required")
	}
	now := time.Now().UTC()
	email := strings.ToLower(strings.TrimSpace(firebaseUser.Email))
	provider := strings.TrimSpace(firebaseUser.ProviderID)
	if provider == "" {
		provider = "firebase"
	}
	predicate := user.SocialIdEQ(firebaseUser.LocalID)
	if email != "" {
		predicate = user.Or(predicate, user.EmailEqualFold(email))
	}
	row, err := r.client.User.Query().Where(user.And(predicate, user.DeletedAtIsNil())).Only(ctx)
	if err != nil && !entdb.IsNotFound(err) {
		return domain.User{}, fmt.Errorf("find firebase user: %w", err)
	}
	socialID := firebaseUser.LocalID
	var emailPtr *string
	if email != "" {
		emailPtr = &email
	}
	firstName, lastName, fullName := splitDisplayName(firebaseUser.DisplayName)
	registerType := provider
	if entdb.IsNotFound(err) {
		row, err = r.client.User.Create().SetID(uuid.New()).SetNillableEmail(emailPtr).SetProvider(provider).SetSocialId(socialID).
			SetNillableFirstName(firstName).SetNillableLastName(lastName).SetNillableFullName(fullName).
			SetUserType("individual").SetRegisterType(registerType).SetCreatedAt(now).SetUpdatedAt(now).Save(ctx)
		if err != nil {
			return domain.User{}, fmt.Errorf("create firebase user: %w", err)
		}
		return mapUser(row), nil
	}
	update := row.Update().SetSocialId(socialID).SetUpdatedAt(now)
	if row.Provider == "" || row.Provider == "email" {
		update.SetProvider(provider)
	}
	if row.RegisterType == nil {
		update.SetRegisterType(provider)
	}
	if emailPtr != nil {
		update.SetEmail(email)
	}
	if firstName != nil {
		update.SetFirstName(*firstName)
	}
	if lastName != nil {
		update.SetLastName(*lastName)
	}
	if fullName != nil {
		update.SetFullName(*fullName)
	}
	row, err = update.Save(ctx)
	if err != nil {
		return domain.User{}, fmt.Errorf("update firebase user: %w", err)
	}
	return mapUser(row), nil
}

func (r *Repository) CreateSession(ctx context.Context, userID uuid.UUID, tokenHash string, now time.Time) error {
	if _, err := r.client.Session.Create().SetID(uuid.New()).SetUserId(userID).SetHash(tokenHash).SetCreatedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return fmt.Errorf("create refresh session: %w", err)
	}
	return nil
}

func (r *Repository) RotateSession(ctx context.Context, oldHash, newHash string, refreshTTL time.Duration, now time.Time) (domain.User, error) {
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return domain.User{}, fmt.Errorf("begin refresh rotation: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	current, err := tx.Session.Query().Where(session.HashEQ(oldHash), session.DeletedAtIsNil()).ForUpdate().Only(ctx)
	if entdb.IsNotFound(err) {
		return domain.User{}, apperror.ErrUnauthorized
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("lock refresh session: %w", err)
	}
	if now.After(current.CreatedAt.Add(refreshTTL)) {
		_, _ = current.Update().SetDeletedAt(now).SetUpdatedAt(now).Save(ctx)
		return domain.User{}, apperror.ErrUnauthorized
	}
	if _, err := current.Update().SetDeletedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return domain.User{}, fmt.Errorf("revoke refresh session: %w", err)
	}
	account, err := tx.User.Query().Where(user.IDEQ(current.UserId), user.DeletedAtIsNil()).Only(ctx)
	if entdb.IsNotFound(err) {
		return domain.User{}, apperror.ErrUnauthorized
	}
	if err != nil {
		return domain.User{}, fmt.Errorf("load refresh user: %w", err)
	}
	if _, err := tx.Session.Create().SetID(uuid.New()).SetUserId(account.ID).SetHash(newHash).SetCreatedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return domain.User{}, fmt.Errorf("create rotated session: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return domain.User{}, fmt.Errorf("commit refresh rotation: %w", err)
	}
	rollback = false
	return mapUser(account), nil
}

func (r *Repository) FindUserByID(ctx context.Context, userID uuid.UUID) (identity.UserView, error) {
	row, err := r.client.User.Query().Where(user.IDEQ(userID), user.DeletedAtIsNil()).WithPhoto(func(query *entdb.FileQuery) { query.Select(file.FieldPath) }).Only(ctx)
	if entdb.IsNotFound(err) {
		return identity.UserView{}, apperror.ErrNotFound
	}
	if err != nil {
		return identity.UserView{}, fmt.Errorf("find user profile: %w", err)
	}
	return mapView(row), nil
}

func (r *Repository) ListUsers(ctx context.Context) ([]identity.UserView, error) {
	rows, err := r.client.User.Query().Where(user.DeletedAtIsNil()).WithPhoto(func(query *entdb.FileQuery) { query.Select(file.FieldPath) }).Order(entdb.Desc(user.FieldCreatedAt)).Limit(500).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	result := make([]identity.UserView, 0, len(rows))
	for _, row := range rows {
		result = append(result, mapView(row))
	}
	return result, nil
}

func mapUser(row *entdb.User) domain.User {
	return domain.User{ID: row.ID, Email: row.Email, Password: row.Password, Provider: row.Provider, SocialID: row.SocialId,
		FirstName: row.FirstName, LastName: row.LastName, FullName: row.FullName, Phone: row.Phone, DateOfBirth: row.DateOfBirth,
		Gender: row.Gender, UserType: row.UserType, PhotoID: row.PhotoId, RegisterType: row.RegisterType,
		CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt}
}

func mapView(row *entdb.User) identity.UserView {
	updatedAt := row.UpdatedAt
	view := identity.UserView{ID: row.ID.String(), Email: row.Email, Phone: row.Phone, SocialID: row.SocialId,
		FirstName: row.FirstName, LastName: row.LastName, FullName: row.FullName, UserType: row.UserType,
		CreatedAt: row.CreatedAt, UpdatedAt: &updatedAt}
	if row.Edges.Photo != nil {
		view.PhotoURL = &row.Edges.Photo.Path
	}
	return view
}

func splitDisplayName(value string) (*string, *string, *string) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil, nil
	}
	parts := strings.Fields(value)
	first := parts[0]
	var last *string
	if len(parts) > 1 {
		joined := strings.Join(parts[1:], " ")
		last = &joined
	}
	return &first, last, &value
}
