MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: wizard prod dev

__main__:
	$(error Please specify a target)

## commands
########################################

wizard: node_modules/.yarn-integrity 
	rm -rf aaa-test-project
	node .
	
prod: node_modules/.yarn-integrity 
	rm -rf aaa-test-project
	node . aaa-test-project
	cd aaa-test-project; $(MAKE) prod

dev: node_modules/.yarn-integrity 
	rm -rf aaa-test-project
	node . aaa-test-project
	cd aaa-test-project; $(MAKE) dev

publish:
	npm publish

## files
########################################

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<
