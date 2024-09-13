import { parseCss, parseHtml } from 'cssx-framework';
import { existsSync, mkdirSync, readdirSync, readFile, readFileSync, writeFile } from 'fs';
import { basename, dirname, extname, join, resolve } from 'path';

// Read and parse the configuration file
const rootDir = process.cwd()
const configPath = resolve(rootDir, 'cssx.json')
let config = {
    "port": 3000,
    "routeDir": "./routes",
    "defaultRoute": "/home",
    "outputDir": "./dist"
}

if (existsSync(configPath)) {
    const configFile = readFileSync(configPath, 'utf-8')
    const fileConfig = JSON.parse(configFile)
    config = { ...config, ...fileConfig }
}

function generateRouteFiles(relativeRouteDirPath, outputDir) {
    const files = readdirSync(relativeRouteDirPath)
    const __dirname = resolve(rootDir)

    if (!existsSync(outputDir)) {
        console.log('Creating output directory...')
        mkdirSync(outputDir)
    }

    console.log('Parsing CSSX files...')
    files.forEach(file => {
        const filePath = join(relativeRouteDirPath, file)

        readFile(join(__dirname, 'index.html'), 'utf8', (err, indexData) => {
            if (err) {
                console.error(err)
                return
            }

            readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err)
                    return
                }

                const result = indexData
                    .replace('<div id="app"></div>', `<div id="app">${parseHtml(data, dirname(filePath))}</div>`)
                    .replace('<style id="stylesheet"></style>', `<style id="stylesheet">${parseCss(data, dirname(filePath))}</style>`)
                
                const outputFilename = join(outputDir, `${basename(file, extname(file))}.html`)
                
                writeFile(outputFilename, result, (err) => {
                    if (err) console.error(err)
                })
            })
        })
    })
}

function copyAssets(assetsDirectoryPath, outputAssetsDirectoryPath) {
    const assetsDir = resolve(rootDir, assetsDirectoryPath)
    const outputAssetsDir = resolve(rootDir, outputAssetsDirectoryPath)

    if (!existsSync(outputAssetsDir)) {
        console.log('Creating assets output directory...')
        mkdirSync(outputAssetsDir)
    }

    console.log('Copying asset files...')
    readdirSync(assetsDir).forEach(file => {
        const filePath = join(assetsDir, file)
        const outputFilename = join(outputAssetsDir, file)

        readFile(filePath, (err, data) => {
            if (err) {
                console.error(err)
                return
            }

            writeFile(outputFilename, data, (err) => {
                if (err) console.error(err)
            })
        })
    })
}

generateRouteFiles(config.routeDir, config.outputDir)

if (config.assetsDir) copyAssets(config.assetsDir, config.outputDir)

console.log('Build complete!')