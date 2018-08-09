'use strict'

import shell from 'shelljs'

export function exec(command) {
  handleCommandOutput(shell.exec(command))
}

export function cd(directory) {
  handleCommandOutput(shell.cd(directory))
}

export function cp(source, destination) {
  handleCommandOutput(shell.cp(source, destination))
}

export function rm(filename, options) {
  if (options) {
    handleCommandOutput(shell.rm(options, filename))
  } else {
    handleCommandOutput(shell.rm(filename))
  }
}

function handleCommandOutput(commandOutput) {
  if (commandOutput.code !== 0) {
    throw Error( `Command line operation failed with code ${commandOutput.code}. Standard error output: ${commandOutput.stderr}`)
  }
}

