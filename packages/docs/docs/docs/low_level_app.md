---
id: low_level_app
title: Low level upgradeable app
sidebar_label: Low level upgradable app
---

> **Note**: this guide shows a low-level method for operating a complex upgradeable decentralized application. For a CLI-aided developer experience, use the [higher-level CLI guide](setup.md).

> **Note**: for a fully working project with this example, see the [`examples/complex`](https://github.com/zeppelinos/zos-lib/tree/master/examples/complex) folder of the `zos-lib` repository.

Most real-world applications require more than a single smart contract. In this guide we will explore how to build an upgradeable app with multiple smart contracts and how to use the ZeppelinOS EVM package.

### Getting started

Imagine we want to build a simple donation application where we give donors some sort of recognition, and we want for it to be upgradable. First, we install the ZeppelinOS library:

```sh
npm install zos-lib
```

### Create the app

Next, we need the App contract of the [`ZeppelinOS Library`](https://github.com/zeppelinos/zos-lib).
This contract will live in the blockchain and manage the different versions of our smart contracts.

```js
const { App } = require('zos-lib')
const initialVersion = '0.0.1'
await App.deploy(initialVersion)
```

### Create the contract

An initial version of the Solidity contract could look like:

```sol
pragma solidity ^0.4.21;

import "openzeppelin-zos/contracts/ownership/Ownable.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";

contract DonationsV0 is Ownable {
  using SafeMath for uint256;

  // Keeps a mapping of total donor balances
  mapping(address => uint256) public donorBalances;

  function donate() payable public {
    require(msg.value > 0);

    // Update user donation balance
    donorBalances[msg.sender] = donorBalances[msg.sender].add(msg.value);
  }

  function getDonationBalance(address _donor) public view returns (uint256) {
    return donorBalances[_donor];
  }

  function withdraw(address _wallet) onlyOwner {
    // Withdraw all donated funds
    _wallet.transfer(this.balance);
  }
}
```

Now, let's deploy the first version of our contract. To do so, we register its implementation in the `App` and then request to create a new proxy for it:

```js
const contractName = "Donations";
const DonationsV0 = Contracts.getFromLocal('DonationsV0')
await app.setImplementation(DonationsV0, contractName)
const donationsV0 = await app.createProxy(DonationsV0, contractName, 'initialize', [owner])
```

Remember that the proxy is the contract that will receive the calls and hold the storage, while delegating its behavior to the implementation contract, enabling us to upgrade it.

### Link an EVM package

Now let's suppose we want to give some sort of retribution to the donors, so we mint new [ERC721](http://erc721.org/) cryptocollectibles for each donation. 

In order to do this, we link the [ZeppelinOS EVM package](stdlib.md) to our application by running:

```sh
npm install openzeppelin-zos
```

Done! Now we can easily mint non-fungible tokens from our smart contract:

```sol
pragma solidity ^0.4.21;

import "./DonationsV0.sol";
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

contract DonationsV1 is DonationsV0 {
  using SafeMath for uint256;

  MintableERC721Token public token;
  uint256 public numEmittedTokens;

  function setToken(MintableERC721Token _token) external {
    require(_token != address(0));
    require(token == address(0));
    token = _token;
  }

  function donate() payable public {
    super.donate();
    token.mint(msg.sender, numEmittedTokens);
    numEmittedTokens = numEmittedTokens.add(1);
  }
}
```

Notice that by doing this, our contract will interact directly with the on-chain ZeppelinOS EVM package, so there is no need to deploy nor maintain the `MintableERC721Token` contract ourselves.

### Upgrade to the new version

To upgrade our app, we need to create a new version and reference the ZeppelinOS EVM package release

```js
const stdlibAddress = "0x3bd95b5a003481b801010bcde4f7e0a32a925deb" // mainnet release
const newVersion = '0.0.2'
await app.newVersion(newVersion, await getStdLib(stlibAddress))
```

Next, we register the new implementation of our donations contract:

```js
const DonationsV1 = Contracts.getFromLocal('DonationsV1')
await app.setImplementation(DonationsV1, contractName)
```

And upgrade the proxy:

```js
await app.upgradeProxy(donationsV0.address, null, contractName)
// We wrap the previous proxy address with the new interface
donationsV1 = DonationsV1.at(donationsV0.address)
```

Then we create a proxy to the EVM package version of the ERC721 contract, declaring our `donationV1` proxy address as the owner:

```js
const token = await app.createProxy(
  MintableERC721Token, 
  tokenClass,
  'initialize',
  [donationsV1.address, tokenName, tokenSymbol]
)
```

Finally, we set it as the token of our upgradeable contract

```js
await donationsV1.setToken(token.address)
```

That's it! We have upgraded our ZeppelinOS app behavior while preserving its original balance and storage. This new version is also using a proxy contract of the the on-chain ZeppelinOS EVM package implementation of a mintable ERC721 token.
