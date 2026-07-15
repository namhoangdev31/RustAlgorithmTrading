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
	"trading/control-gateway/internal/domain/entities"
	"trading/control-gateway/internal/domain/repositories"
)

func (r *StorefrontRepository) UpsertFirebaseUser(ctx context.Context, firebaseUser repositories.FirebaseUser) (entities.User, error) {
	if firebaseUser.LocalID == "" {
		return entities.User{}, fmt.Errorf("%w: firebase local id is required", repositories.ErrBadRequest)
	}

	now := time.Now().UTC()
	email := strings.ToLower(strings.TrimSpace(firebaseUser.Email))
	provider := strings.TrimSpace(firebaseUser.ProviderID)
	if provider == "" {
		provider = "firebase"
	}
	identity := user.SocialIdEQ(firebaseUser.LocalID)
	if email != "" {
		identity = user.Or(identity, user.EmailEqualFold(email))
	}
	row, err := r.client.User.Query().Where(user.And(identity, user.DeletedAtIsNil())).Only(ctx)
	if err != nil && !entdb.IsNotFound(err) {
		return entities.User{}, fmt.Errorf("find firebase user: %w", err)
	}

	socialID := firebaseUser.LocalID
	var emailPtr *string
	if email != "" {
		emailPtr = &email
	}
	firstName, lastName, fullName := splitDisplayName(firebaseUser.DisplayName)
	registerType := provider
	if entdb.IsNotFound(err) {
		row, err = r.client.User.Create().
			SetID(uuid.New()).SetNillableEmail(emailPtr).SetProvider(provider).SetSocialId(socialID).
			SetNillableFirstName(firstName).SetNillableLastName(lastName).SetNillableFullName(fullName).
			SetUserType("individual").SetRegisterType(registerType).SetCreatedAt(now).SetUpdatedAt(now).
			Save(ctx)
		if err != nil {
			return entities.User{}, fmt.Errorf("create firebase user: %w", err)
		}
		return userEntity(row), nil
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
		return entities.User{}, fmt.Errorf("update firebase user: %w", err)
	}
	return userEntity(row), nil
}

func (r *StorefrontRepository) CreateSession(ctx context.Context, userID uuid.UUID, tokenHash string, now time.Time) error {
	if _, err := r.client.Session.Create().SetID(uuid.New()).SetUserId(userID).SetHash(tokenHash).SetCreatedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return fmt.Errorf("create refresh session: %w", err)
	}
	return nil
}

func (r *StorefrontRepository) RotateSession(ctx context.Context, oldHash, newHash string, refreshTTL time.Duration, now time.Time) (entities.User, error) {
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return entities.User{}, fmt.Errorf("begin refresh rotation: %w", err)
	}
	rollback := true
	defer func() {
		if rollback {
			_ = tx.Rollback()
		}
	}()
	current, err := tx.Session.Query().Where(session.HashEQ(oldHash), session.DeletedAtIsNil()).ForUpdate().Only(ctx)
	if entdb.IsNotFound(err) {
		return entities.User{}, repositories.ErrUnauthorized
	}
	if err != nil {
		return entities.User{}, fmt.Errorf("lock refresh session: %w", err)
	}
	if now.After(current.CreatedAt.Add(refreshTTL)) {
		_, _ = current.Update().SetDeletedAt(now).SetUpdatedAt(now).Save(ctx)
		return entities.User{}, repositories.ErrUnauthorized
	}
	if _, err := current.Update().SetDeletedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return entities.User{}, fmt.Errorf("revoke refresh session: %w", err)
	}
	account, err := tx.User.Query().Where(user.IDEQ(current.UserId), user.DeletedAtIsNil()).Only(ctx)
	if entdb.IsNotFound(err) {
		return entities.User{}, repositories.ErrUnauthorized
	}
	if err != nil {
		return entities.User{}, fmt.Errorf("load refresh user: %w", err)
	}
	if _, err := tx.Session.Create().SetID(uuid.New()).SetUserId(account.ID).SetHash(newHash).SetCreatedAt(now).SetUpdatedAt(now).Save(ctx); err != nil {
		return entities.User{}, fmt.Errorf("create rotated session: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return entities.User{}, fmt.Errorf("commit refresh rotation: %w", err)
	}
	rollback = false
	return userEntity(account), nil
}

func (r *StorefrontRepository) FindUserByID(ctx context.Context, userID uuid.UUID) (repositories.UserView, error) {
	row, err := r.client.User.Query().Where(user.IDEQ(userID), user.DeletedAtIsNil()).WithPhoto(func(query *entdb.FileQuery) {
		query.Select(file.FieldPath)
	}).Only(ctx)
	if entdb.IsNotFound(err) {
		return repositories.UserView{}, repositories.ErrNotFound
	}
	if err != nil {
		return repositories.UserView{}, fmt.Errorf("find user profile: %w", err)
	}
	return userView(row), nil
}

func (r *StorefrontRepository) ListUsers(ctx context.Context) ([]repositories.UserView, error) {
	rows, err := r.client.User.Query().Where(user.DeletedAtIsNil()).WithPhoto(func(query *entdb.FileQuery) {
		query.Select(file.FieldPath)
	}).Order(entdb.Desc(user.FieldCreatedAt)).Limit(500).All(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	result := make([]repositories.UserView, 0, len(rows))
	for _, row := range rows {
		result = append(result, userView(row))
	}
	return result, nil
}

func userEntity(row *entdb.User) entities.User {
	return entities.User{
		ID: row.ID, Email: row.Email, Password: row.Password, Provider: row.Provider, SocialID: row.SocialId,
		FirstName: row.FirstName, LastName: row.LastName, FullName: row.FullName, Phone: row.Phone,
		DateOfBirth: row.DateOfBirth, Gender: row.Gender, UserType: row.UserType, PhotoID: row.PhotoId,
		RegisterType: row.RegisterType, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func userView(row *entdb.User) repositories.UserView {
	updatedAt := row.UpdatedAt
	view := repositories.UserView{
		ID: row.ID.String(), Email: row.Email, Phone: row.Phone, SocialID: row.SocialId,
		FirstName: row.FirstName, LastName: row.LastName, FullName: row.FullName,
		UserType: row.UserType, CreatedAt: row.CreatedAt, UpdatedAt: &updatedAt,
	}
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
