# Unified Gateway service image. Build from repository root.
# docker build -f ops/deployment/gateway.Dockerfile -t trading/gateway:local .

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
    -o /out/gateway ./cmd/gateway/main.go

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libgcc-s1 \
    libstdc++6 \
    tzdata \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --gid nogroup appuser \
    && mkdir -p /data /var/lib/lepos \
    && chown -R appuser:nogroup /data /var/lib/lepos

WORKDIR /workspace
COPY --from=builder /out/gateway /usr/local/bin/gateway

ENV PORT=8081
ENV HOST=0.0.0.0
ENV DUCKDB_PATH=/data/observability.duckdb
ENV SERVICE_MODE=managed_saas

USER appuser

EXPOSE 8081 8088 8443
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD curl -fsS "http://127.0.0.1:8081/health/ready" >/dev/null || exit 1
CMD ["/usr/local/bin/gateway"]
