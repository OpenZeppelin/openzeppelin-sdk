---
id: quickstart
title: Quickstart
---

The following guide will get you up and running with ZeppelinOS.

## Installation

`zos` is the command line interface to ZeppelinOS. To install it, run:

    npm install --global zos

## Set up the application

`zos` integrates with Truffle. To set it up, run:

    npm install --global truffle
    mkdir myproject && cd myproject
    truffle init

To initialize the `zos` application, run:

    zos init myproject 0.0.1

## Write smart contracts

Write the contracts as you would normally do, but replacing constructors with
`initialize` functions using the modifier from `zos-lib`. To install the lib:

    npm install zos-lib

A simple contract would look like this:

    import "zos-lib/contracts/migrations/Migratable.sol";

    contract MyContract is Migratable {
      uint256 public x;

      function initialize(uint256 _x) isInitializer("MyContract", "0") public {
        x = _x;
      }
    }

Compile it with:

    npx truffle compile

## Use ZeppelinOS to make your contracts safer and easier to develop

Register all the contract implementations of the first version of your
project running:

    zos add <contract_name_1>
    zos add <contract_name_2>
    ...
    zos add <contract_name_n>

In our example, run:

    zos add MyContract

Push your application to the network running:

    zos push --network <network>

Create upgradeability proxies for each of your contracts with:

    zos create <contract_name_1> --network <network>
    zos create <contract_name_2> --network <network>
    ...
    zos create <contract_name_n> --network <network>

This command takes an optional `--init` flag to call an initialization/migration
function after you create the proxy.

In our simple example we want to call the initialize function, with some value
(e.g: 42) thus:

    zos create MyContract --init initialize --args 42 --network development

Re-use already deployed contracts from a ZeppelinOS standard library. To do so,
run the `link` command, with the name of the npm package of the stdlib you
want to use. For example:

    zos link openzeppelin-zos

Push the application to connect it with the chosen standard library on the
target network:

    zos push --network <network>

Update the smart contracts' code to fix a bug, add a new feature, etc. After
making the changes, compile and push them:

    npx truffle compile
    zos push --network <network>

And upgrade the already deployed proxies:

    zos upgrade <contract_name_1> --network <network>
    zos upgrade <contract_name_2> --network <network>
    ...
    zos upgrade <contract_name_n> --network <network>

In our simple example:

    zos upgrade MyContract --network development

The address is the same as before, but the code has been changed to the latest
version.

Voilà! With this, your contracts can be linked to standard libraries and can be
easily upgraded.

You can also see [all the available commands of zos](TODO link) and play with
our demos [Basil](TODO link) and [Crafty](TODO link).
