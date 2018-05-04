import init from "../../src/scripts/init.js";
import newVersion from "../../src/scripts/new-version.js";
import { FileSystem as fs } from 'zos-lib';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('new-version command', function() {
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "test/tmp/package.zos.json";

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    await init({ name: appName, version: defaultVersion, packageFileName });
  });

  after('cleanup', cleanupfn(packageFileName));

  it('it should update the app version in the main package file', async function() {
    const version = '0.2.0';
    await newVersion({ version, packageFileName });
    fs.parseJson(packageFileName).version.should.eq(version);
  });

  it('should set stdlib', async function () {
    const version = '0.2.0';
    await newVersion({ version, packageFileName, stdlibNameVersion: 'mock-stdlib@1.1.0' });
    const data = fs.parseJson(packageFileName);
    data.stdlib.name.should.eq('mock-stdlib');
    data.stdlib.version.should.eq('1.1.0');
  });
});
