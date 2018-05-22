---
id: using
title: Using the stdlib in your app
sidebar_label: Using the stdlib
---

Apart from allowing us to build upgradeable applications, ZeppelinOS provides an on-chain [standard library](stdlib.md) that we can use in our app. 
 
To use the stdlib in our contracts, we will need to set up a `zos` project as described in the [Setup](setup.md) guide. Then, we need to run the `link` command with the name of the npm package of the stdlib we want to use. For example:

```sh
zos link openzeppelin-zos
```

Now we can safely include contracts from the stdlib in our app:

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

(Note that the `link` command above will install the `zos-lib` contracts for us). 

We now `add` our contracts to the project:

```sh
zos add MyContract
```

and push them to a local network (which can be started by `npx truffle develop`) with:

```sh
zos push --deploy-stdlib --network local
```

Here, the `--deploy-stdilb` flag deploys a copy of the stdlib locally. We don't need this flag when working with a network where the stdlib we want to use is already deployed. 

Now we can, as before, create an upgradeable version of our contract simply through:

```sh
zos create MyContract --network local
```

We'll also want our instance of the `ERC721` token from the stdlib:

```sh
zos create MintableERC721Token --init initialize --args <address>,MyToken,TKN --network local
```

`<address>` here will be the owner of the token, for local development we could use one of those provided by our client, or we could extract it from your `zos.local.json` network configuration file. 

We can finally use Truffle to bind our two deployed contracts:

```sh
echo "MyContract.at(<myContractAddress>).setToken(<tokenAddress>)" | npx truffle console --network local
```

Again, the addresses for both our contract and the token can be found in the `zos.local.json` network configuration file.

This completes the setup and deployment of an upgradable application that uses the stdlibs provided by ZeppelinOS. If you would like to contribute your own stdlibs to ZeppelinOS, please see our following [Developing a new standard library](developing.md) guide.

