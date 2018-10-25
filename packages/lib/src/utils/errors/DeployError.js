'use strict'

export class DeployError extends Error {
  constructor(message, props) {
    super(message)
    Object.keys(props).forEach(prop => this[prop] = props[prop])
  }
}

