.PHONY: init build-wasm run-server run-client build-client deploy-prep

ifeq ($(OS),Windows_NT)
  HAS_TINYGO := $(shell where tinygo 2>nul)
else
  HAS_TINYGO := $(shell which tinygo 2>/dev/null)
endif

init:
	@cd frontend && npm install
	@go mod tidy

# 1. Build Shared Engine menjadi Wasm untuk PWA
# shortcut: TinyGo menghasilkan binary sub-megabyte, Go standard ~4.7MB. Pasang TinyGo jika ingin binary ringkas.
build-wasm: export GOOS=js
build-wasm: export GOARCH=wasm
build-wasm:
ifneq ($(strip $(HAS_TINYGO)),)
	@echo "Menyalin wasm_exec.js dari TinyGo..."
ifeq ($(OS),Windows_NT)
	@copy /y "$(subst /,\,$(shell tinygo env TINYGOROOT)/targets/wasm_exec.js)" "frontend\public\wasm_exec.js"
else
	@cp $(shell tinygo env TINYGOROOT)/targets/wasm_exec.js ./frontend/public/
endif
	@echo "Kompilasi engine ke WebAssembly (TinyGo)..."
	@tinygo build -o ./frontend/public/game.wasm -target wasm -no-debug ./cmd/wasm/main.go
else
	@echo "TinyGo tidak ditemukan, menggunakan Go standard..."
ifeq ($(OS),Windows_NT)
	@if exist "$(subst /,\,$(shell go env GOROOT)/lib/wasm/wasm_exec.js)" (copy /y "$(subst /,\,$(shell go env GOROOT)/lib/wasm/wasm_exec.js)" "frontend\public\wasm_exec.js") else (copy /y "$(subst /,\,$(shell go env GOROOT)/misc/wasm/wasm_exec.js)" "frontend\public\wasm_exec.js")
else
	@cp $$(go env GOROOT)/lib/wasm/wasm_exec.js ./frontend/public/ 2>/dev/null || cp $$(go env GOROOT)/misc/wasm/wasm_exec.js ./frontend/public/
endif
	@echo "Kompilasi engine ke WebAssembly (Go)..."
	@go build -o ./frontend/public/game.wasm ./cmd/wasm/main.go
endif
	@echo "Build Wasm selesai. Ukuran file:"
ifeq ($(OS),Windows_NT)
	@for %%I in (frontend\public\game.wasm) do @echo Ukuran: %%~zI bytes
else
	@ls -lh ./frontend/public/game.wasm
endif

# 2. Jalankan Backend Go Lokal (Port 8080)
run-server:
	@go run ./cmd/server/main.go

# 3. Jalankan Frontend React Lokal (termasuk auto-build Wasm)
run-client: build-wasm
	@cd frontend && npm run dev

# 4. Build Frontend untuk produksi (Cloudflare Pages)
build-client: build-wasm
	@cd frontend && npm run build
