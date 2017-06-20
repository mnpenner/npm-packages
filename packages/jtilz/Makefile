BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.ts')
TS_DEPS := $(SRC_FILES) yarn.lock tsconfig.json Makefile

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

all: dist/node dist/browser dist/jtilz.d.ts

dist/browser: $(TS_DEPS) | .deps/lint
	$(BIN)/tsc --target es5 --module es6 --outDir dist/browser --lib esnext,dom src/index.browser.ts
	@touch $@

dist/node: $(TS_DEPS) | .deps/lint
	$(BIN)/tsc --target es2017 --module commonjs --outDir dist/node --lib esnext src/index.node.ts
	@touch $@

.deps/lint: $(TS_DEPS) .deps
	$(BIN)/tsc --noEmit --pretty
	@touch $@

dist/jtilz.d.ts: $(TS_DEPS) | .deps/lint
	$(BIN)/dts-generator --name jtilz --project . --out dist/jtilz.d.ts
	@touch $@

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<
	
node_modules .deps:
	mkdir -p $@

publish:
	npm publish dist

clean:
	rm -rf dist .deps

test: 
	BABEL_ENV=test $(BIN)/jest
