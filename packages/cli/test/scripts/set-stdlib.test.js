import init from "../../src/scripts/init.js";
import setStdlib from "../../src/scripts/set-stdlib.js";
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('set-stdlib command', function() {
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "package.test.zos.json";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    await init({ name: appName, version: defaultVersion, packageFileName, stdlib: 'mock-stdlib@1.0.0' });
  });

  after('cleanup', cleanupfn(packageFileName));

  it('should set stdlib', async function () {
    await setStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName });
    const data = files.read();
    data.stdlib.name.should.eq('mock-stdlib');
    data.stdlib.version.should.eq('1.1.0');
  });
});
