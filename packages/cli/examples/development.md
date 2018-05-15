# Develop an upgradeable smart contract application using `zos`

## Write your smart contracts
Write your contracts as you would usually do, but replacing constructors with `initialize` functions. You can do this more easily by using the `Initializable` helper contract in [`zos-lib`](https://github.com/zeppelinos/zos-lib).

```sh
npm install zos-lib
```

- For an upgradeable contract development full example, see [the examples folder in `zos-lib`](https://github.com/zeppelinos/zos-lib/blob/master/examples/simple/contracts/MyContract_v0.sol).
- For an introductory smart contract development guide, see [this blog post series](https://blog.zeppelin.solutions/a-gentle-introduction-to-ethereum-programming-part-1-783cc7796094).

In this example, we'll use this simple contract:
```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }
}
```


Before you continue, use truffle to compile your contracts:
```sh
npx truffle compile
```

## Register your initial contract implementations

The next step is to register all the contract implementations of the first `version` of your project. To do this please run:

```
zos add-implementation <contract_name_1>
zos add-implementation <contract_name_2>
...
zos add-implementation <contract_name_n>
```

Where `<contract_name>` is the name of your Solidity contract, and `<alias>` is the name under which it will be registered 
in zeppelin_os. 

In our example, run:
```
zos add-implementation MyContract
```

To have your `package.zos.json` file always up-to-date, run `zos add-implementation` for every new contract you add to your project.

## Sync your project with the blockchain with `zos sync`

This command will deploy your upgradeable application to the blockchain:
```
zos sync --network <network>
```

The first time you run this command for a specific network, a new `package.zos.<network>.json` will be created. This file will reflect the status of your project in that network.

## Create upgradeability proxies for each of your contracts  

The next commands will deploy new proxies to make your contracts upgradeable:

```
zos create-proxy <alias_1> --network <network>
zos create-proxy <alias_2> --network <network>
...
zos create-proxy <alias_n> --network <network>
```

Optionally, you can use the `-i` flag to call an initialization/migration function after you create the proxy.

In our simple example, we want to call the `initialize` function, with some value (e.g: 42) thus:
```
zos create-proxy MyContract -i initialize -p 40 --network development 
```

The proxy addresses, which you'll need to interact with your upgradeable contracts, will be stored in the `package.zos.<network>.json` file.

Open the `package.zos.<network>.json` and use the addresses found there to interact with your deployed contracts. Congratulations! The first version of your upgradeable smart contract app is deployed in the blockchain!

## Using a standard library

In addition to creating proxies for your own contracts, you can also re-use already deployed contracts from a zeppelin_os standard library. To do so, run the following command, with the name of the npm package of the stdlib you want to use. For example:

```bash
zos set-stdlib openzeppelin-zos
```

The next `sync` operation will connect your application with the chosen standard library on the target network. However, if you're using development nodes (such as testrpc or ganache), the standard library is not already deployed, since you are running from an empty blockchain. To work around this, you can add a `--deploy-stdlib` flag to the `sync` command:

```bash
zos sync --network <network>
```

This will deploy your entire application to the target network, along with the standard library you are using and all its contracts. This way, you can transparently work in development with the contracts provided by the stdlib.

From there on, you can create proxies for any contract provided by the stdlib:

```bash
zos create-proxy DetailedMintableToken --network <network>
```


## Update your smart contract code

Some time later you might want to change your smart contract code: fix a bug, add a new feature, etc. 
To do so, update your contracts, making sure you don't change their pre-existing storage structure. This is required
by **zeppelin_os** upgradeability mechanism. This means you can add new state variables, but you can't remove the ones you already have. In the example above, this could be the new version of `MyContract`:

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

Use truffle to compile the new version of your code:
```sh
npx truffle compile
```

We'll now use `zos` to register and deploy the new code for `MyContract` to the blockchain. Sync the new version of your project by running: 

```
zos sync --network <network>
```

After running this command, the new versions of your project's contracts are deployed in the blockchain. 
However, the already deployed proxies are still running with the old implementations. You need to upgrade
each of the proxies individually. To do so, you just need to run this for every contract: 

```
zos upgrade-proxy <alias_1> <proxy_address_1> --network <network>
zos upgrade-proxy <alias_2> <proxy_address_2> --network <network>
...
zos upgrade-proxy <alias_n> <proxy_address_n> --network <network>
```

In our simple example:
```
zos upgrade-proxy MyContract <proxy_address> --network development
```

Where <proxy_address> is the address found in package.zos.<network>.json.
  
Voila! Your contract has now been upgraded. The address is the same as before, but the code has been changed to the latest version. Repeat the same steps for every code update you want to perform.
