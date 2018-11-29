import { Logger } from 'zos-lib'

const log = new Logger('compile')

export default async function compile(config = undefined) {
  log.info("Compiling contracts")
  config = config || this.config()
  config.all = true
  const TruffleCompile = require('truffle-workflow-compile')

  return new Promise((resolve, reject) => {
    TruffleCompile.compile(config, (error, abstractions, paths) => {
      if (error) reject(error)
      else resolve(abstractions, paths)
    })
  })
}
