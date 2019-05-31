import { Logger } from 'zos-lib';

export default class StatusReport {
  public expected: string;
  public observed: string;
  public description: string;

  public constructor(expected: string, observed: string, description: string) {
    this.expected = expected;
    this.observed = observed;
    this.description = description;
  }

  public log(logger: Logger): void {
    logger.error(this.description);
    logger.error(` - local: ${this.expected}`);
    logger.warn(` - on-chain:   ${this.observed}\n`);
  }
}
