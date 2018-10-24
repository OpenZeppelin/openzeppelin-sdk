---
id: version-2.0.0-safety
title: Safety Checks
original_id: safety
---

The ZeppelinOS CLI performs a series of safety checks in some of its commands with the purpose of strengthening the security of your projects. For example, the `zos add` command can detect if a contract has a `constructor`, or contains usages of `selfdestruct` or `delegatecall`. Below is a list of some of the checks made, along with the reasoning behind why they are considered to be security risks.

**Some validation examples:**
* constructor check: Proxied contracts should use initializer functions instead of constructors. For more info, see [Initializers vs. constructors](https://docs.zeppelinos.org/docs/advanced.html#initializers-vs-constructors) in this page.
* selfdestruct check: Solidity's `selfdestruct` keyword ends the execution of a contract, destroys it, and sends all of its funds to a specified account. This is a very delicate action to take, and can expose a contract to vulnerabilities such as the [second Parity Wallet hack](https://blog.zeppelinos.org/parity-wallet-hack-reloaded/). It should be used with extreme care.
* delegatecall check: The `delegatecall` keyword fully exposes a contract's state to a 3rd party contract. Such a contract has complete control on the calling contract. It should only be used if you really know [hat you're doing.

When such validation checks fail, the ZeppelinOS CLI will not performs any actions unless the `--force` option is used. If so, the CLI will perform the actions and try to remember your choice in future occasions.
