export default class StatusReport {
  constructor(expected, observed, description) {
    this.expected = expected
    this.observed = observed
    this.description = description
  }

  log(logger) {
    logger.error(this.description)
    // TODO: add warning logging level
    logger.error(` - expected: ${this.expected}`)
    logger.log(` - actual:   ${this.observed}\n`, 'yellow')
  }
}
