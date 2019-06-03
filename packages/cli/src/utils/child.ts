import util from 'util';
import child from 'child_process';

const exec = util.promisify(child.exec);

export default {
  exec,
  execSync: child.execSync,
};
