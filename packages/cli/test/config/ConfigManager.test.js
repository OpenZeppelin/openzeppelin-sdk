'use strict'
require('../setup')

import { FileSystem } from 'zos-lib'
import ConfigManager from '../../src/models/config/ConfigManager'

// TODO: complete
describe.skip('ConfigManager', function() {
  const expectToBehaveLikeConfig = (configFile) => {
    describe('getNetworkNamesFromConfig', function() {
      const configFileBackup = `${configFile}.backup`;
      before('backup config file', function() {
        FileSystem.copy(configFile, configFileBackup);
      })

      after('restore config file', function() {
        FileSystem.copy(configFileBackup, configFile);
        FileSystem.remove(configFileBackup);
      });

      it('finds a network in truffle network list', function() {
        FileSystem.write(configFile, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }');
        const networkNames = this.truffleConfig.getNetworkNamesFromConfig();
        networkNames.should.be.an('array');
        networkNames[0].should.eq('test');
        networkNames.should.have.lengthOf(1);
      });
    });
  };

  context.only('when networks.js present', function() {
    const configFile = `${process.cwd()}/networks.js`;
    beforeEach('set config file', function() {
      configFileBackup = `${configFile}.backup`;
    });

    expectToBehaveLikeConfig();
  });

  context.skip('when truffle.js file present', function() {
    beforeEach('set config file', function() {
      configFile = `${process.cwd()}/networks.js`;
      configFileBackup = `${configFile}.backup`;
    });
  });
});


