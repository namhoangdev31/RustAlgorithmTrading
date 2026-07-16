# Unified Gateway service image. Build from repository root.
# docker build -f ops/deployment/gateway.Dockerfile -t trading/gateway:local .

FROM debian:bookworm-slim AS verification-tools
ARG TARGETARCH=amd64
ARG TRIVY_VERSION=0.66.0
ARG SYFT_VERSION=1.33.0
ARG GITLEAKS_VERSION=8.28.0
ARG OSV_SCANNER_VERSION=2.2.3
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl tar \
    && rm -rf /var/lib/apt/lists/* \
    && case "$TARGETARCH" in amd64) TRIVY_ARCH=64bit; TOOL_ARCH=x64; GO_ARCH=amd64 ;; arm64) TRIVY_ARCH=ARM64; TOOL_ARCH=arm64; GO_ARCH=arm64 ;; *) exit 1 ;; esac \
    && curl -fsSL "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-${TRIVY_ARCH}.tar.gz" | tar -xz -C /usr/local/bin trivy \
    && curl -fsSL "https://github.com/anchore/syft/releases/download/v${SYFT_VERSION}/syft_${SYFT_VERSION}_linux_${GO_ARCH}.tar.gz" | tar -xz -C /usr/local/bin syft \
    && curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_${TOOL_ARCH}.tar.gz" | tar -xz -C /usr/local/bin gitleaks \
    && curl -fsSL "https://github.com/google/osv-scanner/releases/download/v${OSV_SCANNER_VERSION}/osv-scanner_linux_${GO_ARCH}" -o /usr/local/bin/osv-scanner \
    && chmod 0755 /usr/local/bin/trivy /usr/local/bin/syft /usr/local/bin/gitleaks /usr/local/bin/osv-scanner

FROM node:22-bookworm-slim AS browser-deps
WORKDIR /opt/lepoship
COPY ops/deployment/lepoship-browser/package.json ops/deployment/lepoship-browser/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

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
RUN GOGC=50 CGO_ENABLED=1 GOOS=linux go build -p 2 -trimpath -ldflags="-s -w" \
    -o /out/gateway ./cmd/gateway/main.go

FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    clamav \
    curl \
    git \
    libgcc-s1 \
    libstdc++6 \
    python3 \
    python3-venv \
    tzdata \
    unzip \
    wget \
    zip \
    && python3 -m venv /opt/semgrep \
    && /opt/semgrep/bin/pip install --no-cache-dir semgrep==1.136.0 \
    && npm install --global yarn@1.22.22 pnpm@10.15.1 --ignore-scripts --no-audit --no-fund \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --gid nogroup appuser \
    && mkdir -p /data /var/lib/lepos /opt/lepoship \
    && chown -R appuser:nogroup /data /var/lib/lepos /opt/lepoship

WORKDIR /workspace
COPY --from=builder /out/gateway /usr/local/bin/gateway
COPY --from=verification-tools /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=verification-tools /usr/local/bin/syft /usr/local/bin/syft
COPY --from=verification-tools /usr/local/bin/gitleaks /usr/local/bin/gitleaks
COPY --from=verification-tools /usr/local/bin/osv-scanner /usr/local/bin/osv-scanner
COPY --from=browser-deps /opt/lepoship/node_modules /opt/lepoship/node_modules
COPY ops/deployment/lepoship-browser-runner.mjs /opt/lepoship/browser-runner.mjs

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PATH="/opt/lepoship/node_modules/.bin:/opt/semgrep/bin:${PATH}"

RUN /opt/lepoship/node_modules/.bin/playwright install --with-deps chromium \
    && chown -R appuser:nogroup /ms-playwright /opt/lepoship /opt/semgrep

ENV PORT=8081
ENV HOST=0.0.0.0
ENV DUCKDB_PATH=/data/observability.duckdb
ENV SERVICE_MODE=managed_saas

USER appuser

EXPOSE 8081 8088 8443
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD curl -fsS "http://127.0.0.1:8081/health/ready" >/dev/null || exit 1
CMD ["/usr/local/bin/gateway"]
