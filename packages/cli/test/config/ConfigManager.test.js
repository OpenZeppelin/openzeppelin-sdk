'use strict'
require('../setup')

import sinon from 'sinon';

import { FileSystem, Contracts, ZWeb3 } from 'zos-lib';
import ConfigManager from '../../src/models/config/ConfigManager';
import ZosConfig from '../../src/models/config/ZosConfig';
import Truffle from '../../src/models/config/Truffle';

describe('ConfigManager', function() {
  // configFileName is the one to backup so it's not read.
  const expectToBehaveLikeConfig = (configFileName) => {
    const configFileDir = `${process.cwd()}/test/mocks/config-files`;
    const configFile = `${configFileDir}/${configFileName}`;
    const configFileBackup = `${configFile}.backup`;

    before('backup config file', function() {
      FileSystem.copy(configFile, configFileBackup);
      FileSystem.remove(configFile);
    })

    after('restore config file', function() {
      FileSystem.copy(configFileBackup, configFile);
      FileSystem.remove(configFileBackup);
      // restore config after each test
      ConfigManager.config = null;
    });

    describe('functions', function() {
      describe('#initStaticConfiguration', function() {
        it('sets local buildDir', function() {
          sinon.spy(Contracts, 'setLocalBuildDir');
          ConfigManager.initStaticConfiguration(configFileDir);
          const callArgs = Contracts.setLocalBuildDir.getCall(0).args;

          callArgs.should.have.lengthOf(1);
          callArgs[0].should.eq(`${process.cwd()}/build/contracts`);

          sinon.restore();
        });
      });

      describe('#initNetworkConfiguration', function() {
        context('when no network is specified', function() {
          it('throws', function() {
            ConfigManager.initNetworkConfiguration({}, true, configFileDir)
              .should.be.rejectedWith(/network name must be provided/);
          });
        });

        context('when a valid network is specified', function() {
          afterEach('restores sinon', function() {
            sinon.restore();
          });

          it('sets local buildDir', function() {
            sinon.spy(Contracts, 'setLocalBuildDir');
            ConfigManager.initStaticConfiguration(configFileDir);
            const callArgs = Contracts.setLocalBuildDir.getCall(0).args;

            callArgs.should.have.lengthOf(1);
            callArgs[0].should.eq(`${process.cwd()}/build/contracts`);
          });

          it('calls the correct config loader', async function() {
            let zweb3Spy;
            if (configFileName === 'truffle.js') {
              zweb3Spy = sinon.spy(ZWeb3, 'initialize');
              await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
              zweb3Spy.args[0][0].should.eq('http://localhost:8545');
            } else if (configFileName === 'networks.js') {
              zweb3Spy = sinon.spy(ZWeb3, 'initialize');
              await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
              zweb3Spy.args[0][0].constructor.name.should.eq('HttpProvider');
            }
          });
        });
      });

      describe('#getBuildDir', function() {
        it('returns the buildDir path', function() {
          ConfigManager.getBuildDir(configFileDir).should.eq(`${process.cwd()}/build/contracts`);
        });
      });

      describe('#setBaseConfig', function() {
        it('sets the correct config', function() {
          const configClassName = configFileName === 'truffle.js' ? 'ZosConfig' : 'Truffle';
          ConfigManager.setBaseConfig(configFileDir);
          ConfigManager.config.constructor.name.should.eq(configClassName);
        })
      });
    });
  };

  context('when networks.js present', function() {
    expectToBehaveLikeConfig('truffle.js');
  });

  context('when truffle.js file present', function() {
    expectToBehaveLikeConfig('networks.js');
  });

  context('when no config file present', function() {
    it('throws an error', function() {
      (() => ConfigManager.setBaseConfig('foo/bar/buz'))
        .should.throw('Could not find networks.js file, please remember to initialize your project.');
    });
  });
});


