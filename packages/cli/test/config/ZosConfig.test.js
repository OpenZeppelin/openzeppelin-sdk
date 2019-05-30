'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib'
import { cleanupfn } from '../helpers/cleanup'
import ZosConfig from '../../src/models/config/ZosConfig'

contract('ZosConfig', function() {
  const tmpDir = 'test/tmp';
  const contractsDir = `${tmpDir}/contracts`;
  const zosConfigFile  = `${tmpDir}/networks.js`;
  const zosConfigPath = `${process.cwd()}/${zosConfigFile}`;

  beforeEach('create tmp dir', function() {
    fs.createDir(tmpDir);
    this.zosConfig = new ZosConfig();
  });

  afterEach('cleanup files & folders', cleanupfn(tmpDir));

  describe('methods', function() {
    describe('#initialize', function() {
      it('creates an empty contracts folder if missing', async function() {
        this.zosConfig.initialize(tmpDir);

        fs.exists(contractsDir).should.be.true;
        fs.readDir(contractsDir).should.have.lengthOf(1);
        fs.readDir(contractsDir).should.include('.gitkeep');
      });

      it('does not create an empty contracts folder if present', async function() {
        fs.createDir(contractsDir);
        fs.write(`${contractsDir}/Sample.sol`);
        this.zosConfig.initialize(tmpDir);

        fs.exists(contractsDir).should.be.true;
        fs.readDir(contractsDir).should.have.lengthOf(1);
        fs.readDir(contractsDir).should.include('Sample.sol');
      });

      it('creates a networks.js file if missing', async function() {
        this.zosConfig.initialize(tmpDir);

        fs.exists(zosConfigPath).should.be.true;
      });

      it('does not create a networks.js file if present', async function() {
        fs.write(zosConfigFile , '');
        this.zosConfig.initialize(tmpDir);

        fs.read(zosConfigPath).should.have.lengthOf(0);
      });
    });
  });
});

