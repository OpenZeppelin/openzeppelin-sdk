export class DeployError extends Error {
  constructor(error, props) {
    super(error.message)
    this.stack = error.stack
    this.name = 'DeployError'
    Object.keys(props).forEach(prop => this[prop] = props[prop])
  }
}
