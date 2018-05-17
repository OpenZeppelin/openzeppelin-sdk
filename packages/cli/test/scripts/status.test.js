
'use strict'
require('../setup')

import initApp from "../../src/scripts/init.js";
import initLib from "../../src/scripts/init-lib.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import push from "../../src/scripts/push.js";
import bumpVersion from "../../src/scripts/bump-version.js";
import createProxy from "../../src/scripts/create-proxy.js";
import status from "../../src/scripts/status.js";
import linkStdlib from "../../src/scripts/link-stdlib";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import TestLogger from '../helpers/logger.js';

contract('status command', function([_, owner]) {
  const txParams = { from: owner };
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const contractsData = [{ name: contractName, alias: contractAlias }]
  const anotherContractName = "AnotherImplV1";
  const version = "0.1.0";
  const network = "test";
  const stdlibNameVersion = 'mock-stdlib@0.1.0';
  const packageFileName = "test/tmp/zos.json";
  const networkFileName = `test/tmp/zos.${network}.json`;
  
  const logger = new TestLogger();

  beforeEach('cleanup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)
    logger.reset();
  });

  after(cleanupfn(packageFileName));
  after(cleanupfn(networkFileName));

  const shouldDescribeApp = function (init) {
    describe('root app', function () {
      it('should log undeployed app', async function () {
        await init({ name: appName, version, packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/not yet deployed/);
      });

      it('should log plain app info', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/deployed at 0x[0-9a-fA-F]{40}/i);
        logger.text.should.match(/factory is at 0x[0-9a-fA-F]{40}/i);
        logger.text.should.match(/package is at 0x[0-9a-fA-F]{40}/i);
        logger.text.should.match(/version 0.1.0 matches/i);
        logger.text.should.match(/no contracts registered/i);
        logger.text.should.match(/no stdlib specified for current version/i);
      });
    });
  };

  const shouldDescribeLib = function (init) {
    describe('root lib', function () {
      it('should log undeployed lib', async function () {
        await init({ name: appName, version, packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/not yet deployed/);
      });

      it('should log plain lib info', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/library package is deployed at 0x[0-9a-fA-F]{40}/i);
      });
    });
  };

  const shouldDescribeVersion = function (init) {
    describe('version', function () {
      it('should log version out-of-sync', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await bumpVersion({ version: '0.2.0', packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/version 0.1.0 is out of date/i);
        logger.text.should.match(/latest is 0.2.0/i);
      });
    });
  };

  const shouldDescribeContracts = function (init) {
    describe('contracts', function () {
      it('should log contract name when different to alias', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await addImplementation({ contractsData, packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/Impl/i);
        logger.text.should.match(/implemented by ImplV1/i);
      });  

      it('should not log contract name when matches alias', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await addImplementation({ contractsData: [{ name: anotherContractName }], packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/AnotherImplV1/i);
        logger.text.should.not.match(/implemented by/i);
      });  

      it('should log undeployed contract', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await addImplementation({ contractsData, packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/not deployed/i);
      });

      it('should log out-of-sync contract', async function () {
        await init({ name: appName, version, packageFileName });
        await addImplementation({ contractsData, packageFileName });
        await push({ packageFileName, network, txParams });
        await addImplementation({ contractsData: [{ name: anotherContractName, alias: contractAlias }], packageFileName });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/out of date/i);
      });

      it('should log deployed contract', async function () {
        await init({ name: appName, version, packageFileName });
        await addImplementation({ contractsData, packageFileName });
        await push({ packageFileName, network, txParams });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/is deployed and up to date/i);
      });    
    });
  };

  const shouldDescribeStdlib = function (init) {
    describe('stdlib', function () {
      it('should log missing stdlib', async function () {
        await init({ name: appName, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await linkStdlib({ packageFileName, stdlibNameVersion, installDeps: false });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/mock-stdlib@0.1.0 required/i);
        logger.text.should.match(/no stdlib is deployed/i);
      });

      it('should log connected stdlib', async function () {
        await init({ name: appName, stdlibNameVersion, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/mock-stdlib@0.1.0 required/i);
        logger.text.should.match(/correctly connected to stdlib/i);
      });

      it('should log different stdlib connected', async function () {
        await init({ name: appName, stdlibNameVersion, version, packageFileName });
        await push({ packageFileName, network, txParams });
        await linkStdlib({ packageFileName, stdlibNameVersion: 'mock-stdlib-2@0.2.0', installDeps: false });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/mock-stdlib-2@0.2.0 required/i);
        logger.text.should.match(/connected to different stdlib mock-stdlib@0.1.0/i);
      });

      it('should log deployed stdlib', async function () {
        await init({ name: appName, stdlibNameVersion, version, packageFileName });
        await push({ packageFileName, network, txParams, deployStdlib: true });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/mock-stdlib@0.1.0 required/i);
        logger.text.should.match(/custom deploy of stdlib set at 0x[0-9a-fA-F]{40}/i);
      });

      it('should log different stdlib connected', async function () {
        await init({ name: appName, stdlibNameVersion, version, packageFileName });
        await push({ packageFileName, network, txParams, deployStdlib: true });
        await linkStdlib({ packageFileName, stdlibNameVersion: 'mock-stdlib-2@0.2.0', installDeps: false });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/mock-stdlib-2@0.2.0 required/i);
        logger.text.should.match(/custom deploy of different stdlib mock-stdlib@0.1.0 at 0x[0-9a-fA-F]{40}/i);
      });
    });
  };

  const shouldDescribeProxies = function (init) {
    describe('proxies', function () {
      it('should log no proxies', async function () {
        await init({ name: appName, version, packageFileName });
        await addImplementation({ contractsData, packageFileName });
        await push({ packageFileName, network, txParams });
        await status({ network, packageFileName, networkFileName, logger });

        logger.text.should.match(/no proxies/i);
      });

      it('should log created proxies', async function () {
        await init({ name: appName, version, packageFileName });
        await addImplementation({ contractsData, packageFileName });
        await push({ packageFileName, network, txParams });
        await createProxy({ contractAlias, network, txParams, packageFileName, networkFileName });
        await status({ network, packageFileName, networkFileName, logger });
        
        logger.text.should.match(/Impl at 0x[0-9a-fA-F]{40} version 0.1.0/i);
      });
    });
  };

  describe('on app project', function () {
    shouldDescribeApp(initApp);
    shouldDescribeVersion(initApp);
    shouldDescribeContracts(initApp);
    shouldDescribeStdlib(initApp);
    shouldDescribeProxies(initApp);
  });

  describe('on lib project', function () {
    shouldDescribeLib(initLib);
    shouldDescribeVersion(initLib);
    shouldDescribeContracts(initLib);
  });
});
