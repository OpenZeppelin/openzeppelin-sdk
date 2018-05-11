import _ from 'lodash';

export default class Logger {
  constructor() {
    this.reset();
  }

  info(msg) {
    this.infos.push(msg);
  }

  error(msg) {
    this.errors.push(msg);
  }
  
  reset() {
    this.infos = [];
    this.errors = [];
  }

  match(re) {
    return _(_.concat(this.infos, this.errors)).map((msg) => msg.match(re)).compact().head();
  }

  get text() {
    return this.toString();
  }

  toString() {
    return _.concat(this.infos, this.errors).join("\n");
  }
}
