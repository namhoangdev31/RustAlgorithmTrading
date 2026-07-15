package database

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "github.com/jackc/pgx/v5/stdlib"

	entdb "trading/control-gateway/internal/data/ent"
)

type txKey struct{}

type Postgres struct {
	db     *sql.DB
	client *entdb.Client
}

func EntClient(postgres *Postgres) *entdb.Client {
	if postgres == nil {
		return nil
	}
	return postgres.Ent()
}

func OpenPostgres(ctx context.Context, connectionString string) (*Postgres, error) {
	if connectionString == "" {
		return nil, errors.New("postgres connection string is empty")
	}
	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		return nil, fmt.Errorf("open postgres: %w", err)
	}
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(30)
	pingCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	if err := db.PingContext(pingCtx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}
	client := entdb.NewClient(entdb.Driver(entsql.OpenDB(dialect.Postgres, db)))
	client.Intercept(entdb.SoftDeleteInterceptor())
	client.Use(entdb.SoftDeleteHook())
	return &Postgres{db: db, client: client}, nil
}

func (p *Postgres) Ent() *entdb.Client {
	if p == nil {
		return nil
	}
	return p.client
}

func (p *Postgres) Client(ctx context.Context) *entdb.Client {
	if tx, ok := ctx.Value(txKey{}).(*entdb.Tx); ok {
		return tx.Client()
	}
	return p.Ent()
}

func (p *Postgres) Within(ctx context.Context, fn func(context.Context) error) (err error) {
	if p == nil || p.client == nil {
		return errors.New("postgres is not configured")
	}
	if _, nested := ctx.Value(txKey{}).(*entdb.Tx); nested {
		return fn(ctx)
	}
	tx, err := p.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("begin postgres transaction: %w", err)
	}
	defer func() {
		if recovered := recover(); recovered != nil {
			_ = tx.Rollback()
			panic(recovered)
		}
		if err != nil {
			_ = tx.Rollback()
		}
	}()
	if err = fn(context.WithValue(ctx, txKey{}, tx)); err != nil {
		return err
	}
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit postgres transaction: %w", err)
	}
	return nil
}

func (p *Postgres) Ping(ctx context.Context) error {
	if p == nil || p.db == nil {
		return errors.New("postgres is not configured")
	}
	return p.db.PingContext(ctx)
}

func (p *Postgres) Close() error {
	if p == nil {
		return nil
	}
	if p.client != nil {
		return p.client.Close()
	}
	if p.db != nil {
		return p.db.Close()
	}
	return nil
}
