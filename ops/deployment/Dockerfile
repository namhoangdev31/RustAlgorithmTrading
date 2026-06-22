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

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    libzmq5 \
    python3 \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

ARG BIN=market-data
ENV SERVICE_BIN=${BIN}
ENV SERVICE_MODE=managed_saas
ENV TRADING_ENV=production
ENV RUST_LOG=info
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

EXPOSE 5555 5556 9091 9092 9093
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD ["sh", "-c", "kill -0 1"]

ENTRYPOINT ["sh", "-c", "exec /usr/local/bin/${SERVICE_BIN}"]
