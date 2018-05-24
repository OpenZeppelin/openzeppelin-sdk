---
id: crafty
title: Crafty
---

Have you ever wondered what may happen if you combined an Aragon token and fire? A fire-spewing eagle? Burnt chicken? What if Augur's oracles were augmented with Decentraland's tiles, would they start predicting the real estate market? Now, you no longer need to ponder at these vital questions: the Ethereum community will answer them for you!

In [Crafty](https://crafty.zeppelin.solutions), users can create new ERC20 tokens, with a few added goodies (following [EIP-1046](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1046.md)): a picture, and a short description. This allows for each token to have that extra bit of personality that makes something unique. But that's not all: the only way to get these tokens is by crafting them, which requires ingredients (any ERC20!) to be spent. And since the craftable tokens themselves can also be used as ingredients, the posibilities are endless! Not only that, but we'll make all of our contracts upgradeable, to be able to change the code in the future. Wohoo!

## Project setup

This guide will show you the process of making the contracts in the Crafty game upgradeable by using ZeppelinOS, which we'll install globally to have it available on all our projects.

```sh
npm install --global zos
```

See [here](setup.md) for more detailed setup info.

All snippets here were extracted from the public [Crafty repository](https://github.com/zeppelinos/crafty).

## Contracts

Crafty works with only two contracts:
* [`Crafty`](https://github.com/zeppelinos/crafty/blob/master/contracts/Crafty.sol) itself, containing the game logic (how new recipes are added, how crafting takes place, etc.) plus some role-based access control ([RBAC](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/zos-release/contracts/ownership/rbac/RBAC.sol), powered by [OpenZeppelin](https://openzeppelin.org/)), for admin tasks, such as deletion of tokens.
* The [`CraftableToken`](https://github.com/zeppelinos/crafty/blob/master/contracts/CraftableToken.sol)s, a simple extension of a mintable ERC20, which holds token creator data, a URI for metadata, and a list of required ingredients, along with the amounts of each.

To better see how these two contracts interact, take a look at `Crafty`'s `craft` method, where a user provides the address of a `CraftableToken` to craft, and `Crafty` makes sure the required ingredients are consumed before minting it.

```
function craft(CraftableToken _craftable) public {
  address player = msg.sender;

  uint256 totalSteps = _craftable.getTotalRecipeSteps();
  for (uint i = 0; i < totalSteps; ++i) {
    ERC20 ingredient;
    uint256 amountNeeded;
    (ingredient, amountNeeded) = _craftable.getRecipeStep(i);

    ingredient.transferFrom(player, address(this), amountNeeded);
  }

  _craftable.mint(player, 1);
}
```

## Developing with ZeppelinOS

So, how would we go about integrating ZeppelinOS in such a project? The process is remarkably simple: we'll cover it step by step. But before we get started, let's initialize our project with ZeppelinOS:

```sh
zos init Crafty
```

This will create a `zos.json` file, which will store how your project is structured in ZeppelinOS: you'll probably want to commit this file to your project's repository.


### Making Crafty upgradeable

There are multiple reasons to upgrade `Crafty`'s game logic contract: bug-fixing, adding new functionalities, adjusting to newer developments and ecosystem changes, etc. Remember how `Crafty` uses RBAC (role-based access control)? An upgrade could easily add new roles, such as a `curator` role, which would be in charge of approving new tokens before they are added to the game, or highlighting featured creations to be displayed on the front page. These simple but useful extensions would not be possible without ZeppelinOS.

`Crafty` is a great example of how easy it is to add upgradeability to your project. The only change that we need to make is a minor one: the constructor must be replaced for an `initialize` function.

```js
import 'openzeppelin-zos/contracts/ownership/rbac/RBAC.sol';
import 'zos-lib/contracts/migrations/Initializable.sol';

contract Crafty is RBAC, Initializable {
  
  // moved standard constructor logic to initializer function
  // function Crafty() public {
  //   addRole(msg.sender, ROLE_ADMIN);
  // }

  // Initializer for integration with ZeppelinOS
  function initialize(address _initialAdmin) isInitializer public {
    addRole(_initialAdmin, ROLE_ADMIN);
  }
  ...
}
```

The `isInitializer` modifier will make sure your `initialize` method is only called once in the whole lifetime of your contract. But you must remember to explicitly call it, since unlike constructors, `initialize` methods are not automatically called at contract creation.

Also, note how we are using `openzeppelin-zos`, instead of the usual `openzeppelin-solidity`. This package's contracts have been adapted for ZeppelinOS compatibility, and should be the ones used when dealing with upgradeable contracts.

Both `zos-lib` (for the `Initializable` contract) and `openzeppelin-zos` can be installed using [npm](https://www.npmjs.com/):

```sh
npm install zos-lib openzeppelin-zos
```

With the `initialize` change in place, we're all set to start using upgradeable instances of the `Crafty` contract! First, we `add` it to the project's contracts, and then `push` the compiled bytecode of the current version to the blockchain.

```sh
zos add Crafty
zos push --network ropsten --from $OWNER
```

The `from` parameter is important, since that address is the one that will be allowed to perform upgades to the contract.

We can now `create` new upgradeable instances, all of which will use the same deployed bytecode, but are entirely independent otherwise. The `initialize` function can be called in this same step (with the `initialAdmin` argument), saving you the need to do it manually.

```sh
zos create Crafty --init --args $OWNER --network ropsten
> 0x31C4B...
```

The returned value is the address of the newly `create`d `Crafty` upgradeable instance, which is already initialized and can be safely used, with the peace of mind that it can later be upgraded at any point in time.

### Making CraftableToken upgradeable

This scenario is a bit more complex, since multiple ZeppelinOS contracts are being combined together, but it is nonetheless fairly easy to setup. Let's first recap what a `CraftableToken` is:

1. It is detailed ERC20 token (i.e. has name and symbol)
1. It supports the [EIP-1046](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1046.md) extension of the ERC20 standard (i.e. we'll add a `tokenURI` parameter and variable)
1. It is mintable
1. It has additional storage of the token's ingredients, which require some validation

Luckily for us, OpenZeppelin provides contracts that will implement 1 and 3 for us: `DetailedERC20` and `MintableToken`. 2 and 4 we'll have to cover on our own, but the process barely differs from what it would look like without ZeppelinOS.

The EIP-1046 extension is straightforward: we'll inherit from OpenZeppelin's `DetailedERC20` and add the required variable to our contract. The only difference is, once again, that we need to define an `initialize` method instead of a constructor, and call our base contracts' `initialize` methods in it.

```
import 'openzeppelin-zos/contracts/token/ERC20/DetailedERC20.sol';

contract ExtendedERC20 is DetailedERC20 {
  string public tokenURI;

  function initialize(address _sender, string _name, string _symbol, uint8 _decimals, string _tokenURI) isInitializer('ExtendedERC20', '0') public {
    DetailedERC20.initialize(_sender, _name, _symbol, _decimals);
    tokenURI = _tokenURI;
  }
}
```

Since `DetailedERC20` already has the `isInitializer` modifier, we don't need to import it again. Note however, that we were required to supply two arguments: a contract name and a version id.

The additional storage and validations will be implemented in the `CraftableToken` contract itself, which will feature multiple inheritance. Again, all that needs to be done is to call the `initialize` method of all base contracts.

```
import 'openzeppelin-zos/contracts/token/ERC20/MintableToken.sol';
import './ExtendedERC20.sol';

contract CraftableToken is MintableToken, ExtendedERC20 {
  function initialize(address _owner, string _name, string _symbol, string _tokenURI, ERC20[] _ingredients, uint256[] _ingredientAmounts) isInitializer('CraftableToken', '0') public {
    MintableToken.initialize(_owner);
    ExtendedERC20.initialize(_name, _symbol, 0, _tokenURI);

    // Do custom validation on _ingredients and _ingredientAmounts, and store them
    ...
    }
  }
  ...
}
```

`initialize`'s arguments can be passed in JSON to `create`, so arrays are not an issue:

```sh
zos create CraftableToken --init --args "0x0cbd7..., \"Crafty Token\", \"CRFT\", \"https://path.to.metadata\", [0xd03ea..., 0x28a87...], [2, 4]" --network ropsten
> 0xaca94...
```

## Using our upgradeable contracts

All that remains is having our contracts interact with each other. We'll want `Crafty` to store the different `CraftableToken`s so that they can be later listed by a player of the game: let's look at two different ways this could be done.

First, we can have a player pass all of the arguments to a `Crafty` function, which will create a new `CraftableToken`, and add it to the list of tokens. Because this instance was not `create`d, it is not upgradeable. Note how we need to call `initialize`, since `CraftableToken` doesn't have a constructor anymore.

```js
function addCraftable(string _name, string _symbol, string _tokenURI, ERC20[] _ingredients, uint256[] _ingredientAmounts) public returns (CraftableToken) {
  require(_ingredients.length == _ingredientAmounts.length);
  require(_ingredients.length > 0);

  CraftableToken newCraftable = new CraftableToken();
  newCraftable.initialize(address(this), _name, _symbol, _tokenURI, _ingredients, _ingredientAmounts);

  craftables.push(newCraftable);

  emit CraftableAdded(newCraftable);

  return newCraftable;
}
```

What if we wanted to use the upgradeble instances we have `create`d with `zos`? We'll let admins add them into the game by simply providing the address of the contract.

```
function addPrecreatedCraftable(CraftableToken _craftable) onlyRole(ROLE_ADMIN) public {
  craftables.push(_craftable);
  emit CraftableAdded(_craftable);
}
```

A key point here is that both the upgradeable and non-upgradeable instances are treated in the same manner: `Crafty`'s `craft` method makes no distinction whatsoever when calling `CraftableToken` methods, since the interface is the same. A contract being upgradeable places no extra burden on its callers.

This example shows how to add upgradeability and use of on-chain standard libraries to a fairly complex smart contract app without too much work. Congratulations!
