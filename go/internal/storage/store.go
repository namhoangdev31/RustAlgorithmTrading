package storage

import (
	"errors"
)

// Store bundles read-only data sources used by the Go control-plane.
// DuckDB is used for metrics/analytics (OLAP).
// PostgreSQL is used for persistence/trades (OLTP) in production.
type Store struct {
	duckdb   *DuckDBReader
	postgres *PostgresReader
}

func NewStore(duckdb *DuckDBReader, postgres *PostgresReader) *Store {
	return &Store{
		duckdb:   duckdb,
		postgres: postgres,
	}
}

func (s *Store) Close() error {
	var errs []error
	if s.duckdb != nil {
		if err := s.duckdb.Close(); err != nil {
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

func (s *Store) PingDuckDB() error {
	if s.duckdb == nil {
		return errors.New("duckdb not configured")
	}
	return s.duckdb.Ping()
}

func (s *Store) PingPostgres() error {
	if s.postgres == nil {
		return errors.New("postgres not configured")
	}
	return s.postgres.Ping()
}

func (s *Store) DuckDB() *DuckDBReader {
	return s.duckdb
}

func (s *Store) Postgres() *PostgresReader {
	return s.postgres
}
