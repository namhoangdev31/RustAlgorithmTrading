package database

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// QuestDB owns only the PgWire connection lifecycle. Query semantics belong to
// the operations module's outbound adapter.
type QuestDB struct{ db *sql.DB }

func NewQuestDBReader(connectionString string) (*QuestDB, error) {
	if connectionString == "" {
		return nil, errors.New("questdb connection string is empty")
	}
	db, err := sql.Open("pgx", connectionString)
	if err != nil {
		return nil, fmt.Errorf("open questdb: %w", err)
	}
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetMaxIdleConns(5)
	db.SetMaxOpenConns(10)
	return &QuestDB{db: db}, nil
}

func (q *QuestDB) DB() *sql.DB {
	if q == nil {
		return nil
	}
	return q.db
}

func (q *QuestDB) Ping() error {
	if q == nil || q.db == nil {
		return errors.New("questdb is not configured")
	}
	return q.db.Ping()
}

func (q *QuestDB) Close() error {
	if q == nil || q.db == nil {
		return nil
	}
	return q.db.Close()
}
