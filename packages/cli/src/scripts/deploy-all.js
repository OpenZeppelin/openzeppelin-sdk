import AppManager from '../models/AppManager'
import makeContract from '../utils/contract'
import PackageFilesInterface from '../utils/PackageFilesInterface'
import sync from './sync'
import Stdlib from '../models/Stdlib';

// TODO: This file should a middle layer instead of invoking another command
// See https://github.com/zeppelinos/zos-cli/issues/1
async function deployAll({ network, from, packageFileName }) {
  await sync({ network, from, packageFileName, handleStdlib: async function(appManager, stdlibInfo) {
    const stdlib = new Stdlib(stdlibInfo, from);
    const deployed = await stdlib.deploy();
    await appManager.setStdlib(deployed.address);
    return deployed.address;
  }});
}

module.exports = deployAll
