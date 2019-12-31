MAKEFLAGS += --no-builtin-rules
.SUFFIXES:
.PHONY: build dev prod check clean publish

YI := node_modules/.yarn-integrity
NB := node_modules/.bin
SRC_TS = $(shell find src -type f \( -iname '*.js' -o -iname '*.ts' \) ! -iname '*.d.ts')
SRC_OTHER = $(shell find src -type f \! -iname '*.ts' -o -iname '*.d.ts')
DIST_FILES = $(patsubst src/%.ts,dist/%.js,$(SRC_TS)) $(patsubst src/%,dist/%,$(SRC_OTHER)) dist/package.json dist/README.md
DIST_DIRS = $(sort $(patsubst %/,%,$(dir $(DIST_FILES))))

# Build the source code to the dist/ directory.
build: tsdecls $(DIST_FILES)

# Transpile TS to JS.
dist/%.js: src/%.ts $(YI) .babelrc
	BABEL_ENV=production $(NB)/babel --source-maps true --no-comments "$<" -o "$@"

# Copy all other file types.
dist/%: src/% | $(DIST_DIRS)
	cp "$<" "$@"

# Create dist/ directories as needed.
$(DIST_DIRS):
	mkdir -p "$@"

# https://github.com/microsoft/TypeScript/issues/27379#issuecomment-534078265
# https://stackoverflow.com/q/59403596/65387
#dist/%.d.ts: src/%.ts $(YI)
#	$(NB)/tsc --emitDeclarationOnly $< --outFile $@

# Build TypeScript declaration (.d.ts) files.
tsdecls: $(YI)
	$(NB)/tsc --emitDeclarationOnly

# Transpile TS to JS.
alljs: $(YI)
	BABEL_ENV=production $(NB)/babel --out-dir dist --extensions ".ts" --source-maps true --no-comments $(SRC_TS)

# Run the TypeScript source code directly in development mode.
dev: $(YI)
	BABEL_ENV=development $(NB)/babel-node --max_old_space_size=10000 --extensions ".ts" -r register-pretty-error src/index.ts

# Build the code for production and run it. May catch compilation errors but shouldn't be executed this way in prod.
prod: $(DIST_FILES)
	node -r register-pretty-error dist/index

# Check source code for TypeScript errors.
check: $(YI)
	$(NB)/tsc --noEmit

# Delete build files.
clean:
	rm -rf dist yarn-error.log

# Build and publish the compiled sources to npm.
publish: build
	cd dist && npm publish

$(YI): yarn.lock
	@yarn install --frozen-lockfile --production=false --check-files
	@touch -mr $@ $<

yarn.lock: package.json
	@yarn check --integrity
	@touch -mr $@ $<

dist/package.json: package.json | dist
	jq 'del(.private, .devDependencies, .scripts, .eslintConfig, .babel)' $< > $@

dist/README.md: README.md
	cp "$<" "$@"

test: $(YI)
	$(NB)/mocha --watch
