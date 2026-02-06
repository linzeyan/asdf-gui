.PHONY: dev build lint format format-check test clean i18n-check install

dev:
	pnpm tauri dev

build: lint
	pnpm tauri build

lint: format-check
	pnpm exec eslint src/
	cd src-tauri && cargo clippy --all-targets -- -D warnings

format:
	pnpm exec prettier --write "src/**/*.{ts,tsx,css,json}"
	cd src-tauri && cargo fmt

format-check:
	pnpm exec prettier --check "src/**/*.{ts,tsx,css,json}"
	cd src-tauri && cargo fmt --check

test:
	pnpm exec vitest run
	cd src-tauri && cargo test

clean:
	rm -rf dist
	cd src-tauri && cargo clean

i18n-check:
	@node -e " \
	  const en = require('./src/locales/en/translation.json'); \
	  const zhTW = require('./src/locales/zh-TW/translation.json'); \
	  const flatten = (obj, prefix = '') => \
	    Object.entries(obj).reduce((acc, [k, v]) => \
	      typeof v === 'object' && v !== null ? { ...acc, ...flatten(v, prefix + k + '.') } \
	      : { ...acc, [prefix + k]: v }, {}); \
	  const enKeys = new Set(Object.keys(flatten(en))); \
	  const zhKeys = new Set(Object.keys(flatten(zhTW))); \
	  const missingInZh = [...enKeys].filter(k => !zhKeys.has(k)); \
	  const missingInEn = [...zhKeys].filter(k => !enKeys.has(k)); \
	  if (missingInZh.length) { console.error('Missing in zh-TW:', missingInZh); process.exit(1); } \
	  if (missingInEn.length) { console.error('Missing in en:', missingInEn); process.exit(1); } \
	  console.log('i18n keys OK:', enKeys.size, 'keys'); \
	"

install:
	pnpm install
	cd src-tauri && cargo fetch
