import { readFileSync } from 'fs'
import { join } from 'path'
import _analyze from './analyze.js'
import { CHARS } from './chars.js'
import { parseContentToTree, parseHtmlContentOrDefault } from './html.js'
import { overrideParams, parseMixin } from './mixins.js'
import { findVariables, replaceVariables } from './variables.js'

const isComment = (text) => text.startsWith(CHARS.DOUBLE_SLASH)
const isImport = (text) => text.includes('@import')
const isIncludeMixin = (text) => text.includes('@include')
const isStartParentBlock = (text) => text.trim().endsWith(CHARS.OPEN_BRACE)
const isEndParentBlock = (text) => text.trim().endsWith(CHARS.CLOSE_BRACE)

/**
 * Tree-ify the input CSSX file line-by-line into a tree structure for easier manipulation and transformation. Only top level root nodes are returned,
 * with all appropriate children nested within their respective parents.
 * @param {string[]} input The array of lines as strings from the CSSX input file
 * @param {string} dirname The directory name of the parent calling file, used for resolving relative paths for imports
 * @returns An array of objects in a tree structure representing the parsed CSSX file
 */
function ify(input, dirname) {
  var parents = []
  var mixins = []
  var trackedMultilineAttribute = null

  var recursion = function(input) {
    return input
      .filter(line => line.l || line.r)
      .map((line, idx) => {
        var treeNode = {
          original: line.r,
          name: line.r,
          attrs: [],
          children: [],
          parent: null,
          lineIndex: idx
        }

        if (isComment(treeNode.name)) return

        if (trackedMultilineAttribute)
          treeNode = {
            ...treeNode,
            name: `${CHARS.DOUBLE_HYPHEN}${trackedMultilineAttribute.name}${CHARS.COLON} ${treeNode.name}`
          }

        // If the current line is an import statement, process the file to retrieve any relevant mixins into memory
        // This block doesn't return anything because the import statement is not a part of the final tree, it's just providing code references
        if (isImport(treeNode.name)) {
          var importPath = treeNode.name.match(/\'\s*(.*?)\s*\'/)[1]
          var importData = readFileSync(join(dirname, importPath), 'utf8')
          recursion(_analyze(importData.split(CHARS.NEWLINE)))

          return
        }

        // Get the most recent parent if one exists
        var parent = parents[parents.length - 1]

        // Initial parsing to a tree node
        treeNode = {...treeNode, ...parseContentToTree(treeNode.name, parent !== null && parent?.type !== 'mixin' ? parent : null), ...parseMixin(treeNode.name)}

        if (trackedMultilineAttribute && treeNode.isEndMultiline)
          trackedMultilineAttribute = null

        if (treeNode.type === 'attribute' && treeNode.value === '') {
          trackedMultilineAttribute = treeNode
          return
        }

        // Add or remove parents from tracked hierarchy based on braces
        // If a mixin was the most recent parent being dropped from the list, add it to the list of known mixins
        if (isStartParentBlock(treeNode.name))
          parents.push(treeNode)
        else if (isEndParentBlock(treeNode.name)) {
          var previousParent = parents.pop()

          if (previousParent.type === 'mixin')
            mixins.push(previousParent)
        }

        // If there is no current parent, return the element as a root element in the tree
        if (parent == null) return treeNode

        treeNode.parent = parent

        // If the current element is an include statement, find the matching mixin and prepend its children + attrs to the current parent
        // If it can't find a mixin, it will just ignore the include statement. A linter could help here perhaps? Compile time warnings?
        if (isIncludeMixin(treeNode.name)) {
          treeNode.deleted = true
          var mixinName = treeNode.name.match(/@include\s*(.*?)\s*(\(|\;)/)[1]
          var mixin = mixins.find(mixin => mixin.value === mixinName)

          // if elem.name has parentheses and override props in it, parse them out and replace the mixin's params with them
          // make sure to slice the mixin children when adding them to the parent and replacing params
          var params = Object.keys(mixin?.params || {}).length === 0 ? {} : {...mixin.params}

          if (treeNode.name.includes(CHARS.OPEN_PAREN)) {
            var paramOverrides = treeNode.name.match(/\(([^)]*)\)/)[1].split(CHARS.COMMA)

            if (paramOverrides.some(p => !!p)) {
              Object.keys(params).forEach((key, index) => {
                var overrideValue = paramOverrides[index].trim()
                params[key] = overrideValue === 'default' ? params[key] : overrideValue
              })
            }
          }

          if (mixin) {
            var newMixin = {...mixin}
            overrideParams(newMixin, params)

            // because the params could have been intended to override event attribute definitions, we need to reparse the mixin's children before pushing them to the parent
            // and because attributes could be defined interweaved with children (recursively), we need to reprocess them as well, ensuring they are sorted in original definition order
            const flattenChildren = (children) =>
              children.reduce((acc, child) => {
                acc.push({ text: child.name, idx: child.lineIndex })
                if (child.children && child.children.length > 0) {
                  acc = acc.concat(flattenChildren(child.children))
                }
                return acc
              }, [])
            
            recursion(
              _analyze(
                flattenChildren(
                  newMixin
                  .children
                  .filter(child => child.name.trim() !== CHARS.CLOSE_BRACE)
                )
                .concat(
                    newMixin.attrs.map(attr => ({ text: attr.original, idx: attr.lineIndex }))
                )
                .sort((a, b) => a.idx - b.idx)
                .map(child => child.text)
              )
            )
          }
        }

        // Push current element to appropriate parent property based on type
        if (treeNode.type === 'attribute')
          parent.attrs.push(treeNode)
        else
          parent.children.push(treeNode)
      })
  }

  var ret = recursion(input)

  return ret.filter(a => a)
}

function printTree(tree, i) {
  i = i || 0
console.log(tree)
  tree.forEach(k => {
    // console.log('depth: ' + i)
    // console.log('name: ' + k.name)
    // console.log('parent: ' + k.parent?.name)
    // console.log('attrs: ' + k.attrs)
    // console.log('children: ' + k.children.map(c => c.name))

    printTree(k.children, i + 1)
  })
}

/**
 * Transforms the tree of nodes into an array of strings representing HTML content
 * @param {*} tree 
 * @returns {string[]}
 */
function transformToHtml(tree) {
  var variables = findVariables(tree)
  var htmlElementCloseTags = []

  var recursion = function(tree, i, vars) {
    return tree.map(child => {
      if (child.deleted) return ''

      var ret = ''
      var prefix = CHARS.SPACE.repeat(i * 4)
      var name = replaceVariables(replaceVariables(child.name, vars), variables)
      let [htmlContent, returnElementTag] = parseHtmlContentOrDefault({...child, name: name}, variables)
      
      name = htmlContent
      
      if (returnElementTag !== '')
        htmlElementCloseTags.push({
            tag: returnElementTag,
            depth: i
        })

      if (returnElementTag !== '' || child.name.includes('--text'))
        ret = `${prefix}${name}`

      if (child.children.length) {
        var children = recursion(child.children, i + 1).filter(x => x != '')
        if (children.length > 0)
          ret += CHARS.NEWLINE + children.join(CHARS.NEWLINE)
      }

      if(name.trim() === CHARS.CLOSE_BRACE && htmlElementCloseTags.length > i - 1 && htmlElementCloseTags[htmlElementCloseTags.length - 1].depth === i - 1) {
        var htmlCloseTag = htmlElementCloseTags.pop()
        ret = `${CHARS.SPACE.repeat(htmlCloseTag.depth * 4)}${htmlCloseTag.tag}`
      }

      return ret
    })
  }
  var ret = recursion(tree, 0)

  return ret.filter(o => o !== '')
}

/**
 * Transforms the tree of nodes into an array of strings representing CSS content
 * @param {*} tree 
 * @returns {string[]}
 */
function transformToCss(tree) {
  var variables = findVariables(tree)
  // printTree(tree)

  var recursion = function(tree, i, vars) {
    return tree
      .filter(child => !child.name.includes('--text'))
      .map(child => {
        if (child.deleted) return ''

        var ret = ''
        var prefix = CHARS.SPACE.repeat(i * 4)
        var name = replaceVariables(replaceVariables(child.name, vars), variables)

        ret = `${prefix}${name}`

        if (child.children.length) {
          var children = recursion(child.children, i + 1).filter(x => x != '')
          if (children.length > 0)
            ret += CHARS.NEWLINE + children.join(CHARS.NEWLINE)
        }

        if(name.trim() === CHARS.CLOSE_BRACE) {
          ret = `${CHARS.SPACE.repeat((i - 1) * 4)}${name}`
        }

        return ret
      })
  }
  var ret = recursion(tree, 0)

  return ret.filter(o => o !== '')
}

export { ify, transformToCss, transformToHtml }

