'use strict'

export default class ScriptError extends Error {
  constructor(message, cb) {
    super(message)
    this.cb = cb
  }
}
