all: static/bundle.js static/style.css

prod: static/bundle.min.js static/style.min.css
	mv static/bundle.min.js static/bundle.js
	mv static/style.min.css static/style.css

static/bundle.js: $(shell find src -name "*.js")
	./node_modules/.bin/browserifyinc src/App.js -dv --outfile static/bundle.js

static/bundle.min.js: $(shell find src -name "*.js")
	./node_modules/.bin/browserify src/App.js -g [ envify --NODE_ENV production ] -g uglifyify | ./node_modules/.bin/terser --compress --mangle > static/bundle.min.js

static/style.css: src/style.styl
	./node_modules/.bin/stylus < src/style.styl > static/style.css

static/style.min.css: src/style.styl
	./node_modules/.bin/stylus -c < src/style.styl > static/style.min.css
