export class DeployError extends Error {
  public constructor(error: Error, props: any) {
    super(error.message);
    this.stack = error.stack;
    this.name = 'DeployError';
    Object.keys(props).forEach((prop: string) => (this[prop] = props[prop]));
  }
}
