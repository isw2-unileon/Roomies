.PHONY: install run-backend run-frontend build test lint e2e clean

SHELL := cmd.exe
.SHELLFLAGS := /C

GOLANGCI_LINT_VERSION ?= v2.9.0
GO_BIN := $(shell go env GOPATH)\bin
GOLANGCI_LINT := $(GO_BIN)\golangci-lint.exe

## Install all dependencies
install:
	go mod download
	cd frontend && npm ci
	cd e2e && npm ci

## Run backend
run-backend:
	go run ./backend/cmd/server

## Run frontend dev server
run-frontend:
	cd frontend && npm run dev

## Build backend and frontend
build:
	if not exist backend\bin mkdir backend\bin
	go build -o backend/bin/server.exe ./backend/cmd/server
	cd frontend && npm run build

## Run all tests
test:
	go test -v ./...
	cd frontend && npm run test

## Run linters
lint:
	go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION)
	"$(GOLANGCI_LINT)" run ./...
	cd frontend && npm run lint

## Run E2E tests (requires backend + frontend running)
e2e:
	cd e2e && npx playwright test

## Remove generated files
clean:
	if exist backend\bin rmdir /s /q backend\bin
	if exist frontend\dist rmdir /s /q frontend\dist
	if exist e2e\playwright-report rmdir /s /q e2e\playwright-report
