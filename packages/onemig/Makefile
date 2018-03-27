NM := node_modules/.bin
SRCS := $(shell find src -name '*.js')
DISTS := $(patsubst src/%,dist/%,$(SRCS))
DISTDIRS := $(sort $(dir $(DISTS)))
.SUFFIXES:

.PHONY: dev build clean debug test

dev: build
	node dist/bin

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