---
id: upgrading
title: Upgrading your project
---

At the end of the [previous guide](deploying) we deployed a ZeppelinOS
project with one contract. Here is the code of the contract, to keep it fresh
on our minds:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;
  string public s;

  function initialize(uint256 _x, string memory _s) initializer public {
    x = _x;
    s = _s;
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

> If any of the following commands fail with an `A network name must be provided 
to execute the requested action` error, it means our session has expired. 
In that case, renew it by running the command `npx zos session --network local 
--from 0x1df62f291b2e969fb0849d99d9ce41e2f137006e --expires 3600` again.

Now let's create an upgradeable instance of this contract so you can 
experiment with what this is all about:

```console
npx zos create MyContract --init initialize --args 42,hitchhiker
```

The `npx zos create` command receives an optional `--init [function-name]`
parameter to call the initialization function after creating the contract,
and the `--args` parameter allows you to pass arguments to it. This way, you
are initializing your contract with `42` as the value of the `x` state
variable and `hitchhiker` as the value of the `s` state variable.

This command will print the address of your contract, and it will update the
`zos.dev-<network_id>.json` file.

> **Note**: When calling an initializer with many variables, these should be
> passed as a comma-separated list, with no spaces in between.

We can start a console to interact with our contract and check that it has been properly initialized:

```console
npx truffle console --network local
```

Once in the Truffle console, execute the following instructions to test 
that our instance is working as expected:

> _Make sure you replace <your-contract-address> with the address returned 
by the `create` command we ran above._

```console
truffle(local)> myContract = MyContract.at('<your-contract-address>')
truffle(local)> myContract.x().then(x => x.toString())
'42'

truffle(local)> myContract.s()
"hitchhiker"
```

You can now exit the Truffle console and continue with the following steps.

## Upgrading the contract

Remember that for this guide we are using a [ganache](https://truffleframework.com/docs/ganache/quickstart) 
local development network. Do not stop the `ganache-cli` command that [we ran before](deploying.md#deploying-your-project), 
or you will lose your previous deployment!

Now, let's say we found an issue on our contract, or maybe we just want to
extend its functionalities.

Open `contracts/MyContract.sol`, and add a new function:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;
  string public s;

  function initialize(uint256 _x, string memory _s) initializer public {
    x = _x;
    s = _s;
  }

  function increment() public {
    x += 1;
  }
}
```

> **Note**: While ZeppelinOS supports arbitrary changes regarding functionality,
> you will need to preserve all the variables that appeared in previous versions of
> your contracts, declaring any new variables below the already existing ones.
> All the considerations and some recommendations for your upgrades are
> explained in the [Writing upgradeable contracts](writing_contracts.md) page.

Once you have saved these changes, push the new code to the network:

```console
npx zos push
```

Finally, let's update the already deployed contract with the new code:

```console
npx zos update MyContract
```

You will see that this command prints the same contract address as before, 
and a logic contract address that is new. This is all the magic behind
upgrades: we have two contracts, one is the contract address that we will 
never change, but it just serves as a proxy to the logic contract that we 
can replace with new versions.

We can start a new Truffle console to interact with our contract and check 
that it has been properly upgraded:

```console
npx truffle console --network local
```

Once in the Truffle console, execute the following instructions to try 
the new functionality we've just added:

> _Make sure you replace <your-contract-address> with the address of the 
upgradeable instance your created of `MyContract`. This address was 
returned by the `create` command we ran in the previous section, which
is the same as the one returned by the `update` command we ran above._

```console
truffle(local)> myContract = MyContract.at('<your-contract-address>')
truffle(local)> myContract.increment()
truffle(local)> myContract.x().then(x => x.toString())
43
```

Now let's imagine that instead of just adding a new 
function to the contract (a change to functionality), we wanted to add a new 
variable `t` to our contract. But how do we set the initial value of `t`?
The variables `x` and `s` were initialized with the `initialize` function,
which was called when the proxy was created via the `zos create MyContract --init initialize --args ...` 
command. Naturally, the solution would be to add the initialization of `t`
to the end of the initialize function: 

```
function initialize(uint256 _x, string memory _s, uint256 _t) initializer public {
  x = _x;
  s = _s;
  t = _t;
}
```

That would be fine for newly deployed instances of MyContract, but it wouldn't work for one that 
has allready been deployed, and is instead being updated. We cannot call the same `initialize` function, because
the `Initializable` modifier guards it against being called more than once. We need a new function. 

The `update` command also accepts `--init` and `--args` parameters, so we can use a function
with it to initialize the new variable. A good name for the 
new function could be something like `initializeT` or `initializeVersion2`. This function would simply
set the initial value of `t` and check that it has not yet been initialized. It should be called with `zos update MyContract --init initializeT --args 99`.

```
function initializeT(uint256 _t) public {
  require(_t == 0);
  t = _t;
}
```

This initialization validation for `t`, of course, would only make sense if `t` cannot be zero. 

The resulting code would be:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;
  string public s;
  uint256 public t;

  function initialize(uint256 _x, string memory _s, uint256 _t) initializer public {
    x = _x;
    s = _s;
    t = _t;
  }

  function initializeT(uint256 _t) public {
    require(_t == 0);
    t = _t;
  }

  function increment() public {
    x += 1;
  }
}
```

Upgrades are only one of the features of ZeppelinOS. Next, we will see another
very interesting feature, because it allows us to reuse packages that have been
already deployed to the blockchain.
