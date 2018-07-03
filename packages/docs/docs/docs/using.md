---
id: using
title: Using the stdlib in your app
sidebar_label: Using the stdlib
---

Besides allowing you to build upgradeable applications, ZeppelinOS provides on-chain standard libraries that you can use in your app.

To use an stdlib in your contracts, you will need to set up a `zos` project as described in the [Setup](setup.md) guide. Then, you need to run the `link` command with the name of the npm package of the stdlib you want to use. For example:

```sh
zos link openzeppelin-zos
```

`openzeppelin-zos` is [a ZeppelinOS standard library provided by the OpenZeppelin community](stdlib.md), in which you can find many useful contracts. You can now include contracts from the stdlib in your app:

```sol
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

contract MyContract {
  MintableERC721Token public token;

  function setToken(MintableERC721Token _token) external {
    require(_token != address(0));
    token = _token;
  }
}
```

You can now `add` your contracts to the project:

```sh
zos add MyContract
```

and push them to a local network (which can be started by `npx truffle develop`) with:

```sh
zos push --deploy-stdlib --network local
```

Here, the `--deploy-stdlib` flag deploys an instance of the stdlib locally. This is only needed because we're using a development network. You won't need this flag when working with a network where the stdlib is already deployed, like `ropsten` or `mainnet`.

You can now create an upgradeable instance of your contract simply through:

```sh
zos create MyContract --network local
```

You'll also want to create an instance of the `ERC721` token from the stdlib:

```sh
zos create MintableERC721Token --init initialize --args <address>,MyToken,TKN --network local
```

`<address>` will be the owner of the token. For local development you can use one of those provided by your client, or you can extract your app's contract addresses from your `zos.local.json` network configuration file.

Finally, use Truffle to connect your two deployed contracts:

```sh
$ npx truffle console --network local
truffle(local)> MyContract.at(<myContractAddress>).setToken(<tokenAddress>)
```

Remember that the addresses of both your contract and the token can be found in the `zos.local.json` network configuration file.

This completes the setup and deployment of an upgradable application that uses an stdlib provided by ZeppelinOS. If you would like to contribute your own stdlib to ZeppelinOS, please see the [Developing a new standard library](developing.md) guide.
