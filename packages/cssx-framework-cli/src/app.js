import connectLiveReload from 'connect-livereload';
import { parseCss, parseHtml } from 'cssx-framework';
import express from 'express';
import { existsSync, readdirSync, readFile, readFileSync } from 'fs';
import { createServer } from 'livereload';
import { basename, dirname, extname, join, resolve } from 'path';

// Read and parse the configuration file
const rootDir = process.cwd()
const configPath = resolve(rootDir, 'cssx.json')
let config = {
    "port": 3000,
    "routeDir": "./routes",
    "defaultRoute": "/home"
}

if (existsSync(configPath)) {
    const configFile = readFileSync(configPath, 'utf-8')
    const fileConfig = JSON.parse(configFile)
    config = { ...config, ...fileConfig }
}

function generateRoutes(app, relativeRouteDirPath) {
    const files = readdirSync(relativeRouteDirPath)
    const __dirname = resolve(rootDir)

    files.forEach(file => {
        const filePath = join(relativeRouteDirPath, file)
        const routePath = '/' + basename(file, extname(file))

        app.get(routePath, (_, res) => {
            readFile(join(__dirname, 'index.html'), 'utf8', (err, indexData) => {
                if (err) {
                    console.error(err)
                    res.status(500).send('An error occurred')
                    return
                }

                readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error(err)
                        res.status(500).send('An error occurred')
                        return
                    }

                    const result = indexData
                        .replace('<div id="app"></div>', `<div id="app">${parseHtml(data, dirname(filePath))}</div>`)
                        .replace('<style id="stylesheet"></style>', `<style id="stylesheet">${parseCss(data, dirname(filePath))}</style>`)

                    res.send(result)
                })
            })
        })
    })
}

// Initialize the framework
const app = express()

// Add livereload
const liveReloadServer = createServer({ extraExts: ['cssx'] })
liveReloadServer.watch(rootDir)
liveReloadServer.server.once("connection", () => {
    setTimeout(() => liveReloadServer.refresh("/"), 100)
})

app.use(connectLiveReload())

// Define SPA routes
generateRoutes(app, config.routeDir)
app.get('/', (_, res) => res.redirect(config.defaultRoute))

// Start the application
app.listen(config.port, () => console.log(`Server started on port ${config.port}`))
