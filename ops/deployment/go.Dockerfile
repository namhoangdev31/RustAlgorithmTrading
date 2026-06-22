# Go control-plane image. Build from repository root.
# docker build -f ops/deployment/go.Dockerfile -t trading/go-control-plane:local .

FROM golang:1.25-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/go
COPY go/go.mod go/go.sum* ./
RUN go mod download
COPY go ./
RUN CGO_ENABLED=1 GOOS=linux go build -trimpath -ldflags="-s -w" \
    -o /out/go-control-plane ./cmd/server/main.go

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libgcc-s1 \
    libstdc++6 \
    tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --gid nogroup appuser \
    && mkdir -p /data \
    && chown -R appuser:nogroup /data

WORKDIR /workspace
COPY --from=builder /out/go-control-plane /usr/local/bin/go-control-plane

ENV PORT=8081
ENV HOST=0.0.0.0
ENV DUCKDB_PATH=/data/observability.duckdb
ENV SERVICE_MODE=managed_saas

USER appuser

EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD curl -fsS "http://127.0.0.1:${PORT}/health/ready" >/dev/null || exit 1
CMD ["/usr/local/bin/go-control-plane"]
