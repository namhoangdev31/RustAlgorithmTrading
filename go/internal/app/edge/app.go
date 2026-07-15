package edge

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"

	edgehttp "trading/control-gateway/internal/modules/edge/adapter/http"
	"trading/control-gateway/internal/platform/config"
)

type App struct {
	gateway   *edgehttp.Gateway
	http      *http.Server
	https     *http.Server
	closeOnce sync.Once
}

func Build(cfg *config.Config) (*App, error) {
	gateway, err := edgehttp.NewGateway(edgehttp.Config{
		Host: cfg.Edge.Host, Port: cfg.Edge.Port, RedisURL: cfg.Storage.RedisURL,
		StorageRoot: cfg.Edge.StorageRoot, ControlPlaneURL: cfg.Edge.ControlPlaneURL,
		InternalAPIKey: cfg.Edge.InternalAPIKey, ControlPlaneTLSCertPath: cfg.Edge.ControlPlaneTLSCertPath,
		ControlPlaneTLSKeyPath: cfg.Edge.ControlPlaneTLSKeyPath, ControlPlaneTLSCAPath: cfg.Edge.ControlPlaneTLSCAPath,
		ServiceID: cfg.Edge.ServiceID, ServiceSecret: cfg.Edge.ServiceSecret,
		IPFSGatewayURL: cfg.Edge.IPFSGatewayURL, ArweaveGatewayURL: cfg.Edge.ArweaveGatewayURL,
	})
	if err != nil {
		return nil, err
	}
	handler := gateway.Routes()
	return &App{gateway: gateway,
		http:  &http.Server{Addr: cfg.Edge.Host + ":" + cfg.Edge.Port, Handler: handler, ReadHeaderTimeout: 10 * time.Second},
		https: &http.Server{Addr: cfg.Edge.Host + ":" + cfg.Edge.TLSPort, Handler: handler, ReadHeaderTimeout: 10 * time.Second, TLSConfig: gateway.TLSConfig()},
	}, nil
}

func (a *App) Run(ctx context.Context) error {
	group, runCtx := errgroup.WithContext(ctx)
	group.Go(func() error {
		err := a.http.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	})
	group.Go(func() error {
		err := a.https.ListenAndServeTLS("", "")
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	})
	group.Go(func() error {
		<-runCtx.Done()
		shutdown, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return errors.Join(a.http.Shutdown(shutdown), a.https.Shutdown(shutdown))
	})
	err := group.Wait()
	_ = a.Close()
	return err
}

func (a *App) Close() error {
	a.closeOnce.Do(func() { a.gateway.Close() })
	return nil
}
