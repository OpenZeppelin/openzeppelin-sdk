import init from "../../src/scripts/init.js";
import addImplementation from "../../src/scripts/add-implementation.js";
import sync from "../../src/scripts/sync.js";
import newVersion from "../../src/scripts/new-version.js";
import createProxy from "../../src/scripts/create-proxy.js";
import upgradeProxy from "../../src/scripts/upgrade-proxy.js";
import { FileSystem as fs } from "zos-lib";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('upgrade-proxy command', function([_, owner]) {

  const from = owner;
  const txParams = { from };
  const appName = "MyApp";
  const contractName = "ImplV1";
  const contractAlias = "Impl";
  const defaultVersion = "0.1.0";
  const version = "0.2.0";
  const network = "test";
  const packageFileName = "test/tmp/package.zos.json";
  const networkFileName = `test/tmp/package.zos.${network}.json`;

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    cleanup(networkFileName)

    await init({ name: appName, version: defaultVersion, packageFileName });
    await addImplementation({ contractName, contractAlias, packageFileName });
    await sync({ packageFileName, network, txParams });
    await createProxy({ contractAlias, packageFileName, network, txParams });
    await newVersion({ version, packageFileName, txParams });
    await addImplementation({ contractName, contractAlias, packageFileName });
    await sync({ packageFileName, network, txParams });
  });

  after(cleanupfn(packageFileName));
  after(cleanupfn(networkFileName));

  it('should upgrade the version of a proxy', async function() {
    await upgradeProxy({ contractAlias, proxyAddress: null, network, packageFileName, txParams });
    const data = fs.parseJson(networkFileName);
    const proxy = data.proxies[contractAlias][0];
    proxy.version.should.eq(version);
  });
});
