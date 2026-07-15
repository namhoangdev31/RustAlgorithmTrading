package observability

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
)

var (
	httpRequests = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace: "control_gateway", Name: "http_requests_total", Help: "HTTP requests processed.",
	}, []string{"method", "route", "status"})
	httpDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "control_gateway", Name: "http_request_duration_seconds", Help: "HTTP request latency.",
		Buckets: prometheus.DefBuckets,
	}, []string{"method", "route"})
)

func init() {
	prometheus.MustRegister(httpRequests, httpDuration)
}

func HTTPMiddleware(serviceName string) gin.HandlerFunc {
	tracer := otel.Tracer(serviceName + "/http")
	return func(c *gin.Context) {
		started := time.Now()
		ctx, span := tracer.Start(c.Request.Context(), c.Request.Method+" "+c.FullPath())
		c.Request = c.Request.WithContext(ctx)
		c.Next()
		route := c.FullPath()
		if route == "" {
			route = "unmatched"
		}
		status := c.Writer.Status()
		httpRequests.WithLabelValues(c.Request.Method, route, strconv.Itoa(status)).Inc()
		httpDuration.WithLabelValues(c.Request.Method, route).Observe(time.Since(started).Seconds())
		span.SetAttributes(attribute.String("http.request.method", c.Request.Method), attribute.String("http.route", route), attribute.Int("http.response.status_code", status))
		if status >= 500 {
			span.SetStatus(codes.Error, "server error")
		}
		span.End()
	}
}
