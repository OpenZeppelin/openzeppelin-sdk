---
id: version-2.1.0-writing_contracts
title: Writing upgradeable contracts
sidebar_label: Writing upgradeable contracts
original_id: writing_contracts
---

When working with upgradeable contracts in ZeppelinOS, there are a few minor caveats to keep in mind when writing your Solidity code. It's worth mentioning that these restrictions have their roots in how the Ethereum VM works, and apply to all projects that work with upgradeable contracts, not just ZeppelinOS.

## Initializers

You can use your Solidity contracts in ZeppelinOS without any modifications, except for their _constructors_. Due to a requirement of the proxy-based upgradeability system, no constructors can be used in upgradeable contracts. You can read in-depth about the reasons behind this restriction [in the ZeppelinOS Upgrades Pattern page](pattern.md#the-constructor-caveat).

This means that, when using a contract within ZeppelinOS, you need to change its constructor into a regular function, typically named `initialize`, where you run all the setup logic:

```solidity
// NOTE: Do not use this code snippet, it's incomplete and has a critical vulnerability!

contract MyContract {
  uint256 public x;

  function initialize(uint256 _x) public {
    x = _x;
  }
}
```

However, while Solidity ensures that a `constructor` is called only once in the lifetime of a contract, a regular function can be called many times. To prevent a contract from being _initialized_ multiple times, you need to add a check to ensure the `initialize` function is called only once:

```solidity
contract MyContract {
  uint256 public x;
  bool private initialized;

  function initialize(uint256 _x) public {
    require(!initialized);
    initialized = true;
    x = _x;
  }
}
```

Since this pattern is very common when writing upgradeable contracts, ZeppelinOS provides an `Initializable` base contract that has an `initializer` modifier that takes care of this:

```solidity
import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;

  function initialize(uint256 _x) initializer public {
    x = _x;
  }
}
```

Another difference between a `constructor` and a regular function is that Solidity takes care of automatically invoking the constructors of all ancestors of a contract. When writing an initializer, you need to take special care to manually call the initializers of all parent contracts:

```solidity
import "zos-lib/contracts/Initializable.sol";

contract BaseContract is Initializable {
  uint256 public y;

  function initialize() initializer public {
    y = 42;
  }
}

contract MyContract is BaseContract {
  uint256 public x;

  function initialize(uint256 _x) initializer public {
    BaseContract.initialize(); // Do not forget this call!
    x = _x;
  }
}
```

### Use upgradeable packages

Keep in mind that this restriction affects not only your contracts, but also the contracts you import from a library. For instance, if you use the [`ERC20Detailed` token implementation](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/v2.0.0/contracts/token/ERC20/ERC20Detailed.sol) from OpenZeppelin, the contract initializes the token's name, symbol and decimals in its constructor:

```solidity
Contract ERC20Detailed is IERC20 {
  string private _name;
  string private _symbol;
  uint8 private _decimals;

  constructor(string name, string symbol, uint8 decimals) public {
    _name = name;
    _symbol = symbol;
    _decimals = decimals;
  }
}
```

This means that you should not be using these contracts in your ZeppelinOS project. Instead, make sure to use `openzeppelin-eth`, which is an official fork of OpenZeppelin, which has been modified to use initializers instead of constructors. For instance, an ERC20 implementation provided by `openzeppelin-eth` is the [`ERC20Mintable`](https://github.com/OpenZeppelin/openzeppelin-eth/blob/v2.0.2/contracts/token/ERC20/ERC20Mintable.sol):

```solidity
contract ERC20Mintable is Initializable, ERC20, MinterRole {
  function initialize(address sender) public initializer {
    MinterRole.initialize(sender);
  }
  [...]
}
```

Whether it is OpenZeppelin or another EVM package, always make sure that the package is set up to handle upgradeable contracts.

### Avoid initial values in field declarations

Solidity allows defining initial values for fields when declaring them in a contract.

```solidity
contract MyContract {
  uint256 public hasInitialValue = 42;
}
```

This is equivalent to setting these values in the constructor, and as such, will not work for upgradeable contracts. Make sure that all initial values are set in an initializer function as shown above; otherwise, any upgradeable instances will not have these fields set.

```solidity
contract MyContract is Initializable {
  uint256 public hasInitialValue;
  function initialize() initializer public {
    hasInitialValue = 42;
  }
}
```

## Creating new instances from your contract code

When creating a new instance of a contract from your contract's code, these creations are handled directly by Solidity and not by ZeppelinOS, which means that **these contracts will not be upgradeable**.

For instance, in the following example, even if `MyContract` is upgradeable (if created via `zos create MyContract`), the `token` contract created is not:

```solidity
import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-eth/contracts/token/ERC20/RC20Detailed.sol";

contract MyContract is Initializable {
  ERC20 public token;

  function initialize() initializer public {
    token = new ERC20Detailed("Test", "TST", 18); // This contract will not be upgradeable
  }
}
```

The easiest way around this issue is to avoid creating contracts on your own altogether: instead of creating a contract in an `initialize` function, simply accept an instance of that contract as a parameter, and inject it after creating it from ZeppelinOS:

```solidity
import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20.sol";

contract MyContract is Initializable {
  ERC20 public token;

  function initialize(ERC20 _token) initializer public {
    token = _token; // This contract will be upgradeable if it was created via ZeppelinOS
  }
}
```

```console
$ TOKEN=$(zos create TokenContract)
$ zos create MyContract --init --args $TOKEN
```

An advanced alternative, if you need to create upgradeable contracts on the fly, is to keep an instance of your ZeppelinOS `App` in your contracts. The [`App`](api_application_BaseApp.md) is a contract that acts as the entrypoint for your ZeppelinOS project, which has references to your logic implementations, and can create new contract instances:

```solidity
import "zos-lib/contracts/Initializable.sol";
import "zos-lib/contracts/application/BaseApp.sol";

contract MyContract is Initializable {
  BaseApp private app;

  function initialize(BaseApp _app) initializer public {
    app = _app;
  }

  function createNewToken() public returns(address) {
    return app.create("openzeppelin-eth", "StandaloneERC20");
  }
}
```

## Potentially unsafe operations

When working with upgradeable smart contracts, you will always interact with the contract instance, and never with the underlying logic contract. However, nothing prevents a malicious actor from sending transactions to the logic contract directly. This does not pose a threat, since any changes to the state of the logic contracts do not affect your contract instances, as the storage of the logic contracts is never used in your project.

There is, however, an exception. If the direct call to the logic contract triggers a `selfdestruct` operation, then the logic contract will be destroyed, and all your contract instances will end up delegating all calls to an address without any code. This would effectively break all contract instances in your project.

A similar effect can be achieved if the logic contract contains a `delegatecall` operation. If the contract can be made to `delegatecall` into a malicious contract that contains a `selfdestruct`, then the calling contract will be destroyed.

As such, it is strongly recommended to avoid any usage of either `selfdestruct` or `delegatecall` in your contracts. If you need to include them, make absolutely sure they cannot be called by an attacker on an uninitialized logic contract.

## Modifying your contracts

When writing new versions of your contracts, either due to new features or bugfixing, there is an additional restriction to observe: you cannot change the order in which the contract state variables are declared, nor their type. You can read more about the reasons behind this restriction [in the pattern section](pattern.md).

This means that if you have an initial contract that looks like this:

```solidity
contract MyContract {
  uint256 private x;
  string private y;
}
```

Then you cannot change the type of a variable:

```solidity
contract MyContract {
  string private x;
  string private y;
}
```

Or change the order in which they are declared:

```solidity
contract MyContract {
  string private y;
  uint256 private x;
}
```

Or introduce a new variable before existing ones:

```solidity
contract MyContract {
  bytes private a;
  uint256 private x;
  string private y;
}
```

Or remove an existing variable:

```solidity
contract MyContract {
  string private y;
}
```

If you need to introduce a new variable, make sure you always do so at the end:

```solidity
contract MyContract {
  uint256 private x;
  string private y;
  bytes private z;
}
```

Keep in mind that if you rename a variable, then it will keep the same value as before after upgrading. This may be the desired behaviour if the new variable is semantically the same as the old one:

```solidity
contract MyContract {
  uint256 private x;
  string private z; // starts with the value from `y`
}
```

And if you remove a variable from the end of the contract, note that the storage will not be cleared. A subsequent update that adds a new variable will cause that variable to read the leftover value from the deleted one.

```solidity
contract MyContract {
  uint256 private x;
}

// Then upgraded to...

contract MyContract {
  uint256 private x;
  string private z; // starts with the value from `y`
}
```

Note that you may also be inadvertently changing the storage variables of your contract by changing its parent contracts. For instance, if you have the following contracts:

```solidity
contract A {
  uint256 a;
}

contract B {
  uint256 b;
}

contract MyContract is A, B { }
```

Then modifying `MyContract` by swapping the order in which the base contracts are declared, or introducing new base contracts, will change how the variables are actually stored:

```solidity
contract MyContract is B, A { }
```

You also cannot add new variables to base contracts, if the child has any variables of its own. Given the following scenario:
```solidity
contract Base {
  uint256 base1;
}

contract Child is Base {
  uint256 child;
}
```

If `Base` is modified to add an extra variable:
```solidity
contract Base {
  uint256 base1;
  uint256 base2;
}
```

Then the variable `base2` would be assigned the slot that `child` had in the previous version. A workaround for this is to declare unused variables on base contracts that you may want to extend in the future, as a means of "reserving" those slots. Note that this trick does not involve increased gas usage.


> Violating any of these storage layout restrictions will cause the upgraded version of the contract to have its storage values mixed up, and can lead to critical errors in your application.
