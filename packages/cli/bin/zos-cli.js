#! /usr/bin/env node

const Path = require('path')
const shelljs = require('shelljs')

function run() {
  const bin = 'npx truffle exec'
  const script = Path.resolve(__dirname, '../lib/entrypoint.js')
  const args = process.argv.slice(2).join(' ')
  const command = `${bin} ${script} ${args}`

  shelljs.exec(command)
}

run()