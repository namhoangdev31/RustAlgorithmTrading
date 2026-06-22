# Generic Rust service image. Build from repository root.
# Example:
# docker build -f ops/deployment/Dockerfile --build-arg BIN=market-data -t trading/market-data:local .

FROM rust:1-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    cmake \
    g++ \
    libssl-dev \
    libzmq3-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
COPY rust ./rust
WORKDIR /workspace/rust

ARG BIN=market-data
RUN cargo build --release --bin ${BIN}

FROM debian:bookworm-slim AS runtime

ARG BIN=market-data
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libssl3 \
    libzmq5 \
    && if [ "$BIN" = "signal-bridge" ]; then \
        apt-get install -y --no-install-recommends python3 python3-pip python3-dev; \
    fi \
    && rm -rf /var/lib/apt/lists/*

ENV SERVICE_BIN=${BIN}
ENV SERVICE_MODE=managed_saas
ENV TRADING_ENV=production
ENV RUST_LOG=info
ENV HEALTHCHECK_URL=
WORKDIR /workspace

COPY --from=builder /workspace/rust/target/release/${BIN} /usr/local/bin/${BIN}
COPY ops/config ./ops/config
COPY python/requirements.txt ./python/requirements.txt

RUN if [ "$BIN" = "signal-bridge" ]; then \
        pip3 install --no-cache-dir --break-system-packages -r ./python/requirements.txt; \
    fi \
    && useradd --system --uid 10001 --gid nogroup appuser \
    && chown -R appuser:nogroup /workspace

USER appuser

EXPOSE 5555 5556 9091 9092 9093 9094
HEALTHCHECK --interval=30s --timeout=5s --retries=5 --start-period=20s CMD ["sh", "-c", "if [ -n \"$HEALTHCHECK_URL\" ]; then curl -fsS \"$HEALTHCHECK_URL\" >/dev/null; else kill -0 1; fi"]

ENTRYPOINT ["sh", "-c", "exec /usr/local/bin/${SERVICE_BIN}"]
