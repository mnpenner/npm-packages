MAKEFLAGS += --no-builtin-rules
.SUFFIXES:

build: dist/package.json
	yarn build

dev: node_modules/.yarn-integrity
	yarn build -w

test: node_modules/.yarn-integrity
	yarn build && node -r source-map-support/register dist/main export -Dbusman -uroot -p=

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

publish: build
	cd dist && npm publish
