function getAccounts() {
  return new Promise((resolve, reject) => {
    web3.eth.getAccounts((err, accounts) => {
      if (err) reject(err)
      resolve(accounts)
    })
  })
}

module.exports = function(cb) {
  getAccounts().then(accounts => {
    console.log(accounts.join(','))
    cb()
  }).catch(cb)
}