import { CHARS } from "./chars.js"

/**
 * Parse the parameters for a mixin from a given line of text. Parameters should be prefixed with a `$`, include a default value, and be comma-separated.
 * 
 * - eg: `$param1: value, $param2: value, ...`
 * 
 * _Note: whitespace is optional and will be trimmed_
 * @param {string} text The content of the mixin definition that is contained within the parentheses
 * @returns An object containing the parsed parameters as key-value pairs
 */
function parseParams(text) {
  if (!text) return {}

  return text.trim().split(CHARS.COMMA).reduce((acc, part) => {
    const [key, value] = part.split(CHARS.COLON).map(segment => segment.trim())
    acc[key] = value
    return acc
  }, {})
}

const replaceParams = (text, vars) =>
  Object.entries(vars)
    .reduce((currentText, [key, value]) => 
      currentText.replace(key, value),
      text
    )

export { parseParams, replaceParams }

