# syntax=docker/dockerfile:1
FROM golang:1.24 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/server ./server
EXPOSE 8080
ENV SERVER_PORT=8080
ENTRYPOINT ["./server"]
