package application

import "context"

type CommandHandler[C any, R any] interface {
	Handle(context.Context, C) (R, error)
}

type QueryHandler[Q any, R any] interface {
	Handle(context.Context, Q) (R, error)
}
