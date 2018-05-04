import init from "../../src/scripts/init.js";
import setStdlib from "../../src/scripts/set-stdlib.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import { FileSystem as fs } from 'zos-lib';

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('set-stdlib command', function() {
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "test/tmp/package.zos.json";

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    await init({ name: appName, version: defaultVersion, packageFileName, stdlib: 'mock-stdlib@1.0.0' });
  });

  after('cleanup', cleanupfn(packageFileName));

  it('should set stdlib', async function () {
    await setStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName });
    const data = fs.parseJson(packageFileName);
    data.stdlib.name.should.eq('mock-stdlib');
    data.stdlib.version.should.eq('1.1.0');
  });
});
