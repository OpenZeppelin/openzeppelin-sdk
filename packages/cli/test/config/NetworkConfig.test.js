'use strict';
require('../setup');

import fs from 'fs';
import sinon from 'sinon';
import path from 'path';

import { cleanupfn } from '../helpers/cleanup';
import NetworkConfig from '../../src/models/config/NetworkConfig';

describe('NetworkConfig', function() {
  const tmpDir = 'test/tmp';
  const contractsDir = `${tmpDir}/contracts`;
  const networkConfigFile = `${tmpDir}/networks.js`;
  const networkConfigDir = `${process.cwd()}/${tmpDir}`;
  const networkConfigPath = `${process.cwd()}/${networkConfigFile}`;

  beforeEach('create tmp dir', function() {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach('cleanup files and folders', cleanupfn(tmpDir));

  describe('#initialize', function() {
    it('creates an empty contracts folder if missing', function() {
      NetworkConfig.initialize(tmpDir);

      fs.existsSync(contractsDir).should.be.true;
      fs.readdirSync(contractsDir, 'utf8').should.have.lengthOf(1);
      fs.readdirSync(contractsDir, 'utf8').should.include('.gitkeep');
    });

    it('does not create an empty contracts folder if present', function() {
      fs.mkdirSync(contractsDir, { recursive: true });
      fs.writeFileSync(`${contractsDir}/Sample.sol`, '');
      NetworkConfig.initialize(tmpDir);

      fs.existsSync(contractsDir).should.be.true;
      fs.readdirSync(contractsDir, 'utf8').should.have.lengthOf(1);
      fs.readdirSync(contractsDir, 'utf8').should.include('Sample.sol');
    });

    it('creates a networks.js file if missing', function() {
      NetworkConfig.initialize(tmpDir);

      fs.existsSync(networkConfigPath).should.be.true;
    });

    it('does not create a networks.js file if present', function() {
      fs.writeFileSync(networkConfigFile, '');
      NetworkConfig.initialize(tmpDir);

      fs.readFileSync(networkConfigPath, 'utf8').should.have.lengthOf(0);
    });
  });

  describe('#exists', function() {
    it('returns false when the networks.js file does not exist', function() {
      NetworkConfig.exists(tmpDir).should.eq(false);
    });

    it('returns true when the networks.js file exists', function() {
      NetworkConfig.initialize(tmpDir);
      NetworkConfig.exists(tmpDir).should.eq(true);
    });
  });

  describe('#getConfig', function() {
    it('setups the config', function() {
      NetworkConfig.initialize(tmpDir);
      const config = NetworkConfig.getConfig(networkConfigDir);

      config.should.have.all.keys('networks', 'buildDir');
      config.should.not.have.key('network');
      config.buildDir.should.eq(path.resolve(process.cwd(), tmpDir, 'build/contracts'));
    });
  });

  describe('#loadNetworkConfig', function() {
    afterEach('stubs config', function() {
      sinon.restore();
    });

    it('throws an error when provided network does not exist', function() {
      NetworkConfig.initialize(tmpDir);
      (() => NetworkConfig.loadNetworkConfig('non-existent', networkConfigDir)).should.throw(
        /is not defined in your networks.js file/,
      );
    });

    it('setups the current selected network config', function() {
      NetworkConfig.initialize(tmpDir);
      const config = NetworkConfig.getConfig(networkConfigDir);
      const networkConfig = NetworkConfig.loadNetworkConfig('development', networkConfigDir);

      networkConfig.provider.should.eq('http://localhost:8545');
      networkConfig.artifactDefaults.should.include({
        gas: 5000000,
        gasPrice: 5000000000,
      });
      networkConfig.should.deep.include(config);
    });

    it('setups a provider from a function', function() {
      const provider = () => 'returned provider';
      sinon.stub(NetworkConfig, 'getConfig').returns({
        networks: { local: { provider, host: 'localhost', port: '1324' } },
      });
      NetworkConfig.initialize(tmpDir);
      const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
      networkConfig.provider.should.eq('returned provider');
    });

    it('setups a provider from URL parts', function() {
      sinon.stub(NetworkConfig, 'getConfig').returns({
        networks: { local: { protocol: 'wss', host: 'localhost', port: '1324', path: 'foo' } },
      });
      NetworkConfig.initialize(tmpDir);
      const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
      networkConfig.provider.should.eq('wss://localhost:1324/foo');
    });

    it('setups a provider from just URL host', function() {
      sinon.stub(NetworkConfig, 'getConfig').returns({
        networks: { local: { host: 'localhost' } },
      });
      NetworkConfig.initialize(tmpDir);
      const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
      networkConfig.provider.should.eq('http://localhost');
    });

    it('setups a provider from plain URL', function() {
      sinon.stub(NetworkConfig, 'getConfig').returns({
        networks: { local: { url: 'wss://localhost:1324/foo' } },
      });
      NetworkConfig.initialize(tmpDir);
      const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
      networkConfig.provider.should.eq('wss://localhost:1324/foo');
    });
  });
});
