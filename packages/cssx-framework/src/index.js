import analyze from './analyze.js'
import { CHARS } from './chars.js'
import * as tree from './tree.js'

/**
 * Parses a given file line by line into HTML.
 * @param {string} data The raw file data to parse
 * @param {string} dirname The directory name of the calling file, used for resolving relative paths for imports
 * @returns {string} A string in the format of valid HTML
 */
function parseHtml(data, dirname) {
  return tree.transformToHtml(
    tree.ify(
      analyze(
        data.split(CHARS.NEWLINE)
      ),
      dirname
    )
  ).join(CHARS.NEWLINE)
}

/**
 * Parses a given file line by line into CSS.
 * @param {string} data The raw file data to parse
 * @param {string} dirname The directory name of the calling file, used for resolving relative paths for imports
 * @returns {string} A string in the format of valid CSS
 */
function parseCss(data, dirname) {
  return tree.transformToCss(
    tree.ify(
      analyze(
        data.split(CHARS.NEWLINE)
      ),
      dirname
    )
  ).join(CHARS.NEWLINE)
}

export { parseCss, parseHtml }

