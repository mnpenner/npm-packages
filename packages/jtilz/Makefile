BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.js')

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

.deps/dist: $(SRC_FILES) yarn.lock .deps bundilio.config.js
#	rm -rf dist/*
	$(BIN)/bundilio .
	@touch $@

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<
	
node_modules .deps:
	mkdir -p $@

patch: .deps/dist test
	npm version patch
	cp package.json dist/package.json
	npm publish dist

publish:
	npm publish dist

clean:
	rm -rf node_modules dist .deps

test: .deps/dist
	BABEL_ENV=test $(BIN)/jest
