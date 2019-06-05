module.exports = function(cb) {
  web3.eth.sendTransaction({ from: web3.eth.accounts[0], to: process.env.RECIPIENT_ACCOUNT, value: 1000e18 }, cb);
}