---
id: proxies
title: Proxy Pattern
---

This article describes the "unstructured storage" proxy pattern, the fundamental building block of ZeppelinOS's contract upgradeability feature.

Note: For a more in depth read, please see [blog.zeppelinos.org/proxy-patterns](https://blog.zeppelinos.org/proxy-patterns/), which discusses the need for proxies, goes into more technical detail on the subject, elaborates on other possible proxy patterns that were considered for zOS, and more.

## Why upgradeability?

By design, smart contracts are immutable. On the other hand, software quality heavily depends on the ability to upgrade and patch source code in order to make iterative releases. Even though blockchain based software profits signifficantly from the technology's immutability, still a certain degree of mutability is needed for bugfixing and potential product improvements. ZeppelinOS solves this apparent contradiction by providing an easy to use, simple and robust upgrade mechanism for smart contracts that can be controlled by any type of governance, be it a multi-sig wallet, a simple address or a complex DAO.

## Upgradeability via the proxy pattern

The basic idea behind using the proxy pattern to solve the problem of pugradeability, is to use two contracts instead of one. The first contract is a simple wrapper or "proxy" which users interact with directly and is in charge of forwarding transactions to and from the second contract, which contains the logic of the pair. The key concept to understand is that the logic contract can be replaced while the proxy is never changed. Both contracts are still immutable, in the sense that their code cannot be changed, but the logic contract can simply be swapped by another. The wrapper can thus point to a different logic implementation and in doing so, the software is "upgraded".

## Proxy forwarding

The most immediate problem that proxies need to solve is how the proxy exposes the entire interface of the logic contract without requiring a one to one mapping of the entire logic contract's interface. This would be difficult to maintain, prone to errors, and would make the interface itself not upgradeable. Hence, a dynamic forwarding mechanism is required. The basics of such mechanism can be summarized in the code below:

```
assembly {
    let ptr := mload(0x40)
    calldatacopy(ptr, 0, calldatasize)
    let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
    let size := returndatasize
    returndatacopy(ptr, 0, size)

    switch result
    case 0 { revert(ptr, size) }
    default { return(ptr, size) }
 }
 ```

This code can be put in the fallback function of a proxy, and will forward any call to any function with any set of parameters to the logic contract without it needing to know anything in particular of the logic contract's interface. In essence, (1) the `calldata` is copied to memory, (2) the call is forwarded to the logic contract, (3) the return data from the call to the logic contract is retrieved, and (4) the returned data is forwarded back to the caller.

A very important thing to note is that the code makes use of `delegatecall` which executes the callee's code in the context of the caller's state. That is, the logic contract controls the proxy's state and the logic contract's state is meaningless. Thus, the proxy doesn't forward transactions to and from the logic contract, but also represents the pair's state. The state is in the proxy and the logic is in the particular implementation that the proxy points to. To put it in yet another way, the "what" is in the proxy contract and the "how" is in the logic contract.

TODO: add diagram

## Unstructured storage proxies

A problem that quickly comes up when using proxies has to do with the way in which variables are stored in the proxy contract. Suppose that the proxy stores the logic contract's address in it's only variable `address public _implementation;`. Now, suppose that the logic contract is a basic token whose first variable is `address public _owner`. Both variables are 32 byte in size, and as far as the EVM knows, occupy the first slot of the resulting execution flow of a proxied call. When the logic contract writes to `_owner`, it does so in the scope of the proxy's state, and thus really writes to `_implementation`.

There are many ways to overcome this problem, and the "unstructured storage" approach which ZeppelinOS implements works as follows. Instead of storing the `_implementation` address at the proxy's first storage slot, it chooses a pseudo random slot instead. This slot is sufficiently random, that the probability of a logic contract declaring a variable at the same slot is negligible. The same principle of randomizing slot positions in the proxy's storage is used in any other variables the proxy may have such as an admin address (that is allowed to update the value of `_implementation`), etc.

An example of how the randomized storage is achieved:

```
bytes32 private constant implementationPosition = keccak256("org.zeppelinos.proxy.implementation");
```

As a result, a logic contract doesn't need to care about overwritting any of the proxy's variables.

TODO: add diagrams 

## Storage collisions

Despite the unstructured storage's approach on avoiding collisions between the logic contract's variables and the proxy's variables, storage collisions between different versions of the logic contracts' variables can occur. In this case, imagine that the first implementation of the logic contract stores `address public _owner` at the first storage slot and a logic contract that replaces it on an upgrade stores `address public _lastContributor` at the same first slot. When the updated logic attempts to write to `_lastContributor` it will be using the same storage position where the previous value for `_owner` was being stored and hence overwrite it.

The unstructured storage proxy mechanism doesn't safeguard against this. It is up to the user to have new versions of a logic contract extend previous versions, or otherwise guarantee that the storage hirarchy is always appended to but not changed. ZeppelinOS' CLI does however detect such collisions, and warns the developer about them.

TODO: add diagrams 

## The constructor caveat

TODO
