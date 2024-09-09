import { spawn } from 'child_process'
import { Command } from 'commander'
import fs from 'fs'
import { fileURLToPath } from "node:url"
import path from 'path'

const program = new Command()

program
  .name('cssx')
  .description('CLI for running the CSSX web framework')
  .version('0.1.2')
  .action(() => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const serverFunctionPath = path.resolve(__dirname, 'server.js')

    if (!fs.existsSync(serverFunctionPath)) {
        console.error('Error: server.js not found at', serverFunctionPath)
        process.exit(1)
    }

    var nodeProcess = spawn('node', [serverFunctionPath], { stdio: 'inherit' })

    nodeProcess.on('close', function (code) {
        process.exit(code)
    })
  })

program
  .command('build')
  .description('Build the CSSX project')
  .action(() => {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const buildFunctionPath = path.resolve(__dirname, 'build.js')

    if (!fs.existsSync(buildFunctionPath)) {
        console.error('Error: build.js not found at', buildFunctionPath)
        process.exit(1)
    }

    var nodeProcess = spawn('node', [buildFunctionPath], { stdio: 'inherit' })

    nodeProcess.on('close', function (code) {
        process.exit(code)
    })
  })

program.parse(process.argv)