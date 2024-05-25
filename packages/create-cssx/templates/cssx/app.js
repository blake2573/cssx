import connectLiveReload from 'connect-livereload';
import { parseCss, parseHtml } from 'cssx-framework';
import express from 'express';
import { readdirSync, readFile } from 'fs';
import { createServer } from 'livereload';
import { basename, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

function generateRoutes(app, dirPath) {
    const files = readdirSync(dirPath)
    const __dirname = dirname(fileURLToPath(import.meta.url))

    files.forEach(file => {
        const filePath = join(dirPath, file)
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
const liveReloadServer = createServer()
liveReloadServer.server.once("connection", () => {
    setTimeout(() => {
        liveReloadServer.refresh("/")
    }, 100)
})
app.use(connectLiveReload())

// Define SPA routes
generateRoutes(app, './routes');
app.get('/', (_, res) => res.redirect('/home'))

// Start the application
app.listen(3000, () => console.log('Server started on port 3000'))
