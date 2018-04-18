#! /usr/bin/env node

const shelljs = require('shelljs')

function run() {
  const node = 'npx babel-node'
  const script = `./scripts/${process.argv[2]}.js`
  const args = process.argv.slice(3).join(' ')
  const command = `${node} ${script} ${args}`

  shelljs.exec(command)
}

run()