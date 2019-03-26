# Sample ZeppelinOS project with dependencies

This is a simple ZeppelinOS project that uses several dependencies to retrieve contracts and build an application. It relies on `example-dep-basic` (from this same repository) to use a sample `EthBox` contract, and on [`openzeppelin-zos`](https://github.com/OpenZeppelin/openzeppelin-zos) for a regular `ERC20` contract.

## How this project was set up

To set up a project like this one, you need to first install ZeppelinOS, create a new project, and link all the dependencies you need to use:

```bash
$ npm install -g zos
$ zos init cli-with-deps
$ zos link example-dep-basic
$ zos link openzeppelin-zos
```

Then add your contracts, and publish the project to a network. In this project, we have a single contract named `TokenExchange`, which depends on an `ERC20` token, and the `EthBox` contract provided by `example-dep-basic`.
```bash
$ zos add TokenExchange
$ zos session --network ropsten
$ zos push
```

Note that, if you are working on a network where the dependencies have not been deployed by their developer (this happens when working with a local ganache instance, for example), you need to add the `--deploy-libs` flag to the `push` command. This will make ZeppelinOS deploy your own copy of the libraries.

After you have pushed your code to the network, you can now create instances from your own contracts, or from any provided by the dependencies you are working with:
```bash
$ zos create example-dep-basic/EthBox
Creating example-dep-basic EthBox proxy without initializing...
example-dep-basic EthBox proxy: 0xc2069675fe551cae14ca3cf3ec849117e0b40342
```
```bash
$ zos create openzeppelin-zos/DetailedPremintedToken --init initialize --args $OWNER,Test,TEST,8,100000000000000000000
Creating openzeppelin-zos DetailedPremintedToken proxy and calling initialize with: 
 - _sender (address): $OWNER
 - _name (string): "Test"
 - _symbol (string): "TEST"
 - _decimals (uint8): "8"
 - _initialBalance (uint256): "100000000000000000000"
openzeppelin-zos DetailedPremintedToken proxy: 0x568877b70b562af298a8436b28733ed6be6aad46
```
```bash
$ zos create TokenExchange --init initialize --args $OWNER,0x568877b70b562af298a8436b28733ed6be6aad46,0xc2069675fe551cae14ca3cf3ec849117e0b40342
Creating cli-with-deps TokenExchange proxy and calling initialize with: 
 - _beneficiary (address): $OWNER
 - _token (address): "0x568877b70b562af298a8436b28733ed6be6aad46"
 - _box (address): "0xc2069675fe551cae14ca3cf3ec849117e0b40342"
cli-with-deps TokenExchange proxy: 0x7878793d39e04b0b45bcdfa51d8577629f5e1510
```

You can now spin up a truffle console and start interacting with your newly deployed contracts. Note that all of these are upgradeable instances:
```js
TokenExchange.deployed().then(e => exchange = e)         // Retrieve token exchange contract using .deployed()
exchange.token().then(t => token = ERC20.at(t))          // Retrieve token contract using exchange getter
token.transfer(exchange.address, 10e18, { from: owner }) // Send tokens to the exchange for distribution

exchange.sendTransaction({ from: user, value: 1e17 })    // Make a purchase on the exchange from a user!
```