import { ariaAttributes } from 'aria-attributes'
import { htmlElementAttributes } from 'html-element-attributes'
import { htmlEventAttributes } from 'html-event-attributes'
import { htmlTagNames } from 'html-tag-names'
import { CHARS } from './chars.js'
import { replaceVariables } from './variables.js'

const GET_PROPERTY_VALUE_REGEX = /\:\s*(.*)\s*\;/

/**
 * Used to unescape strings that are wrapped in double quotes.
 * 
 * eg. `"Hello World, it\'s me"` -> `Hello World, it's me`
 * @param {string} text The input string to parse
 * @returns {string} Unescaped string value
 */
const parseAttributeValue = (text) =>
    JSON.parse(text.startsWith(CHARS.DOUBLE_QUOTE) ? text : `${CHARS.DOUBLE_QUOTE}${text}${CHARS.DOUBLE_QUOTE}`)

/**
 * Parse a given string into a valid tree node if it is a valid HTML element or attribute.
 * @param {string} text The input string to parse provided as a line from the CSSX file
 * @param {*} parent The current tracked parent in the tree, used for filtering attributes based on the parent element for performance improvements
 * @returns A valid tree node or null if the input string is not a valid HTML element or attribute
 */
function parseContentToTree(text, parent = null) {
    if (!text) return null

    let html = {}
  
    htmlTagNames
        .filter(elementTag => {
            const regex = new RegExp(`^${elementTag}(\\.|\\s|\\{).*`)
            return regex.test(text)
        })
        .forEach(elementTag => {
            html = {
                value: elementTag,
                type: 'element',
                attrs: []
            }

            if (text.includes(`${elementTag}${CHARS.DOT}`)) {
                var className = text.split(CHARS.DOT)[1].split(CHARS.SPACE)[0]
                html.attrs.push({
                    name: 'class',
                    value: className,
                    type: 'attribute'
                })
            }
        })

    if (Object.keys(html).length > 0) return html
  
    Object
        .entries(htmlElementAttributes)
        .filter(([element, _]) => parent === null || (element === CHARS.ASTERISK || parent.value === element))
        .flatMap(([_, attributes]) => attributes)
        .concat(htmlEventAttributes)
        .concat(ariaAttributes)
        .filter(attribute => {
            const regex = new RegExp(`^${CHARS.DOUBLE_HYPHEN}${attribute}\\s*\\:`)
            return regex.test(text)
        })
        .forEach(attribute => {
            var value = text.match(GET_PROPERTY_VALUE_REGEX)[1]
            html = {
                name: attribute,
                value: parseAttributeValue(value),
                type: 'attribute'
            }
        })

    if (Object.keys(html).length > 0) return html

    return null
}

function parseHtmlContentOrDefault(obj, vars) {
    var returnText = obj.name
    var returnElementTag = ''

    if (obj.type === 'element') {
        // For regular attributes, take only the last value for each attribute to remove duplicates
        // For event attributes, combine all values into a single concatenated string to allow multi-line functions
        var attrsObj = obj.attrs.reduce((acc, attr) => (
            {
                ...acc,
                [attr.name]: acc.hasOwnProperty(attr.name) && htmlEventAttributes.includes(attr.name)
                    ? `${acc[attr.name]} ${attr.value}`
                    : attr.value
            }
        ), {})
        returnText = `${CHARS.LESS_THAN}${obj.value} ${Object.entries(attrsObj).map(([name, value]) => `${name}="${replaceVariables(value, vars)}"`).join(CHARS.SPACE)}${CHARS.GREATER_THAN}`
        returnElementTag = `${CHARS.LESS_THAN}${CHARS.SLASH}${obj.value}${CHARS.GREATER_THAN}`
    }

    if (obj.name.includes(`${CHARS.DOUBLE_HYPHEN}text`)) {
        var value = obj.name.match(GET_PROPERTY_VALUE_REGEX)[1]
        returnText = parseAttributeValue(value)
    }

    return [returnText, returnElementTag]
}

export { parseAttributeValue, parseContentToTree, parseHtmlContentOrDefault }

