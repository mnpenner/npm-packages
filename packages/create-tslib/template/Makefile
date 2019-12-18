MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
YI := node_modules/.yarn-integrity
NB := node_modules/.bin
.PHONY: build sdev prod check clean

## commands
########################################
# Build the source code to the dist/ directory.
build: _build_dts _build_js dist/package.json

# Build TypeScript declaration (.d.ts) files.
_build_dts: $(YI)
	$(NB)/tsc --emitDeclarationOnly

# Transpile TS to JS.
_build_js: $(YI)
	BABEL_ENV=production $(NB)/babel src --out-dir dist --extensions ".ts" --source-maps true --no-comments

# Run the TypeScript source code directly in development mode.
dev: $(YI)
	BABEL_ENV=development $(NB)/babel-node --max_old_space_size=10000 --extensions ".ts" -r "node_modules/dotenv/config" src/index.ts

# Build the code for production and run it. May catch compilation errors but shouldn't be executed this way in prod.
prod: build
	node -r dotenv/config -r source-map-support/register dist/index

# Check source code for TypeScript errors.
check: $(YI)
	$(NB)/tsc --noEmit

# Delete build files.
clean:
	rm -rf node_modules dist yarn-error.log

## files
########################################
$(YI): yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

dist/package.json: package.json | dist
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@

dist:
	mkdir -p $@
