'use strict';
require('../setup');

import fs from 'fs';
import sinon from 'sinon';
import { Contracts, ZWeb3 } from '@openzeppelin/upgrades';

import ConfigManager from '../../src/models/config/ConfigManager';

const expectToBehaveLikeConfig = configFileDir => {
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
      context('when no network is specified', function() {
        it('throws', function() {
          ConfigManager.initNetworkConfiguration({}, true, configFileDir).should.be.rejectedWith(
            /network name must be provided/,
          );
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
      });
    });

    describe('#getBuildDir', function() {
      it('returns the buildDir path', function() {
        ConfigManager.getBuildDir(configFileDir).should.eq(`${process.cwd()}/build/contracts`);
      });
    });
  });
};

describe('ConfigManager', function() {
  const configFileDir = `${process.cwd()}/test/mocks/config-files`;
  beforeEach('clean config manager and set stubs', function() {
    // restore config after each test
    this.originalConfig = ConfigManager.config;
    ConfigManager.config = null;
    this.initialize = sinon.stub(ZWeb3, 'initialize');
  });

  afterEach(function() {
    ConfigManager.config = this.originalConfig;
    sinon.restore();
  });

  context('when networks.js present', function() {
    const configFileName = 'truffle.js';
    const configFile = `${configFileDir}/${configFileName}`;
    const configFileBackup = `${configFile}.backup`;

    before('backup config file', function() {
      fs.copyFileSync(configFile, configFileBackup);
      fs.unlinkSync(configFile);
    });

    after('restore config file', function() {
      fs.copyFileSync(configFileBackup, configFile);
      fs.unlinkSync(configFileBackup);
    });

    expectToBehaveLikeConfig(configFileDir);

    it('throws if provided network id is not correct', async function() {
      await ConfigManager.initNetworkConfiguration({ network: 'invalid' }, true, configFileDir).should.be.rejectedWith(
        /Unexpected network ID: requested -39/,
      );
    });

    it('calls the correct config loader', async function() {
      await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
      this.initialize.should.have.been.calledWith('http://localhost:8545');
    });

    describe('#setBaseConfig', function() {
      it('sets the correct config', function() {
        ConfigManager.setBaseConfig(configFileDir);
        ConfigManager.config.should.have.property('createNetworkConfigFile');
      });
    });
  });

  context('when truffle.js file present', function() {
    const configFileName = 'networks.js';
    const configFile = `${configFileDir}/${configFileName}`;
    const configFileBackup = `${configFile}.backup`;

    before('backup config file', function() {
      fs.copyFileSync(configFile, configFileBackup);
      fs.unlinkSync(configFile);
    });

    after('restore config file', function() {
      fs.copyFileSync(configFileBackup, configFile);
      fs.unlinkSync(configFileBackup);
    });

    expectToBehaveLikeConfig(configFileDir);

    it('calls the correct config loader', async function() {
      await ConfigManager.initNetworkConfiguration({ network: 'local' }, true, configFileDir);
      this.initialize.getCall(0).args[0].constructor.name.should.eq('HttpProvider');
    });

    describe('#setBaseConfig', function() {
      it('sets the correct config', function() {
        ConfigManager.setBaseConfig(configFileDir);
        ConfigManager.config.should.have.property('isTruffleProject');
      });
    });
  });

  context('when no config file present', function() {
    it('throws an error', function() {
      (() => ConfigManager.setBaseConfig('foo/bar/buz')).should.throw(
        'Could not find networks.js file, please remember to initialize your project.',
      );
    });
  });
});
