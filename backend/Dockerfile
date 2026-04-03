
# Stage 1: Builder (Compilation)
FROM golang:1.25-alpine AS builder

# Install system dependencies needed for CGO (if necessary)
RUN apk add --no-cache git

WORKDIR /app

# Copy dependency files first (for Docker cache optimization)
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the rest of the source code
COPY . .

# Compile the application
# -o main: binary name
# ./cmd/api/main.go: path to your main file
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/main.go

# Stage 2: Runner (Lightweight final image)
FROM alpine:latest

WORKDIR /app

# Copy only the binary from the previous stage
COPY --from=builder /app/main .

# Expose the port (documentation only, actual port is set in docker-compose.yml)
EXPOSE 8080

# Command to run
CMD ["./main"]