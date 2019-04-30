import ora, { Ora } from 'ora';

export default class Spinner {
  private impl: Ora;

  public constructor(message: string) {
    this.impl = ora(message);
  }

  public start() {
    this.impl.start();
  }

  public succeed() {
    this.impl.succeed();
  }

  public fail() {
    this.impl.fail();
  }
}
