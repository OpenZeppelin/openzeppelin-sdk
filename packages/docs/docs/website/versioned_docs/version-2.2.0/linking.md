---
id: version-2.2.0-linking
title: Linking to EVM packages
original_id: linking
---

ZeppelinOS allows us to link packages that have been already deployed
to the blockchain, instead of wasting resources deploying them again every time
we need them in a project. And of course, developers can upgrade their
packages and we can update our links to point to the newest versions, so we are
finally making an efficient use of all the developments in the community.

To use EVM packages we need first to initialize a ZeppelinOS project. Luckily,
we already have one after following the guide about
[Deploying your first project](deploying.md).

To continue with this exploration, let's write a new contract called
`MyLinkedContract.sol` and place it in the `contracts` folder. Then,
let's make it import a very common
contract from the [OpenZeppelin](https://openzeppelin.org/) EVM package:

```solidity
pragma solidity ^0.5.0;

import "openzeppelin-eth/contracts/token/ERC721/ERC721Mintable.sol";

contract MyLinkedContract {
  ERC721Mintable private _token;

  function setToken(ERC721Mintable token) external {
    require(address(token) != address(0));
    _token = token;
  }
}
```

One thing to notice is that instead of importing `openzeppelin-solidity` we are
importing `openzeppelin-eth`. This is the name of the OpenZeppelin EVM package,
the one we have to use if we want to reuse the package already deployed.
For more information, see
[this article which explains the difference between openzeppelin-solidity and openzeppelin-eth](https://blog.zeppelin.solutions/getting-started-with-openzeppelin-eth-a-new-stable-and-upgradeable-evm-package-576fb37297d0#125e).

Now, let's link our project to the openzeppelin-eth package by running:

```console
npx zos link openzeppelin-eth
```

This command will install the openzeppelin-eth contracts locally, which is
needed to compile the contracts that import it; but it will also update the
`zos.json` file with a reference to the linked package to make sure that when
you deploy the project it will use the EVM package that already exists on the
blockchain.

The following commands will be familiar to you. Just as we did before, we have
to add the contract to the project:

```console
npx zos add MyLinkedContract
```

> If any of the following commands fail with an `A network name must be provided 
to execute the requested action` error, it means our session has expired. 
In that case, renew it by running the command `npx zos session --network local 
--from 0x1df62f291b2e969fb0849d99d9ce41e2f137006e --expires 3600` again.

Now, let's push our changes to the blockchain:

```console
npx zos push --deploy-dependencies
```

There is one caveat here with the `--deploy-dependencies` flag. We mentioned
that this feature is about reusing packages that were already deployed, and we
do have already deployed versions of openzeppelin-eth and many other packages
to mainnet, ropsten, rinkeby and kovan. However, on this guide we are not using
any of those networks, instead we started a local development network with
Truffle that is empty. So, `--deploy-dependencies` tells ZeppelinOS to deploy
to the network the EVM packages we depend on. This has to be done only once,
so if you are using one of the real networks mentioned above, or you are
running the command again on the local network, this flag won't be needed.

Repeating ourselves from before, let's make an upgradeable instance of the
contract:

```console
npx zos create MyLinkedContract
```

We also need an instance of the `ERC721` token from the EVM package:

```console
npx zos create openzeppelin-eth/StandaloneERC721 --init initialize --args MyToken,TKN,[<address>],[<address>]
```

`<address>` will be the minter and pauser of the token. For local development
you can use one of the 10 addresses that `ganache-cli` created by default.

Finally, we can start a new Truffle console to interact with our contract by running:

```console
npx truffle console --network local
```

Now, let's jump to that Truffle console and connect our two deployed upgradeable contracts:

> _Make sure you replace <my-linked-contract-address> and <my-erc721-address> 
with the addresses of the upgradeable instances your created of `MyLinkedContract` 
and `StandaloneERC721` respectively. Both addresses were returned by the `create` 
commands we ran above._

```console
truffle(local)> myLinkedContract = await MyLinkedContract.at('<my-linked-contract-address>')
truffle(local)> myLinkedContract.setToken('<my-erc721-address>')
```

Remember that the addresses of both your contract and the token, can also be 
found in the `zos.dev-<network_id>.json` configuration file.

This is just the beginning of a better blockchain ecosystem, where developers
share their knowledge and their cool ideas in EVM packages, and we all
contribute by using and improving those packages. This soon will be a swarm of
packages that implement crazy new ways for a society to work, and they will all
be available for you to just link into your project and build on top of them.

But so far we have only seen the side of the users of EVM packages. I'm sure
you are now asking yourself how can you publish all the packages that you are
developing. That's what we'll explore next.
