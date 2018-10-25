---
id: version-2.0.0-upgrading
title: Upgrading your project
original_id: upgrading
---

At the end of the [previous guide](deploying) we deployed a ZeppelinOS
project with one contract. Here is the code of the contract, to keep it fresh
on our minds:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;

  function initialize(uint256 _x) initializer public {
    x = _x;
  }
}
```

This is a traditional immutable contract that will remain frozen for ever on
the blockchain, with mistakes, limited functionalities and everything.
ZeppelinOS lets us opt-in to allow upgrades on our contracts, and open the
doors to a more sustainable process for developing our projects. With upgrades
we can make iterative releases, quickly adding small pieces of functionalities
that we can adjust according to the always changing goals of our users; and of
course, we can add fixes for any bugs we introduced on previous iterations. And
just as with any other contract on the blockchain, we can define governance
mechanisms to decide when and how to upgrade the contracts, that can be manual,
automated, or any combination of both that will earn the trust of our users.

Let's make an upgradeable instance of this contract so you can experiment what
this is all about:

```console
NODE_ENV=test zos create MyContract --init initialize --args 42 --network local
```

The `zos create` command receives an optional `--init [function-name]`
parameter to call the initialization function after creating the contract,
and the `--args` parameter allows you to pass arguments to it. This way, you
are initializing your contract with `42` as the value of the `x` state
variable.

This command will print the address of your contract, and it will update the
`zos.local.json` file.

> **Note**: When calling an initializer with many variables, these should be
> passed as a comma-separated list, with no spaces in between.

## Upgrading the contract

Remember that for this guide we are using a local development network. Do not
stop the `truffle develop` command that we ran before, or you will lose your
previous deployment!

Now, let's say we found an issue on our contract, or maybe we just want to
extend its functionalities.

Open `contracts/MyContract.sol`, and add a new function:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;

  function initialize(uint256 _x) initializer public {
    x = _x;
  }

  function increment() public {
    x += 1;
  }
}
```

> **Note**: while ZeppelinOS supports arbitrary changes in functionality,
> you will need to preserve all variables that appear in prior versions of
> your contracts, declaring any new variables below the already existing ones.
> All the considerations and some recommendations for your upgrades are
> explained in the [Writing upgradeable contracts](writing_contracts.md) page.

Once you have saved the changes, push the new code to the network:

```console
NODE_ENV=test zos push --network local
```

Finally, let's update the already deployed contract with the new code:

```console
NODE_ENV=test zos update MyContract --network local
```

You will see that this command prints the same contract address as before, and a logic contract address that is new. This is all the magic behind
upgrades: we have two contracts, one has an address that we will never change, but it just serves as a proxy to the other contract that we can replace with
new versions.

To try the new function we just added, jump to the terminal where the Truffle
command is running and execute the following instructions:

```console
truffle(local)> myContract = MyContract.at(<your-contract-address>)
truffle(local)> myContract.increment()
truffle(local)> myContract.x()
43
```

Upgrades are only one of the features of ZeppelinOS. Next, we will see another
very interesting feature, because it allows us to reuse packages that have been
already deployed to the blockchain.
