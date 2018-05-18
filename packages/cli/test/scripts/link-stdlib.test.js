'use strict'
require('../setup')

import { FileSystem as fs } from 'zos-lib';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

import init from "../../src/scripts/init.js";
import linkStdlib from "../../src/scripts/link-stdlib.js";

contract('link-stdlib command', function() {
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "test/tmp/zos.json";

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

  it('should refuse to set a stdlib for a lib project', async function () {
    fs.editJson(packageFileName, p => { p.lib = true; });
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib@1.1.0', packageFileName }).should.be.rejectedWith(/lib/);
  });

  it('should raise an error if requested version of stdlib does not match its package version', async function () {
    await linkStdlib({ stdlibNameVersion: 'mock-stdlib-invalid@1.0.0', packageFileName })
      .should.be.rejectedWith('Requested stdlib version 1.0.0 does not match stdlib package version 2.0.0')
  });
});
