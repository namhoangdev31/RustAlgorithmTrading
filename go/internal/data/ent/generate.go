// Package ent contains the Prisma-derived, type-safe PostgreSQL client.
//
//go:generate go run entgo.io/ent/cmd/ent generate --feature sql/upsert,sql/lock,sql/modifier,intercept,schema/snapshot ./schema
//go:generate gofmt -w soft_delete.go schema
package ent
