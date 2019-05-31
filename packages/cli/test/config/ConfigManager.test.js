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
    });

    beforeEach(function() {
      // restore config after each test
      this.originalConfig = ConfigManager.config;
      ConfigManager.config = null;
    });

    afterEach('restores sinon', function() {
      ConfigManager.config = this.originalConfig;
      sinon.restore();
    });

    describe('functions', function() {
      describe('#initStaticConfiguration', function() {
        it('sets local buildDir', function() {
          sinon.spy(Contracts, 'setLocalBuildDir');
          ConfigManager.initStaticConfiguration(configFileDir);
          const callArgs = Contracts.setLocalBuildDir.getCall(0).args;

          callArgs.should.have.lengthOf(1);
          callArgs[0].should.eq(`${process.cwd()}/build/contracts`);
        });
      });

      describe('#initNetworkConfiguration', function() {
        beforeEach(function() {
          this.initialize = sinon.stub(ZWeb3, 'initialize');
        });

        context('when no network is specified', function() {
          it('throws', function() {
            ConfigManager.initNetworkConfiguration({}, true, configFileDir)
              .should.be.rejectedWith(/network name must be provided/);
          });
        });

        context('when a valid network is specified', function() {
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
              await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
              this.initialize.should.have.been.calledWith('http://localhost:8545');
            } else if (configFileName === 'networks.js') {
              await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
              this.initialize.getCall(0).args[0].constructor.name.should.eq('HttpProvider');
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


