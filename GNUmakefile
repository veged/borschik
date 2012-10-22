
all: $(patsubst %.ometajs,%.ometajs.js,$(shell find lib -name '*.ometajs'))

%.ometajs.js: %.ometajs
	./node_modules/.bin/ometajs2js -i $< -o $@

tests:
	./bin/borschik -t css -i tests/a.css -o tests/_a.css

test:
	node_modules/.bin/mocha

lib-cov:
	-rm -rf lib-cov
	node_modules/visionmedia-jscoverage/jscoverage lib lib-cov

test-cover: lib-cov test
	COVER=1 node_modules/.bin/mocha --reporter html-cov > coverage.html
	@echo
	@echo Open ./coverage.html file in your browser

.PHONY: all tests test lib-cov test-cover
