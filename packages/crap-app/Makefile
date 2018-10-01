MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: test

## commands
########################################

prod: node_modules/.yarn-integrity 
	rm -rf foo
	node --no-warnings . foo
	cd foo && $(MAKE) build
	$(NM)/serve -s -l 8080 foo/dist

dev: node_modules/.yarn-integrity 
	rm -rf foo
	node --no-warnings . foo
	cd foo && $(MAKE) start


## files
########################################

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<
