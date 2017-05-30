BIN = node_modules/.bin
SRC_DIRS = $(find src -type d)
NODE_SRC_FILES = src/index.node.js $(shell find src -name '*.js' ! -name '*.browser.js')
BROWSER_SRC_FILES = src/index.browser.js $(shell find src -name '*.js' ! -name '*.node.js')
NODE_DIST_FILES = $(patsubst %.node.js,%.js,$(patsubst src/%,dist/node/%,$(NODE_SRC_FILES)))
BROWSER_DIST_FILES = $(patsubst %.browser.js,%.js,$(patsubst src/%,dist/browser/%,$(BROWSER_SRC_FILES)))
NODE_DIST_DIRS = $(sort $(dir $(NODE_DIST_FILES)))
BROWSER_DIST_DIRS = $(sort $(dir $(BROWSER_DIST_FILES)))
NODE_COMPILE = BABEL_ENV=node $(BIN)/babel $< -o $@
BROWSER_COMPILE = BABEL_ENV=browser $(BIN)/babel $< -o $@ --source-maps --minified --compact --no-comments

# these are not files
.PHONY: all clean nuke debug test dev

# disable default suffixes
.SUFFIXES:

all: $(NODE_DIST_FILES) $(BROWSER_DIST_FILES)

$(NODE_DIST_DIRS) $(BROWSER_DIST_DIRS):
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
	$(info BROWSER_DIST_DIRS: $(BROWSER_DIST_DIRS))

publish:
	npm version patch
	npm publish

clean: 
	rm -rf node_modules dist src/index.*

nuke: clean
	rm -rf yarn.lock

src/index.node.js: $(SRC_DIRS) yarn.lock
	node make-index node

src/index.browser.js: $(SRC_DIRS) yarn.lock
	node make-index browser

dist/node/%.js: src/%.node.js yarn.lock .babelrc | $(NODE_DIST_DIRS)
	$(NODE_COMPILE)

dist/node/%.js: src/%.js yarn.lock .babelrc | $(NODE_DIST_DIRS)
	$(NODE_COMPILE)

dist/browser/%.js: src/%.browser.js yarn.lock .babelrc | $(BROWSER_DIST_DIRS)
	$(BROWSER_COMPILE)

dist/browser/%.js: src/%.js yarn.lock .babelrc | $(BROWSER_DIST_DIRS)
	$(BROWSER_COMPILE)

test: yarn.lock
	BABEL_ENV=node babel-node tests/url.js