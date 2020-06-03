MAKEFLAGS += --no-builtin-rules
.SUFFIXES:

dev: node_modules/.yarn-integrity
	yarn build -w

test: node_modules/.yarn-integrity
	yarn build && node -r source-map-support/register dist/main export -Dbusman -uroot -p=

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

