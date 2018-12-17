import path from 'path';
import Truffle from './Truffle';
import { FileSystem as fs } from 'zos-lib';

const TruffleProjectInitializer = {

  call(root: string = process.cwd()): void {
    this._initContractsDir(root);
    this._initMigrationsDir(root);
    this._initTruffleConfig(root);
  },

  _initContractsDir(root: string): void {
    const contractsDir = `${root}/contracts`;
    this._initDir(contractsDir);
  },

  _initMigrationsDir(root: string): void {
    const migrationsDir = `${root}/migrations`;
    this._initDir(migrationsDir);
  },

  _initTruffleConfig(root: string): void {
    if (!Truffle.existsTruffleConfig(root)) {
      const blueprint = path.resolve(__dirname, './blueprint.truffle.js');
      fs.copy(blueprint, `${root}/truffle-config.js`);
    }
  },

  _initDir(dir: string): void {
    if (!fs.exists(dir)) {
      fs.createDir(dir);
      fs.write(`${dir}/.gitkeep`, '');
    }
  },
};

export default TruffleProjectInitializer;
