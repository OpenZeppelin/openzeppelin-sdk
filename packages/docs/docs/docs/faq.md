---
id: faq
title: Frequently asked questions
---

## Is it safe to upgrade a contract compiled with a version of Solidity to another compiled with a different version?

Yes. The Solidity team guarantess that the compiler [preserves storage layout among versions](https://twitter.com/ethchris/status/1073692785176444928).

## Is it possible to specify which Solidity compiler version to use in ZeppelinOS?

Yes. As of ZeppelinOS version 2.1, you can specify which compiler version to use in `truffle.js`, as you do with Truffle (version 5):

```
module.exports = {
  networks: {
    ... etc ...
  },
  compilers: {
     solc: {
       version: <string>  // example:  "0.4.24" or "0.5.0"
     }
  }
}
```

## Why are my getting the error "Cannot call fallback function from the proxy admin"?

This is due to the [transparent proxy pattern](https://docs.zeppelinos.org/docs/pattern.html#transparent-proxies-and-function-clashes). You shouldn't get this error when using ZeppelinOS via de CLI, because ZeppelinOS uses the ProxyAdmin contract. More info in the [What's new in ZeppelinOS 2.2](https://docs.zeppelinos.org/docs/new_2.2.html) section of the documentation.

However, if you are using ZeppelinOS programmatically, you could run into such error. The solution is to always interact with your proxies from an account that is not the admin of the proxy, unless of course you want to specifically call functions of the proxy itself.
