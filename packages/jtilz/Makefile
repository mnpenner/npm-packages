BIN := node_modules/.bin
BROWSER_SRC_FILES := $(shell find src -name '*.js' ! -name '*.node.js')
NODE_SRC_FILES := $(shell find src -name '*.js' ! -name '*.browser.js')
NODE_DIST_FILES := $(patsubst %.node.js,%.js,$(patsubst src/%,dist/node/%,$(NODE_SRC_FILES)))
NODE_DIST_DIRS := $(sort $(dir $(NODE_DIST_FILES)))
NODE_COMPILE = $(BIN)/babel $< -o $@

# these are not files
.PHONY: build build-node build-browser clean nuke debug test dev

# disable default suffixes
.SUFFIXES:


build: $(NODE_DIST_FILES)

$(NODE_DIST_DIRS):
	mkdir -p $@

yarn.lock: node_modules package.json
	@yarn install --production=false --check-files
	@touch -mr $(shell ls -Atd $? | head -1) $@

node_modules:
	mkdir -p $@

debug:
	$(info NODE_SRC_FILES: $(NODE_SRC_FILES))
	$(info NODE_DIST_FILES: $(NODE_DIST_FILES))
	$(info NODE_DIST_DIRS: $(NODE_DIST_DIRS))
	$(info BROWSER_SRC_FILES: $(BROWSER_SRC_FILES))

publish:
	npm version patch
	npm publish

clean: 
	rm -rf node_modules dist

nuke: clean
	rm -rf yarn.lock

dist/node/%.js: src/%.node.js yarn.lock .babelrc | $(NODE_DIST_DIRS)
	$(NODE_COMPILE)

dist/node/%.js: src/%.js yarn.lock .babelrc | $(NODE_DIST_DIRS)
	$(NODE_COMPILE)


