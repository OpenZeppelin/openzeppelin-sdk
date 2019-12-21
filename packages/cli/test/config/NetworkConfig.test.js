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

  describe('methods', function() {
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
      context('when the networks.js file does not exist', function() {
        it('returns false', function() {
          NetworkConfig.exists(tmpDir).should.eq(false);
        });
      });

      context('when the networks.js file exists', function() {
        it('returns true', function() {
          NetworkConfig.initialize(tmpDir);
          NetworkConfig.exists(tmpDir).should.eq(true);
        });
      });
    });

    describe('#getConfig', function() {
      it('setups the config', function() {
        NetworkConfig.initialize(tmpDir);
        const config = NetworkConfig.getConfig(networkConfigDir);

        config.should.have.all.keys('networks', 'compilers', 'buildDir');
        config.should.not.have.key('network');
        config.buildDir.should.eq(path.resolve(process.cwd(), tmpDir, 'build/contracts'));
      });
    });

    describe('#loadNetworkConfig', function() {
      context('when provided network does not exist', function() {
        it('throws an error', function() {
          NetworkConfig.initialize(tmpDir);
          (() => NetworkConfig.loadNetworkConfig('non-existent', networkConfigDir)).should.throw(
            /is not defined in your networks.js file/,
          );
        });
      });

      context('when the network exists', function() {
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

        context('when specifying a diferent provider', function() {
          afterEach('stubs config', function() {
            sinon.restore();
          });

          context('when specifying a function as provider', function() {
            it('calls the function', function() {
              const provider = () => 'returned provider';
              sinon.stub(NetworkConfig, 'getConfig').returns({
                networks: {
                  local: { provider, host: 'localhost', port: '1324' },
                },
              });
              NetworkConfig.initialize(tmpDir);
              const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
              networkConfig.provider.should.eq('returned provider');
            });
          });

          context('when specifying a different protocol', function() {
            it('setups a different provider', function() {
              sinon.stub(NetworkConfig, 'getConfig').returns({
                networks: {
                  local: { protocol: 'wss', host: 'localhost', port: '1324' },
                },
              });
              NetworkConfig.initialize(tmpDir);
              const networkConfig = NetworkConfig.loadNetworkConfig('local', networkConfigDir);
              networkConfig.provider.should.eq('wss://localhost:1324');
            });
          });
        });
      });
    });
  });
});
