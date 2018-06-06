NM := node_modules/.bin
SRCS := $(shell find src -name '*.js')
DISTS := $(patsubst src/%,dist/%,$(SRCS))
DISTDIRS := $(sort $(dir $(DISTS)))
.SUFFIXES:

.PHONY: dev build clean debug test

# usage: make CMD=diff

run: build
	node -r source-map-support/register dist/bin $(CMD) 2> warnings.txt

build: $(DISTS) yarn.lock

dist/%.js: src/%.js yarn.lock .babelrc | $(DISTDIRS)
	$(NM)/babel $< -o $@
	
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