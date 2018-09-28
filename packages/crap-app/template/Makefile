MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: build start clean test publish

## commands
########################################

build: node_modules/.yarn-integrity dist/package.json dist/LICENSE dist/README.md
	NODE_ENV=production $(NM)/wp

start: node_modules/.yarn-integrity
	NODE_ENV=development node --max-old-space-size=4096 $(NM)/webpack-serve

clean:
	rm -rf node_modules dist yarn-error.log

test:
	$(NM)/ts-node tests/test

publish: build test
	cd dist && npm publish

## files
########################################

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

dist:
	mkdir -p $@

dist/LICENSE: LICENSE | dist
	cp $< $@

dist/README.md: README.md | dist
	cp $< $@

dist/package.json: package.json | dist
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@
