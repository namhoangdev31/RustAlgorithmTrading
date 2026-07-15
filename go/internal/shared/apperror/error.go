package apperror

import (
	"errors"
	"fmt"
)

type Code string

const (
	CodeInvalidArgument Code = "invalid_argument"
	CodeUnauthorized    Code = "unauthorized"
	CodeForbidden       Code = "forbidden"
	CodeNotFound        Code = "not_found"
	CodeConflict        Code = "conflict"
	CodeUnavailable     Code = "unavailable"
	CodeInternal        Code = "internal"
)

type Error struct {
	Code    Code
	Message string
	Cause   error
}

func (e *Error) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return string(e.Code)
}

func (e *Error) Unwrap() error { return e.Cause }

func New(code Code, message string) error {
	return &Error{Code: code, Message: message}
}

func Wrap(code Code, message string, cause error) error {
	if cause == nil {
		return New(code, message)
	}
	return &Error{Code: code, Message: message, Cause: cause}
}

func WithMessage(err error, message string) error {
	var appErr *Error
	if errors.As(err, &appErr) {
		return &Error{Code: appErr.Code, Message: message, Cause: err}
	}
	return fmt.Errorf("%s: %w", message, err)
}

func IsCode(err error, code Code) bool {
	var appErr *Error
	return errors.As(err, &appErr) && appErr.Code == code
}

var (
	ErrInvalidArgument = New(CodeInvalidArgument, "bad request")
	ErrUnauthorized    = New(CodeUnauthorized, "unauthorized")
	ErrForbidden       = New(CodeForbidden, "forbidden")
	ErrNotFound        = New(CodeNotFound, "not found")
	ErrConflict        = New(CodeConflict, "conflict")
	ErrUnavailable     = New(CodeUnavailable, "service unavailable")
	ErrInternal        = New(CodeInternal, "internal server error")
)
