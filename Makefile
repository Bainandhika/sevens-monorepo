.PHONY: init build-wasm run-server run-client build-client deploy-prep

# Mendapatkan path instalasi TinyGo di OS kamu
TINYGO_ROOT := $(shell tinygo env TINYGOROOT)

init:
	@cd frontend && npm install
	@go mod tidy

# 1. Build Shared Engine menjadi Wasm untuk PWA
build-wasm:
	@echo "Menyalin wasm_exec.js dari TinyGo..."
	@cp $(TINYGO_ROOT)/targets/wasm_exec.js ./frontend/public/
	@echo "Kompilasi engine ke WebAssembly..."
	@tinygo build -o ./frontend/public/game.wasm -target wasm -no-debug ./cmd/wasm/main.go
	@echo "Build Wasm selesai. Ukuran file:"
	@ls -lh ./frontend/public/game.wasm

# 2. Jalankan Backend Go Lokal (Port 8080)
run-server:
	@go run ./cmd/server/main.go

# 3. Jalankan Frontend React Lokal (termasuk auto-build Wasm)
run-client: build-wasm
	@cd frontend && npm run dev

# 4. Build Frontend untuk produksi (Cloudflare Pages)
build-client: build-wasm
	@cd frontend && npm run build
