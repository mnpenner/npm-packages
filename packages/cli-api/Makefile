MAKEFLAGS += --no-builtin-rules
.SUFFIXES:

build: node_modules/.yarn-integrity
	@yarn tsdecls
	@yarn build

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<
