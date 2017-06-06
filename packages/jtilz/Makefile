BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.js')

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

.deps/dist: $(SRC_FILES) yarn.lock .deps
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

patch: .deps/dist
	npm version patch
	cp package.json dist/package.json
	npm publish dist

publish:
	npm publish dist

clean:
	rm -rf node_modules dist .deps

test: .deps/dist
#	node --trace-warnings tests/url.js
#	node --trace-warnings tests/fs.js
#	node --trace-warnings tests/hrtime.js
	BABEL_ENV=test $(BIN)/jest

#test-node: .deps/dist
#	$(BIN)/jest --config tests/node/jest.json
#
#test-web: .deps/dist
#	$(BIN)/jest --config tests/web/jest.json