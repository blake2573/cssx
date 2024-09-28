import { ariaAttributes } from 'aria-attributes'
import { htmlElementAttributes } from 'html-element-attributes'
import { htmlEventAttributes } from 'html-event-attributes'
import { htmlTagNames } from 'html-tag-names'
import { CHARS } from './chars.js'
import { replaceVariables } from './variables.js'

const GET_PROPERTY_VALUE_REGEX_TEXT = /\:\s*(.*)\s*$/
const GET_PROPERTY_VALUE_REGEX = /[^:\s][^:\n]*$/

const getRegex = (text) =>
    text.split(CHARS.COLON).length - 1 > 1 || !text.includes(CHARS.DOUBLE_QUOTE)
        ? {
            string: GET_PROPERTY_VALUE_REGEX_TEXT,
            index: 1
        }
        : {
            string: GET_PROPERTY_VALUE_REGEX,
            index: 0
        }

/**
 * Unescapes a string manually.
 * @param {string} text The input string to unescape
 * @returns {string} Unescaped string value
 */
const unescapeString = (text) => {
    return text
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

/**
 * Used to unescape strings that are wrapped in double quotes.
 * 
 * eg. `"Hello World, it\'s me"` -> `Hello World, it's me`
 * @param {string} text The input string to parse
 * @returns {string} Unescaped string value
 */
const parseAttributeValue = (text) => {
    const unescapedText = text.startsWith(CHARS.DOUBLE_QUOTE) 
        ? text.substring(1, text.lastIndexOf(CHARS.DOUBLE_QUOTE))
        : text;
    return unescapeString(unescapedText);
}

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
            var regex = getRegex(text)
            var value =  (text.match(regex.string) ?? [])[regex.index] ?? ''
            html = {
                name: attribute,
                value: parseAttributeValue(value),
                type: 'attribute',
                isEndMultiline: value.trim().endsWith(`${CHARS.DOUBLE_QUOTE}${CHARS.SEMICOLON}`)
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
        var regex = getRegex(obj.name)
        var value = obj.name.match(regex.string)[regex.index]
        returnText = parseAttributeValue(value)
    }

    return [returnText, returnElementTag]
}

export { parseAttributeValue, parseContentToTree, parseHtmlContentOrDefault }

