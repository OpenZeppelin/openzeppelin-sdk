'use strict'
require('../setup')

import init from "../../src/scripts/init.js";
import linkStdlib from "../../src/scripts/link-stdlib.js";
import { cleanup, cleanupfn } from "../helpers/cleanup.js";
import { FileSystem as fs } from 'zos-lib';

contract('link-stdlib command', function() {
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "test/tmp/package.zos.json";

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    await init({ name: appName, version: defaultVersion, packageFileName, stdlib: 'mock-stdlib@1.0.0' });
  });

  after('cleanup', cleanupfn(packageFileName));

  it('should set stdlib', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName });
    const data = fs.parseJson(packageFileName);
    data.stdlib.name.should.eq('mock-stdlib');
    data.stdlib.version.should.eq('1.1.0');
  });
});
