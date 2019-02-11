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
