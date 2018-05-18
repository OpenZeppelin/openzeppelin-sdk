# ZeppelinOS library
[![NPM Package](https://img.shields.io/npm/v/zos-lib.svg?style=flat-square)](https://www.npmjs.org/package/zos-lib)
[![Build Status](https://travis-ci.org/zeppelinos/zos-lib.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-lib)
[![Coverage Status](https://coveralls.io/repos/github/zeppelinos/zos-lib/badge.svg?branch=master)](https://coveralls.io/github/zeppelinos/zos-lib?branch=master)

`zos-lib` is a library for writing upgradeable smart contracts on Ethereum. It can be used to create an upgradeable on-chain distributed application.

Use this library if you want to programmatically develop, deploy or operate an upgradeable smart contract system.

If you want a CLI-aided development experience, see [the zOS CLI](https://github.com/zeppelinos/zos-cli).

# Getting Started

To install `zos-lib` simply go to your project's root directory and run:
```sh
npm i zos-lib
```

Next, learn how to:
- [Develop and deploy a single smart contract which can be upgraded](#single) (for bugfixing or adding new features).
- [Develop and operate a complex upgradeable app](#complex) with multiple smart contracts which are connected to the zOS upgradeable standard libraries.

## <a name="single"></a> Develop and deploy a single upgradeable smart contract
Note: This shows a low-level manual method of developing a single upgradeable smart contract. You probably want to use [the higher-level CLI guide](https://github.com/zeppelinos/zos-cli/blob/master/README.md).

To work with a single upgradeable smart contract, we just need to deal with a simple upgradeability proxy. This is a special contract that will hold the storage of our upgradeable contract and redirect function calls to an `implementation` contract, which we can change (thus making it upgradeable). Let's do the following example to see how it works:

1. Write the first version of the contract in `MyContract.sol`. Most contracts require some sort of initialization, but upgradeable contracts can't use constructors because the proxy won't know about those values. So we need to use the `Initializable` pattern provided by `zos-lib`:

```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }
}
```

2. Deploy this version:

```js
const myContract_v0 = await MyContract.new();
```

3. Now we need to deploy the proxy that will let us upgrade our contract. Pass the address of the first version to the constructor:

```js
const proxy = await AdminUpgradeabilityProxy.new(myContract_v0.address);
```

4. Next, call initialize on the proxy, to initialize the storage variables. Note that you have to wrap the proxy in a `MyContract` interface, because all calls will be delegated from the proxy to the contract with the implementation.

```js
let myContract = await MyContract.at(proxy.address);
const x0 = 42;
await myContract.initialize(x0);
console.log(await myContract.x()); // 42
```

5. Let's edit `MyContract.sol` to add a function called `y`:

```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }

  function y() public pure returns (uint256) {
    return 1337;
  }

}
```

Note that when we update our contract's code, we can't change its pre-existing storage structure. This means we can't remove any previously existing contract variable. We can, however, remove functions we don't want to use anymore (in the code shown, all functions were preserved).

6. Next, we deploy our new version, and upgrade our proxy to use this implementation:

```js
const myContract_v1 = await MyContract.new();
await proxy.upgradeTo(myContract_v1.address);
myContract = await MyContract.at(proxy.address);

console.log(await myContract.x()); // 42
console.log(await myContract.y()); // 1337

```

Wohoo! We've upgraded our contract's behavior while preserving it's storage.

[For a fully working project with this example, see the `examples/single` folder](examples/single).
[To learn more about how proxies work under the hood, read this post on our blog](https://blog.zeppelinos.org/proxy-patterns/).

## <a name="complex"></a> Develop and operate a complex upgradeable app

Note: This shows a low-level manual method of developing a complex upgradeable smart contract application. You probably want to use [the higher-level CLI guide](https://github.com/zeppelinos/zos-cli/blob/master/README.md) instead, but feel free to continue reading if you want to understand the core contracts of `zos-lib`.

Most real-world applications require more than a single smart contract. Here's how to build a complex upgradeable app with multiple smart contracts and connect it to the zOS standard libraries:

1. Let's imagine we want to build a simple donation application where we give donors some sort of recognition. An initial version of the contract can look like so:

```sol
pragma solidity ^0.4.21;

import "openzeppelin-zos/contracts/ownership/Ownable.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";

contract DonationsV1 is Ownable {
  using SafeMath for uint256;

  // Keeps a mapping of total donor balances.
  mapping(address => uint256) public donorBalances;

  function donate() payable public {
    require(msg.value > 0);

    // Update user donation balance.
    donorBalances[msg.sender] = donorBalances[msg.sender].add(msg.value);
  }

  function getDonationBalance(address _donor) public view returns (uint256) {
    return donorBalances[_donor];
  }

  function withdraw(address _wallet) onlyOwner {
    // Withdraw all donated funds.
    _wallet.transfer(this.balance);
  }
}
```

2. We want to use `zos-lib` to deploy this contract with upgradeability capabilities. Given this will probably be a complex application and we'll want to use the zOS standard libraries, we'll use the `App` contract. This contract will live in the blockchain and manage the different versions of our smart contract code and upgradeability proxies. It's the single entry point to manage our application's contract's upgradeability and instances. Let's create and configure it:

```js
  // On-chain, single entry point of the entire application.
  log.info("<< Setting up App >>")
  const initialVersion = '0.0.1'
  return await AppDeployer.call(initialVersion)
```

3. Next, we need to deploy the first version of the app contracts. To do so, we register the implementation of our `DonationsV1` in the `App` and request it to create a new upgradeable proxy for it. Let's do it:

```js
  // Register the first implementation of 'Donations', and request a proxy for it.
  log.info('<< Deploying version 1 >>')
  const DonationsV1 = Contracts.getFromLocal('DonationsV1')
  await app.setImplementation(DonationsV1, contractName);
  return await app.createProxy(DonationsV1, contractName, 'initialize', [owner])
```

4. Now let's suppose we want to give some sort of retribution to people donating money to our donation campaign. We want to mint new ERC721 cryptocollectibles for every received donation. To do so, we'll link our application to a zOS standard library release that contains an implementation of a mintable ERC721 token. Here's the new contract code:

```sol
pragma solidity ^0.4.21;

import "./DonationsV1.sol";
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

contract DonationsV2 is DonationsV1 {
  using SafeMath for uint256;

  // ERC721 non-fungible tokens to be emitted on donations.
  MintableERC721Token public token;
  uint256 public numEmittedTokens;

  function setToken(MintableERC721Token _token) external {
    require(_token != address(0));
    require(token == address(0));
    token = _token;
  }

  function donate() payable public {
    super.donate();

    // Emit a token.
    token.mint(msg.sender, numEmittedTokens);
    numEmittedTokens = numEmittedTokens.add(1);
  }
}
```

5. What we need to do next is link our application to the zOS standard library release containing that mintable ERC721 implementation, and set it to our upgradeable contract. To do so, we create a new version of our application in the `App`, register a new `AppDirectory` containing the new version of our contract implementation, and then set the standard library version of ERC721 to our upgradeable contract. Let's see how:

```js
  // Create a new version of the app, liked to the ZeppelinOS standard library.
  // Register a new implementation for 'Donations' and upgrade it's proxy to use the new implementation.
  log.info('<< Deploying version 2 >>')
  const secondVersion = '0.0.2'
  await app.newVersion(secondVersion, await getStdLib(txParams))
  const DonationsV2 = Contracts.getFromLocal('DonationsV2')
  await app.setImplementation(DonationsV2, contractName);
  await app.upgradeProxy(donations.address, null, contractName)
  donations = DonationsV2.at(donations.address)

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on 'Donations'.
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await app.createProxy(
    MintableERC721Token, 
    tokenClass,
    'initialize',
    [donations.address, tokenName, tokenSymbol]
  )
  log.info(`Token proxy created at ${token.address}`)
  log.info('Setting application\'s token...')
  await donations.setToken(token.address, txParams)
  log.info('Token set succesfully')
  return token;
```

That's it! We now have the same contract, retaining the original balance, and storage, but with an upgraded code. The upgradeable contract is also linked to an on-chain upgradeable standard library containing an implementation of a mintable ERC721 token. State of the art!

