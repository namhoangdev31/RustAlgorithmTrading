FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc g++ musl-dev

WORKDIR /workspace/go
COPY go/go.mod go/go.sum* ./
RUN go mod download
COPY go ./
RUN CGO_ENABLED=1 GOOS=linux go build -o /out/edge-gateway ./cmd/edge-gateway/main.go

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -D -H -u 10001 -G app app \
    && mkdir -p /var/lib/lepos \
    && chown -R app:app /var/lib/lepos

WORKDIR /workspace
COPY --from=builder /out/edge-gateway /usr/local/bin/edge-gateway

ENV PORT=8088
ENV HOST=0.0.0.0
ENV TLS_PORT=8443
ENV SERVICE_MODE=managed_saas

USER app

EXPOSE 8088 8443
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- "http://127.0.0.1:${PORT}/health" >/dev/null || exit 1
CMD ["/usr/local/bin/edge-gateway"]
