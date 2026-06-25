FROM golang:1.25-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Air for hot reload
RUN go install github.com/air-verse/air@latest

WORKDIR /workspace/go

COPY go/go.mod go/go.sum* ./
RUN go mod download

COPY go ./

ENV PORT=8081
ENV HOST=0.0.0.0
ENV DUCKDB_PATH=/data/observability.duckdb

EXPOSE 8081

# Run Air using the configured .air.toml
CMD ["air", "-c", ".air.toml"]
