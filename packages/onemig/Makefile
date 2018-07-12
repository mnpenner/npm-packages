NM := node_modules/.bin
SRCS := $(shell find src \( -name '*.js' -o -name '*.json' \))
DISTS := $(patsubst src/%,dist/%,$(SRCS)) $(patsubst src/%.schema.js,dist/%.schema.json,$(SRCS)) dist/LICENSE dist/package.json dist/README.md
DISTDIRS := $(sort $(dir $(DISTS)))
.SUFFIXES:

.PHONY: dev build clean debug test

# usage: make CMD=diff

build: $(DISTS) yarn.lock

run: build
	node -r source-map-support/register dist/bin $(CMD)

dist/%.schema.json: dist/%.schema.js dist/export-schema.js
	node dist/export-schema.js $<#/defs/Table > $@

dist/%.js: src/%.js yarn.lock .babelrc | $(DISTDIRS)
	$(NM)/babel $< -o $@

dist/%.json: src/%.json | $(DISTDIRS)
	cp $< $@

dist/LICENSE: LICENSE | $(DISTDIRS)
	cp $< $@

dist/README.md: README.md | $(DISTDIRS)
	cp $< $@

dist/package.json: package.json | $(DISTDIRS)
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@

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

node8:
	sudo apt remove nodejs
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt install -y nodejs
	
node10:
	sudo apt remove nodejs
	curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
	sudo apt install -y nodejs

data/servers.json: $(wildcard ~/Projects/server_config/napi/host/*.json)
	jq -n '[inputs | select(.roles and any(.roles[]; . == "mysql")) | {(input_filename | gsub(".*/|\\.json$$";"")): .}] | add' $^ > $@

dump: build
	node -r source-map-support/register dist/bin export -h "$(HOST)" -o ~/.onemig/$(HOST)
	cd ~/.onemig && hg addremove "$(HOST)" && hg ci -m "Updated $(HOST)" "$(HOST)" && hg push

dump-phsa: build
	node -r source-map-support/register dist/bin export -h code -P 2224 -o ~/.onemig/phsa
	cd ~/.onemig && hg addremove "phsa" && hg ci -m "Updated phsa" "phsa" && hg push

publish: build
	cd dist && npm publish

test-it-live:
	rm -rf dist
	npm version patch 
	$(MAKE) publish 
	sudo npm i -g @nucleuslabs/onemig 
	onemig