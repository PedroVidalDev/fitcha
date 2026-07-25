
# Stage 1: Builder (Compilation)
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy dependency files first (for Docker cache optimization)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source code
COPY . .

# Compile the applications
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api/main.go
RUN CGO_ENABLED=0 GOOS=linux go build -o worker ./cmd/worker/main.go

# Stage 2: Runner (Lightweight final image)
FROM alpine:3.22

WORKDIR /app

RUN addgroup -S fitcha && adduser -S -G fitcha -h /app fitcha

# Copy only the binaries from the previous stage
COPY --from=builder --chown=fitcha:fitcha /app/api .
COPY --from=builder --chown=fitcha:fitcha /app/worker .

# Expose the port (documentation only, actual port is set in docker-compose.yml)
EXPOSE 8080

USER fitcha

# Command to run
CMD ["./api"]
