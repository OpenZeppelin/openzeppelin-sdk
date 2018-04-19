import init from "../../src/scripts/init.js";
import newVersion from "../../src/scripts/new-version.js";
import fs from 'fs';
import PackageFilesInterface from '../../src/utils/PackageFilesInterface';
import { cleanup, cleanupfn } from "../helpers/cleanup.js";

const should = require('chai')
      .use(require('chai-as-promised'))
      .should();

contract('new-version command', function([_, owner]) {

  const from = owner;
  const appName = "MyApp";
  const defaultVersion = "0.1.0";
  const packageFileName = "package.test.zos.json";
  const files = new PackageFilesInterface(packageFileName);

  beforeEach('setup', async function() {
    cleanup(packageFileName)
    await init(appName, defaultVersion, {packageFileName});
  });

  after('cleanup', cleanupfn(packageFileName));

  it('it should update the app version in the main package file', async function() {
    const version = '0.2.0';
    await newVersion(version, {packageFileName});
    const data = files.read();
    data.version.should.eq(version);
  });
});
