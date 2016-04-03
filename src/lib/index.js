import _ from 'lodash';
import path from 'path';
import Promise, { promisify } from 'bluebird';
import sander from 'sander';
import sass from 'node-sass';
import subdir from 'subdir';
import { cache, matcher } from 'exhibit';

const renderSass = promisify(sass.render);

const sassExtension = /\.s[ca]ss$/;

const defaults = {
	match: '**/*.{scss,sass}',
	sourceMap: true,
	sourceMapEmbed: true,
};

const permittedOptions = [
	'indentType', 'indentWidth', 'linefeed', 'outputStyle',
	'precision', 'sourceComments', 'sourceMap', 'sourceMapEmbed',
];

export default function (_options) {
	const options = _.assign({}, defaults, _options);

	if (!options.root) {
		options.root = (
			process.platform === 'win32'
				? 'X:\\__exhibit-babel-root'
				: '/__exhibit-babel-root'
		);
	}

	options.root = path.resolve(options.root);

	// TODO: alias option names (eg sourceMap -> sourceMaps)

	if (_.isString(options.loadPaths)) options.loadPaths = [path.resolve(options.loadPaths)];
	else if (_.isArray(options.loadPaths)) {
		options.loadPaths = options.loadPaths.map(name => path.resolve(name));
	}

	const match = matcher(options.match);

	const sassOptions = _.pick(options, permittedOptions);

	return cache(async (contents, name, include) => {
		if (!match(name)) return contents;

		if (path.basename(name)[0] === '_') return null;

		const outputName = `${name.replace(sassExtension, '')}.css`;

		// if the source SCSS file is blank, return a blank CSS file now
		// (necessitated by https://github.com/sass/node-sass/issues/924)
		const source = contents.toString();
		if (!source) return { [outputName]: '' };

		const absoluteEntryFile = path.resolve(options.root, name);

		// keep memos of how imports get resolved, in case we need this info to
		// report an error that originated from a partial :\
		const rememberedImportContents = {};

		const config = _.assign({
			data: source,

			importer: (arg, prev, done) => {
				// Resolve the import `arg`, load the contents (either internally or from
				// a load path), and call the callback with {file, contents} or an error.
				// NB contents must be a string.

				(async () => {
					try {
						let result;

						// establish which file the @import statement was encountered in
						const importer = (prev === 'stdin' ? absoluteEntryFile : prev);
						console.assert(
							path.isAbsolute(importer),
							'importing file should be absolute at this point'
						);

						// establish where we're looking...
						const importerDirname = path.dirname(importer);
						const loadPaths = [importerDirname];
						if (options.loadPaths) for (const p of options.loadPaths) loadPaths.push(p);

						const argBasename = path.basename(arg);
						const argDirname = path.dirname(arg);

						// try each of the loadPaths (directories) in turn
						for (const loadPath of loadPaths) {
							const hasUnderscore = argBasename.charAt(0) === '_';
							const hasExtension = sassExtension.test(arg);

							// make a list of candidates
							const candidates = [];
							if (!hasUnderscore) {
								if (hasExtension) {
									candidates.push(path.join(argDirname, `_${argBasename}`), arg);
								} else {
									candidates.push(
										path.join(argDirname, `_${argBasename}.scss`),
										path.join(argDirname, `_${argBasename}.sass`),
										`${arg}.scss`,
										`${arg}.sass`
									);
								}
							} else if (hasExtension) {
								candidates.push(arg);
							} else candidates.push(`${arg}.scss`, `${arg}.sass`);

							// convert to full paths and filter out those that don't exist
							const existentCandidates = await Promise.map(candidates, async _candidate => {
								const candidate = path.resolve(loadPath, _candidate);
								// try to import it, either with include() if it's inside the base,
								// otherwise straight from disk
								if (subdir(options.root, candidate)) {
									const candidateContents = include(path.relative(options.root, candidate));
									if (candidateContents) {
										return {
											file: candidate,
											contents: candidateContents.toString(),
										};
									}
									return false;
								}

								// requrested file is not internal to the filemap; try to import it from disk
								let candidateContents;
								try {
									// TODO work out why `await sander.readFile()` never
									// fulfills/rejects here
									candidateContents = sander.readFileSync(candidate, { encoding: 'utf-8' });
								} catch (error) {
									if (error.code !== 'ENOENT') throw error;
									return false;
								}

								return { contents: candidateContents.toString(), file: candidate };
							}).filter(x => x);

							// if nothing found, move onto the next load path
							if (existentCandidates.length === 0) continue;

							// if too many found, complain that it's ambiguous
							if (existentCandidates.length > 1) {
								throw new Error(`
									It's not clear which file to import for '@import "${arg}"' in file "${importer}".
									Candidates:
									${existentCandidates.map(x => x.file).join('\n')}
									Please delete or rename all but one of these files.
								`);
							}

							// just one candidate exists; use it
							result = existentCandidates[0];

							break;
						}

						if (!result) {
							// can't find any suitable file.
							// send an error **back to sass**, which will in turn send us a new error
							// that includes file/line location of the offending @import statement.
							throw new Error(`File to import not found or unreadable: ${arg}`);
						}

						// add it to the memos in case of errors loading a deeper import
						rememberedImportContents[result.file] = result.contents;

						done(result);
					} catch (error) {
						done(error);
					}
				})();
			},
		}, sassOptions);

		let result;

		try {
			result = await renderSass(config);
		} catch (error) {
			// TODO pretty print excerpt
			throw error;
		}

		return { [outputName]: result.css };
	});
}
