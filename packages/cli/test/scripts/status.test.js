import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import sync from "../../src/scripts/sync.js";
import newVersion from "../../src/scripts/new-version.js";
import createProxy from "../../src/scripts/create-proxy.js";
import status from "../../src/scripts/status.js";
import setStdlib from "../../src/scripts/set-stdlib";
import { FileSystem as fs } from "zos-lib";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import TestLogger from '../helpers/logger.js';

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('status command', function([_, owner]) {

  const from = owner;
  const txParams = { from };
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const anotherContractName = "AnotherImplV1";
  const anotherContractAlias = "AnotherImpl";
  const version = "0.1.0";
  const network = "test";
  const stdlibNameVersion = 'mock-stdlib@0.1.0';
  const packageFileName = "test/tmp/package.zos.json";
  const networkFileName = `test/tmp/package.zos.${network}.json`;
  
  const logger = new TestLogger();

  beforeEach('cleanup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)
    logger.reset();
  });

  after(cleanupfn(packageFileName));
  after(cleanupfn(networkFileName));

  describe('app', function () {
    it('should log undeployed app', async function () {
      await init({ name: appName, version, packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/not yet deployed/);
    });

    it('should log plain app info', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/deployed at 0x[0-9a-fA-F]{40}/i);
      logger.text.should.match(/factory is at 0x[0-9a-fA-F]{40}/i);
      logger.text.should.match(/package is at 0x[0-9a-fA-F]{40}/i);
      logger.text.should.match(/version 0.1.0 matches/i);
      logger.text.should.match(/no contracts registered/i);
      logger.text.should.match(/no stdlib specified for current version/i);
    });

    it('should log version out of sync', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await newVersion({ version: '0.2.0', packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/version 0.1.0 is out of date/i);
      logger.text.should.match(/latest is 0.2.0/i);
    });
  });

  describe('contracts', function () {
    it('should log contract name when different to alias', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/Impl/i);
      logger.text.should.match(/implemented by ImplV1/i);
    });  

    it('should not log contract name when matches alias', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await addImplementation({ contractName: anotherContractName, packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/AnotherImplV1/i);
      logger.text.should.not.match(/implemented by/i);
    });  

    it('should log undeployed contract', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/contracts:(.+)not deployed/si);
    });

    it('should log out-of-sync contract', async function () {
      await init({ name: appName, version, packageFileName });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await sync({ packageFileName, network, txParams });
      await addImplementation({ contractName: anotherContractName, contractAlias, packageFileName });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/contracts:(.+)out of date/si);
    });

    it('should log deployed contract', async function () {
      await init({ name: appName, version, packageFileName });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await sync({ packageFileName, network, txParams });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/contracts:(.+)is deployed and up to date/si);
    });    
  });

  describe('stdlib', function () {
    it('should log missing stdlib', async function () {
      await init({ name: appName, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await setStdlib({ packageFileName, stdlibNameVersion, installDeps: false });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/standard library:(.+)mock-stdlib@0.1.0 required/si);
      logger.text.should.match(/standard library:(.+)no stdlib is deployed/si);
    });

    it('should log connected stdlib', async function () {
      await init({ name: appName, stdlibNameVersion, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/standard library:(.+)mock-stdlib@0.1.0 required/si);
      logger.text.should.match(/standard library:(.+)correctly connected to stdlib/si);
    });

    it('should log different stdlib connected', async function () {
      await init({ name: appName, stdlibNameVersion, version, packageFileName });
      await sync({ packageFileName, network, txParams });
      await setStdlib({ packageFileName, stdlibNameVersion: 'mock-stdlib-2@0.2.0', installDeps: false });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/standard library:(.+)mock-stdlib-2@0.2.0 required/si);
      logger.text.should.match(/standard library:(.+)connected to different stdlib mock-stdlib@0.1.0/si);
    });

    it('should log deployed stdlib', async function () {
      await init({ name: appName, stdlibNameVersion, version, packageFileName });
      await sync({ packageFileName, network, txParams, deployStdlib: true });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/standard library:(.+)mock-stdlib@0.1.0 required/si);
      logger.text.should.match(/standard library:(.+)custom deploy of stdlib set at 0x[0-9a-fA-F]{40}/si);
    });

    it('should log different stdlib connected', async function () {
      await init({ name: appName, stdlibNameVersion, version, packageFileName });
      await sync({ packageFileName, network, txParams, deployStdlib: true });
      await setStdlib({ packageFileName, stdlibNameVersion: 'mock-stdlib-2@0.2.0', installDeps: false });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/standard library:(.+)mock-stdlib-2@0.2.0 required/si);
      logger.text.should.match(/standard library:(.+)custom deploy of different stdlib mock-stdlib@0.1.0 at 0x[0-9a-fA-F]{40}/si);
    });
  });

  describe('proxies', function () {
    it('should log no proxies', async function () {
      await init({ name: appName, version, packageFileName });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await sync({ packageFileName, network, txParams });
      await status({ network, packageFileName, networkFileName, logger });

      logger.text.should.match(/deployed proxies:(.+)no proxies/si);
    });

    it('should log created proxies', async function () {
      await init({ name: appName, version, packageFileName });
      await addImplementation({ contractName, contractAlias, packageFileName });
      await sync({ packageFileName, network, txParams });
      await createProxy({ contractAlias, network, txParams, packageFileName, networkFileName });
      await status({ network, packageFileName, networkFileName, logger });
      
      logger.text.should.match(/deployed proxies:(.+)Impl at 0x[0-9a-fA-F]{40} version 0.1.0/si);
    });
  });
});
