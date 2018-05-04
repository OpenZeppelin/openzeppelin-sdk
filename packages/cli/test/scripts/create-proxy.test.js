import init from "../../src/scripts/init.js";
import sync from "../../src/scripts/sync.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import { FileSystem as fs } from "zos-lib";
import createProxy from "../../src/scripts/create-proxy.js";
import addImplementation from "../../src/scripts/add-implementation.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('create-proxy command', function([_, owner]) {

  const from = owner;
  const txParams = { from };
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
  const network = "test";
  const packageFileName = "test/tmp/package.zos.json";
  const networkFileName = `test/tmp/package.zos.${network}.json`;

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)
    await init({ name: appName, version: defaultVersion, packageFileName });
    await addImplementation({ contractName, contractAlias, packageFileName });
    await sync({ packageFileName, network, txParams });
  });

  after(cleanupfn(packageFileName))
  after(cleanupfn(networkFileName))

  it('should create a proxy for one of its contracts', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    const proxy0 = data.proxies[contractAlias][0];
    proxy0.address.should.be.not.null;
    proxy0.version.should.be.eq(defaultVersion);
  });

  it('should be able to have multiple proxies for one of its contracts', async function() {
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    assert.equal(3, data.proxies[contractAlias].length);
  });

  it('should be able to handle proxies for more than one contract', async function() {
    const customAlias = 'SomeOtherAlias';
    await addImplementation({ contractName: 'ImplV2', contractAlias: customAlias, packageFileName });
    await sync({ packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await createProxy({ contractAlias: customAlias, packageFileName, network, txParams });
    const data = fs.parseJson(networkFileName);
    const proxy0 = data.proxies[contractAlias][0];
    const proxy1 = data.proxies[customAlias][0];
    proxy0.address.should.be.not.null;
    proxy0.version.should.be.eq(defaultVersion);
    proxy1.address.should.be.not.null;
    proxy1.version.should.be.eq(defaultVersion);
  });
});
