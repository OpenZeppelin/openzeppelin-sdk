'use strict'

export default class ScriptError extends Error {
  constructor({ message, stack }, cb) {
    super(message)
    this.stack = stack
    this.cb = cb
  }
}
