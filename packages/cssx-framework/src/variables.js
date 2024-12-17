
const PARSE_VARIABLE_REGEX = /^(\$.*[^\s])\s*:\s*(.*);/

const BUILT_IN_FUNCTIONS = {
  '$setVariable': 'document.getElementById(\'stylesheet\').sheet.cssRules[0].style.setProperty',
  '$getVariable': 'document.getElementById(\'stylesheet\').sheet.cssRules[0].style.getPropertyValue',
  '$parseObject': 'JSON.parse',
  '$stringifyObject': 'JSON.stringify',
}

/**
 * Parses CSSX variables from the tree and returns them in a key-value pair object
 * 
 * eg. `$primary-color: #333;` -> `{ '$primary-color': '#333' }`
 * @param {*} tree 
 * @returns Key-value pair object of CSS variables
 */
const findVariables = (tree) =>
  tree.reduce((acc, child) => {
    const match = child.name.match(PARSE_VARIABLE_REGEX)
    
    if (match) {
      acc[match[1]] = match[2]
      child.deleted = true
    }
    
    return acc
  }, BUILT_IN_FUNCTIONS)

  /**
   * For a given input string, replaces any variables with their respective values from the provided vars object
   * 
   * eg. `color: $primary-color;` -> `color: #333;`
   * @param {string} text The input string to parse
   * @param {*} vars The key-value pair object of CSSX variables
   * @returns {string} Input string with any variables replaced
   */
const replaceVariables = (text, vars) =>
  Object.entries(vars || {})
    .reduce((currentText, [key, value]) => 
      currentText.replaceAll(key, value),
      text
    )

export { findVariables, replaceVariables }

