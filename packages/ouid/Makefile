MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: build start dev clean test publish

## commands
########################################

# example: https://github.com/microsoft/TypeScript-Babel-Starter

_default:
	$(error Please specify a target)

build: _build_dts _build_js dist/package.json

_build_dts: node_modules/.yarn-integrity
	$(NM)/tsc --emitDeclarationOnly

_build_js: node_modules/.yarn-integrity
	$(NM)/babel src --out-dir dist --extensions ".ts" --source-maps inline

run: node_modules/.yarn-integrity
	$(NM)/babel-node --extensions ".ts" src/index.ts

check: node_modules/.yarn-integrity
	$(NM)/tsc --noEmit

dist:
	mkdir -p $@

clean:
	rm -rf node_modules dist yarn-error.log

dist/package.json: package.json | dist
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@

publish: build
	cd dist && npm publish

## files
########################################

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

