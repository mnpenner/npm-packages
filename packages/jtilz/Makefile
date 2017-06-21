BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.ts')
TS_DEPS := $(SRC_FILES) yarn.lock

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

all: dist/node dist/web

.deps/lint: tsconfig.lint.json $(TS_DEPS) .deps
	$(BIN)/tsc -p $<
	@touch $@

dist/web: tsconfig.web.json $(TS_DEPS) | .deps/lint
	$(BIN)/tsc -p $<
	@touch $@

dist/node: tsconfig.node.json $(TS_DEPS) | .deps/lint
	$(BIN)/tsc -p $<
	@touch $@

docs/node: tsconfig.typedoc.json $(TS_DEPS) | .deps/lint
	$(BIN)/typedoc -p $< --out $@ --mode file --moduleResolution node .

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
	rm -rf dist .deps docs

test: 
	$(BIN)/jest
