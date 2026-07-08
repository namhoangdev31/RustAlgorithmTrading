package storage

import (
	"errors"
)

// Store bundles read-only data sources used by the Go control-plane.
// DuckDB is used for metrics/analytics (OLAP).
// PostgreSQL is used for persistence/trades (OLTP) in production.
type Store struct {
	questdb  *QuestDBReader
	postgres *PostgresReader
}

func NewStore(questdb *QuestDBReader, postgres *PostgresReader) *Store {
	return &Store{
		questdb:  questdb,
		postgres: postgres,
	}
}

func (s *Store) Close() error {
	var errs []error
	if s.questdb != nil {
		if err := s.questdb.Close(); err != nil {
			errs = append(errs, err)
		}
	}
	if s.postgres != nil {
		if err := s.postgres.Close(); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}

func (s *Store) PingQuestDB() error {
	if s.questdb == nil {
		return errors.New("questdb not configured")
	}
	return s.questdb.Ping()
}

func (s *Store) PingPostgres() error {
	if s.postgres == nil {
		return errors.New("postgres not configured")
	}
	return s.postgres.Ping()
}

func (s *Store) QuestDB() *QuestDBReader {
	return s.questdb
}

func (s *Store) Postgres() *PostgresReader {
	return s.postgres
}
