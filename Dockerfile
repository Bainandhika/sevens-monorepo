# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build backend server binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server/main.go

# Production stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server /app/server

# Memory limits for Render Free Tier (512 MB RAM)
ENV GOMEMLIMIT=420MiB
ENV GOGC=80

# Default port for Render (Render sets $PORT automatically)
ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
