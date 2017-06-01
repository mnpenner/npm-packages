BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.js')

# these are not files
.PHONY: clean test patch

# disable default suffixes
.SUFFIXES:

.deps/dist: $(SRC_FILES) yarn.lock .deps
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
	npm publish

clean:
	rm -rf node_modules dist .deps

test: .deps/dist
#	node tests/url.js
#	node --trace-warnings tests/fs.js
	node --trace-warnings tests/hrtime.js