---
id: building-stdlib
title: Using the stdlib in your app
sidebar_label: Using the stdlib
---

Apart from allowing you to build upgradeable applications, ZeppelinOS provides an on-chain [standard library](stdlib.md) that you can use in your app. 
 
To use the stdlib in your contracts, you will need to set up a `zos` project as described in the [Setup](setup.md) guide. Then, you need to run the `link` command with the name of the npm package of the stdlib you want to use. For example:

    zos link openzeppelin-zos

Now you can safely include contracts from the stdlib in your app:

    import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";
  
    contract MyContract {
      MintableERC721Token public token;
      
      function setToken(MintableERC721Token _token) external {
        require(_token != address(0));
        token = _token;
      }
    }

(Note that the `link` command above will install the `zos-lib` contracts for you). Compile your code as before with:

    npx truffle compile

and, as before, `add` your contracts to the project:

    zos add MyContract

and push them to the desired network:

    zos push --network <network>

Note that when working in a local network, we will need to deploy a copy of the stdlib locally too. This is achieved with the `--deploy-stdilb` flag of the `push` command:

    zos push --deploy-stdlib --network development

Now you can, as before, create an upgradeable version of your contract simply through:

    zos create MyContract --network development

You'll also want your instance of the `ERC721` token from the stdlib:

    zos create MintableERC721Token --init initialize --args <address>,MyToken,TKN --network development

`<address>` here will be the owner of the token, for local development you could use one of those provided by your client, or you could extract it from your `zos.<network>.json` network configuration file. 

You can finally use Truffle to bind your two deployed contracts:

    echo "MyContract.at(<myContractAddress>).setToken(<tokenAddress>)" | truffle console --network development

Again, the addresses for both your contract and the token can be found in the `zos.<network>.json` network configuration file.

This completes the setup and deployment of an upgradable application that uses the stdlibs provided by ZeppelinOS. If you would like to contribute your own stdlibs to ZeppelinOS, please see our following [Developing a new standard library](developing.md) guide.

