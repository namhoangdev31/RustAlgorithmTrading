FROM golang:1.21-alpine AS builder

# Install build dependencies for cgo (required for go-duckdb)
RUN apk add --no-cache gcc g++ musl-dev

WORKDIR /app

# Copy go mod and sum files (go.sum might not exist yet)
COPY go.mod ./
COPY go.sum* ./

# Download dependencies
RUN go mod tidy

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -o observability-api ./cmd/server/main.go

# Final stage
FROM alpine:3.19

WORKDIR /app

# Install runtime dependencies if needed
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/observability-api .

# Expose port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV DUCKDB_PATH=/data/observability.duckdb
ENV OBSERVABILITY_API_KEY=""

# Run the binary
CMD ["./observability-api"]
