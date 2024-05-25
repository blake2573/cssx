import { parseAttributeValue } from './html.js'
import { parseParams, replaceParams } from './params.js'

/**
 * For a given input string, parse the mixin name and parameters into a tree node if the string is a valid mixin format.
 * 
 * - Valid mixin format: `@mixin name($param1: value, $param2: value, ...)`
 * @param {string} text The input string to parse provided as a line from the CSSX file
 * @returns An empty object or a valid mixin tree node
 */
function parseMixin(text) {
    var ret = {}

    if (text.search('@mixin ') === 0) {
        // Parse the mixin parameters from the string between the parentheses
        // Note: this can be validly empty
        var params = parseParams(text.match(/\(([^)]*)\)/)[1])

        // The mixin value here is the name of the mixin, parsed as regex as any text between the word '@mixin' and the opening parenthesis
        ret = {
            value: text.match(/@mixin\s*(.*?)\s*\(/)[1],
            params: params,
            type: 'mixin',
            deleted: true
        }
    }

    return ret
}

/**
 * Recursively override the parameters of a tracked mixin tree node with the provided parameters.
 * Mixin params can be used at any level of nesting within the mixin, so cannot rely on just replacing at the top level.
 */
function overrideParams(trackedNode, params) {
    if (!trackedNode) return
  
    trackedNode.children = trackedNode.children
        .map(child => ({...child, name: replaceParams(child.name, params)}))
  
    trackedNode.attrs = trackedNode.attrs
        .map(child => ({...child, value: replaceParams(parseAttributeValue(params[child.value] || child.value), params)}))
  
    // Recursively process children
    if (trackedNode.children) {
        trackedNode.children.forEach(child => overrideParams(child, params))
    }
}

export { overrideParams, parseMixin }

