export default class ScriptError extends Error {

  public stack: any;
  public cb: () => void;

  constructor({ message, stack }: { message: string, stack: any }, cb: () => void) {
    super(message);
    this.stack = stack;
    this.cb = cb;
  }
}
