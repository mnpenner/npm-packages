MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: build start dev clean test publish

## commands
########################################

build: node_modules/.yarn-integrity
	NODE_ENV=production $(NM)/webpack

start: dev
dev: node_modules/.yarn-integrity
	NODE_ENV=development node --max-old-space-size=4096 $(NM)/webpack-dev-server --hot

clean:
	rm -rf node_modules dist yarn-error.log

test:
	$(NM)/ts-node tests/test

prod: build
	npx serve -s -n -l 8080 dist


## files
########################################

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

