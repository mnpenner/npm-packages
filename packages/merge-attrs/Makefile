BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.ts')
TS_DEPS := $(SRC_FILES) yarn.lock

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

all: dist/web dist/node

dist/web: tsconfig.web.json $(TS_DEPS)
	$(BIN)/tsc -p $<
	@touch $@

dist/node: tsconfig.json $(TS_DEPS)
	$(BIN)/tsc -p $<
	@touch $@

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<

publish: all
	cp package.json dist/
	npm publish dist

clean:
	rm -rf dist 

test: yarn.lock
	$(BIN)/jest
