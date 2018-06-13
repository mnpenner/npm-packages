NM := node_modules/.bin
SRCS := $(shell find src \( -name '*.js' -o -name '*.json' \))
DISTS := $(patsubst src/%,dist/%,$(SRCS)) $(patsubst src/%.schema.js,dist/%.schema.json,$(SRCS))
DISTDIRS := $(sort $(dir $(DISTS)))
.SUFFIXES:

.PHONY: dev build clean debug test

# usage: make CMD=diff

run: build
	node -r source-map-support/register dist/bin $(CMD) #2> warnings.log

build: $(DISTS) yarn.lock

dist/%.schema.json: dist/%.schema.js dist/export-schema.js
	node dist/export-schema.js $<#/defs/Table > $@

dist/%.js: src/%.js yarn.lock .babelrc | $(DISTDIRS)
	$(NM)/babel $< -o $@

dist/%.json: src/%.json | $(DISTDIRS)
	cp $< $@
	
$(DISTDIRS):
	mkdir -p $@

yarn.lock:: package.json
	@yarn install --production=false
	@touch -mr $@ $<

yarn.lock:: node_modules
	@yarn install --production=false --check-files
	@touch -mr $@ $<

clean:
	rm -rf node_modules

node_modules:
	mkdir -p $@