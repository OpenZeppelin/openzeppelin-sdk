'use strict'

export class DeployError extends Error {
  constructor({ message, stack }, props) {
    super(message)
    this.stack = stack
    Object.keys(props).forEach(prop => this[prop] = props[prop])
  }
}

