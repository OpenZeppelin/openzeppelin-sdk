import init from "../../src/scripts/init.js";
import sync from "../../src/scripts/sync.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import createProxy from "../../src/scripts/create-proxy.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('create-proxy command', function([_, owner]) {

  const from = owner;
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
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
  });

  after(cleanupfn(packageFileName))
  after(cleanupfn(networkPackageFileName))

  it('should create a proxy for one of its contracts', async function() {
    await createProxy(contractAlias, {packageFileName, network, from});
    const data = files.readNetworkFile(network);
    const proxy0 = data.proxies[contractAlias][0];
    proxy0.address.should.be.not.null;
    proxy0.version.should.be.eq(defaultVersion);
  });

  it('should be able to have multiple proxies for one of its contracts', async function() {
    await createProxy(contractAlias, {packageFileName, network, from});
    await createProxy(contractAlias, {packageFileName, network, from});
    await createProxy(contractAlias, {packageFileName, network, from});
    const data = files.readNetworkFile(network);
    assert.equal(3, data.proxies[contractAlias].length);
  });

  it('should be able to handle proxies for more than one contract', async function() {
    const customAlias = 'SomeOtherAlias';
    await addImplementation('ImplV2', customAlias, {packageFileName});
    await sync({ packageFileName, network, from });
    await createProxy(contractAlias, {packageFileName, network, from});
    await createProxy(customAlias, {packageFileName, network, from});
    const data = files.readNetworkFile(network);
    const proxy0 = data.proxies[contractAlias][0];
    const proxy1 = data.proxies[customAlias][0];
    proxy0.address.should.be.not.null;
    proxy0.version.should.be.eq(defaultVersion);
    proxy1.address.should.be.not.null;
    proxy1.version.should.be.eq(defaultVersion);
  });
});
