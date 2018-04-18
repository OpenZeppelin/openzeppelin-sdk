global.artifacts = artifacts
global.web3 = web3
global.network = process.argv[5]
global.log = true

module.exports = require(`./${command}`)