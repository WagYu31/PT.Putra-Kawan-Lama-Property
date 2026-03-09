# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
ENV GOTOOLCHAIN=auto
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd/server

# Runtime stage
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
RUN mkdir -p /app/uploads

COPY --from=builder /build/server .

EXPOSE 8080

CMD ["./server"]
