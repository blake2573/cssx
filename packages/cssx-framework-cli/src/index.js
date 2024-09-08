import { spawn } from 'child_process'
import { Command } from 'commander'
import fs from 'fs'
import { fileURLToPath } from "node:url"
import path from 'path'

const program = new Command()

program
  .name('cssx')
  .description('CLI for running the CSSX web framework')
  .version('0.0.1')
  .action(() => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const appPath = path.resolve(__dirname, 'app.js')

    if (!fs.existsSync(appPath)) {
        console.error('Error: app.js not found at', appPath)
        process.exit(1)
    }

    var nodeProcess = spawn('node', [appPath], { stdio: 'inherit' })

    nodeProcess.on('close', function (code) {
        process.exit(code)
    })
  })

program.parse(process.argv)