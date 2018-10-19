---
id: using
title: Using EVM packages in your app
sidebar_label: Using EVM packages
---

Besides allowing you to build upgradeable applications, ZeppelinOS provides EVM packages that you can use in your app.

To use an EVM package in your contracts, you will need to set up a `zos` project as described in the [Setup](setup.md) guide. Then, you need to run the `link` command with the name of the npm package of the EVM package you want to use. For example:

```sh
zos link openzeppelin-zos
```

`openzeppelin-zos` is [a ZeppelinOS EVM package provided by the OpenZeppelin community](stdlib.md), in which you can find many useful contracts. You can now include contracts from the EVM package in your app:

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
zos push --deploy-libs --network local
```

Here, the `--deploy-libs` flag deploys all instance of linked EVM packages locally. This is only needed because we're using a development network. You won't need this flag when working with a network where the EVM packages are already deployed, like `ropsten` or `mainnet`.

You can now create an upgradeable instance of your contract simply through:

```sh
zos create MyContract --network local
```

You'll also want to create an instance of the `ERC721` token from the EVM package:

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

This completes the setup and deployment of an upgradable application that uses an EVM package provided by ZeppelinOS. If you would like to contribute your own EVM package to ZeppelinOS, please see the [Developing a new EVM package](developing.md) guide.
