package httpserver

import (
	"context"
	"errors"
	"net/http"
	"time"
)

type Server struct{ server *http.Server }

func New(address string, handler http.Handler) *Server {
	return &Server{server: &http.Server{Addr: address, Handler: handler, ReadHeaderTimeout: 10 * time.Second}}
}

func (s *Server) Run(ctx context.Context) error {
	result := make(chan error, 1)
	go func() { result <- s.server.ListenAndServe() }()
	select {
	case <-ctx.Done():
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return s.server.Shutdown(shutdown)
	case err := <-result:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
