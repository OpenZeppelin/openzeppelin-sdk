---
id: linking
title: Linking to EVM packages
---

ZeppelinOS allows us to link to packages that have been already deployed
to the blockchain, instead of wasting resources deploying them again every time
we need them in a project. And of course, developers can upgrade their
packages and we can update our links to point to the newest versions, so we are
finally making an efficient use of all the developments in the community.

To use EVM packages we need first to initialize a ZeppelinOS project. Luckily,
we already have one after following the guide about
[Deploying your first project](deploying.md).

To continue with this exploration, let's write a new contract in
`contracts/MyLinkedContract.sol`, and let's make it import a very common
contract from the [OpenZeppelin](https://openzeppelin.org/) package:

```solidity
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/token/ERC721/ERC721Mintable.sol";

contract MyLinkedContract {
  ERC721Mintable private _token;

  function setToken(ERC721Mintable token) external {
    require(token != address(0));
    _token = token;
  }
}
```

One thing to notice is that instead of importing `openzeppelin-solidity` we are
importing `openzeppelin-eth`. This is the name of the OpenZeppelin EVM package,
the one we have to use if we want to reuse the package already deployed.

// TODO link to difference between openzeppelin-eth and openzeppelin-solidity.
// https://github.com/OpenZeppelin/openzeppelin-eth/issues/16

Now, let's link our project to the openzeppelin-eth package:

```console
zos link openzeppelin-eth
```

This command will install the openzeppelin-eth contracts locally, which is
needed to compile the contracts that import it; but it will also update the
`zos.json` file with a reference to the linked package to make sure that when
you deploy the project it will use the EVM package that already exists on the
blockchain.

The following commands will be familiar to you. Just as we did before, we have
to add the contract to the project:

```console
zos add MyLinkedContract
```

and push them to a local network:

```console
zos push --deploy-dependencies --network local
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
zos create MyLinkedContract --network local
```

We also need an instance of the `ERC721` token from the EVM package:

```console
zos create openzeppelin-eth/StandaloneERC721 --init initialize --args MyToken,TKN,[<address>],[<address>] --network local
```

`<address>` will be the minter and pauser of the token. For local development
you can use one of the 10 addresses that `truffle deploy` printed.

Finally, jump to that terminal where the Truffle console is open and connect
the two deployed contracts:

```console
truffle(local)> MyLinkedContract.at(<myLinkedContractAddress>).setToken(<tokenAddress>)
```

Remember that the addresses of both your contract and the token were printed by
`zos`, and they can also be found in the `zos.local.json` configuration file.

This is just the beginning of a better blockchain ecosystem, where developers
share their knowledge and their cool ideas in EVM packages, and we all
contribute by using and improving those packages. This soon will be a swarm of
packages that implement crazy new ways for a society to work, and they will all
be available for you to just link into your project and build on top of them.

But so far we have only seen the side of the users of EVM packages. I'm sure
you are now asking yourself how can you publish all the packages that you are
developing. That's what we'll explore next.
