const _ = require("lodash");
const { toChecksumAddress } = require("web3-utils");
const {
  truffleExec,
  setMockStdlibVersion,
  run,
  copy
} = require("../../../util/share")(__dirname);

function cleanup() {
  run("rm -f build/contracts/*.json");
  run("rm -f contracts/*.sol");
  run("rm -f zos.*");
  run("rm -f .openzeppelin/*.json");
  setMockStdlibVersion("1.1.0");
}

function registerProjectHooks(network) {
  before("cleaning up project folder", cleanup);

  before("setting up project", function() {
    copy("Samples.sol", "contracts/Samples.sol");
    copy("GreeterWrapper.sol", "contracts/GreeterWrapper.sol");
  });

  before("loading accounts", async function() {
    if (process.env.FROM) {
      this.from = process.env.FROM;
    } else {
      const accounts = truffleExec(`getaccounts.js --network ${network}`).split(
        ","
      );
      this.from = _.trim(toChecksumAddress(accounts[0]));
    }
  });

  after("cleaning up project folder", cleanup);
}

module.exports = {
  registerProjectHooks
};
