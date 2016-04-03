# exhibit-plugin-sass

[![NPM version][npm-image]][npm-url] [![Linux Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

Converts `.scss` and `.sass` files to `.css`.

## Install

```sh
> npm install -D exhibit-plugin-sass
```

## Usage

```js
plugin('sass', options);
```

## Options

- `root` (string) – set this to where the files originate from, e.g. `app` or `src`.
- `loadPaths` - array of additional directories to look for imports in, e.g. `['bower_components']`

You can also set any of the following [node-sass options](https://github.com/sass/node-sass#options):

```
indentType  indentWidth  linefeed  outputStyle
precision  sourceComments  sourceMap  sourceMapEmbed
```


[npm-url]: https://npmjs.org/package/exhibit-plugin-sass
[npm-image]: https://img.shields.io/npm/v/exhibit-plugin-sass.svg?style=flat-square

[travis-url]: https://travis-ci.org/exhibitjs/exhibit-plugin-sass
[travis-image]: https://img.shields.io/travis/exhibitjs/exhibit-plugin-sass.svg?style=flat-square&label=Linux

[appveyor-url]: https://ci.appveyor.com/project/exhibitjs/exhibit-plugin-sass
[appveyor-image]: https://img.shields.io/appveyor/ci/exhibitjs/exhibit-plugin-sass/master.svg?style=flat-square&label=Windows

[depstat-url]: https://david-dm.org/exhibitjs/exhibit-plugin-sass
[depstat-image]: https://img.shields.io/david/exhibitjs/exhibit-plugin-sass.svg?style=flat-square
