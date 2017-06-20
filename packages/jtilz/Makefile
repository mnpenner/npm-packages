BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.ts')
TS_DEPS := $(SRC_FILES) yarn.lock tsconfig.json Makefile

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

all: dist/node dist/web

dist/web: $(TS_DEPS) | .deps/lint
	$(BIN)/tsc --target es5 --module es6 --outDir dist/web --lib esnext,dom  --strict --noEmitOnError --moduleResolution node --declaration --downlevelIteration src/index.web.ts
	@touch $@

dist/node: $(TS_DEPS) | .deps/lint
	$(BIN)/tsc --target es2017 --module commonjs --outDir dist/node --lib esnext --strict --noEmitOnError --moduleResolution node --declaration src/index.node.ts
	@touch $@

.deps/lint: $(TS_DEPS) .deps
	$(BIN)/tsc --noEmit --pretty
	@touch $@

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<
	
node_modules .deps:
	mkdir -p $@

publish: all
	cp package.json dist/
	npm publish dist

clean:
	rm -rf dist .deps

test: 
	BABEL_ENV=test $(BIN)/jest
