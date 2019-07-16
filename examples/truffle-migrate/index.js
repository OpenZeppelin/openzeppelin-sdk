'use strict';

const MyContract = artifacts.require('MyContract_v0');

async function main() {
  // We can use the `deployed()` truffle helper to retrieve the upgradeable instance
  const deployed = await MyContract.deployed();
  const value = await deployed.value();
  const version = await deployed.version();
  console.log(`Value of MyContract (${version}) deployed instance: ${value.toString()}`);
  if (value.toString() !== "52") {
    throw Error("Returned value is incorrect");
  }
}

// Handle truffle exec
module.exports = function(callback) {
  main().then(() => callback()).catch(err => callback(err))
};
