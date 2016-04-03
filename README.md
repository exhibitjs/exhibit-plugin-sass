# exhibit-plugin-sass

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
