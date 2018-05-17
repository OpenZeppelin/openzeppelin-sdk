---
id: advanced
title: Advanced topics
---

We expand on several advanced topics for the more intrepid users of ZeppelinOS. 

## Preserving the storage structure
As mentioned in the [Building upgradeable applications](building-upgradeable.md) guide, when upgrading your contracts, you need to make sure that all variables declared in prior versions are kept in the code. New variables must be declared below the previously existing ones, as such:

    contract MyContract_v1 {
      uint256 public x;
    }

    contract MyContract_v2 {
      uint256 public x;
      uint256 public y;
    }

Note that this must be so _even if you no longer use the variables_. There is no restriction (apart from gas limits) on including new variables in the upgraded versions of your contracts, or on removing or adding functions. 

This necessity is due to how [Solidity uses the storage space](https://solidity.readthedocs.io/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage). In short, the variables are allocated storage space in the order they appear (for the whole variable or some pointer to the actual storage slot, in the case of dynamically sized variables). When we upgrade a contract, its storage contents are preserved. This entails that if we remove variables, the new ones will be assigned storage space that is already occupied by the old variables; all we would achieve is losing the pointers to that space, with no guarantees on its content.

## Initializers vs. constructors
As we saw in the [Building upgradeable applications](building-upgradeable.md) guide, we did not include a constructor in our contracts, but used instead an `initialize` function. The reason for this is that constructors do not work as regular functions: they are invoked once upon a contract's creation, but their code is never stored in the blockchain. This means that they cannot be called from the contract's proxy as we call other functions. Thus, if we want to initialize variables in the _proxy's storage_, we need to include a regular function for doing so. 

The ZeppelinOS CLI provides a way for calling this function and passing it the necessary arguments when creating the proxy:
    
    zos create MyContract --init <initializingFunction> --args <arguments> --network <network>

where `<initializingFunction>` is the name of the initializing function (marked with an `isInitializer` modifier in the code), and `<arguments>` is a comma-separated list of arguments to the function. 

## Format of `zos.json` and `zos.<network>.json` files

