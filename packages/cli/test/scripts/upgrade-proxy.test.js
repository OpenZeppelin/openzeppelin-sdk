import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import sync from "../../src/scripts/sync.js";
import newVersion from "../../src/scripts/new-version.js";
import createProxy from "../../src/scripts/create-proxy.js";
import upgradeProxy from "../../src/scripts/upgrade-proxy.js";
import fs from 'fs';
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('upgrade-proxy command', function([_, owner]) {

  const from = owner;
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
  const version = "0.2.0";
  const packageFileName = "package.test.zos.json";
  const network = "test";
  const networkPackageFileName = `package.zos.${network}.json`;
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    cleanup(networkPackageFileName)

    await init(appName, defaultVersion, {packageFileName});
    await addImplementation(contractName, contractAlias, {packageFileName});
    await sync({ packageFileName, network, from });
    await createProxy(contractAlias, {packageFileName, network, from});
    // await newVersion(version, {packageFileName, from});
  });

  after(cleanupfn(packageFileName));
  after(cleanupfn(networkPackageFileName));

  it('should upgrade the version of a proxy', async function() {
    let data = files.readNetworkFile(network);
    let proxy = data.proxies[contractAlias][0];
    await upgradeProxy(proxy.address, contractAlias, {network, packageFileName, from});
    data = files.readNetworkFile(network);
    proxy = data.proxies[contractAlias][0];
    proxy.version.should.eq(version);
  });
});
