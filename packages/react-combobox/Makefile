MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
NM := node_modules/.bin
.PHONY: build clean test

dev: node_modules/.yarn-integrity
	NODE_ENV=development node --max-old-space-size=4096 $(NM)/webpack-serve

map: node_modules/.yarn-integrity
	$(NM)/ts-node etc/createMap.ts

build: node_modules/.yarn-integrity dist/package.json dist/LICENSE dist/README.md
	NODE_ENV=production $(NM)/wp

node_modules/.yarn-integrity: yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

install:
	@yarn install --production=false --check-files

clean:
	rm -rf node_modules dist yarn-error.log

dist:
	mkdir -p $@

dist/LICENSE: LICENSE | dist
	cp $< $@

dist/README.md: README.md | dist
	cp $< $@

dist/package.json: package.json | dist
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@

test:
	$(NM)/ts-node tests/test

publish: build test
	cd dist && npm publish

keys:
	wget http://www.unicode.org/Public/UCA/latest/allkeys.txt -O etc/allkeys.txt
	node etc/createMap.js