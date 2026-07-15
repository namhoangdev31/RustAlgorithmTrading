package storage

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

type PostgresReader struct {
	db     *sql.DB
	client *entdb.Client
}

func NewPostgresReader(connString string) (*PostgresReader, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := sql.Open("pgx", connString)
	if err != nil {
		return nil, fmt.Errorf("failed to open ent postgres driver: %w", err)
	}
	if err := db.PingContext(ctx); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("failed to ping ent postgres driver: %w", err)
	}
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetMaxIdleConns(10)
	db.SetMaxOpenConns(30)

	client := entdb.NewClient(entdb.Driver(entsql.OpenDB(dialect.Postgres, db)))
	client.Intercept(entdb.SoftDeleteInterceptor())
	client.Use(entdb.SoftDeleteHook())
	return &PostgresReader{db: db, client: client}, nil
}

func (r *PostgresReader) Ent() *entdb.Client {
	if r == nil {
		return nil
	}
	return r.client
}

func (r *PostgresReader) Close() error {
	if r.client != nil {
		return r.client.Close()
	}
	if r.db != nil {
		return r.db.Close()
	}
	return nil
}

func (r *PostgresReader) Ping() error {
	if r.db == nil {
		return errors.New("postgres database is nil")
	}
	return r.db.PingContext(context.Background())
}

func (r *PostgresReader) WithTx(ctx context.Context, fn func(*entdb.Tx) error) (err error) {
	if r == nil || r.client == nil {
		return errors.New("postgres client is nil")
	}
	tx, err := r.client.Tx(ctx)
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
	if err = fn(tx); err != nil {
		return err
	}
	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit postgres transaction: %w", err)
	}
	return nil
}
