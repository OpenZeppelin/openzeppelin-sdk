---
id: version-2.2.0-faq
title: Frequently asked questions
original_id: faq
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

## How do I use ES6 Javascript syntax in my tests?

First, make sure you add the following dev-dependencies to your project: `babel-polyfill`, `babel-register`, `babel-preset-es2015`, `babel-preset-stage-2` and `babel-preset-stage-3`.
`npm install --save-dev babel-polyfill babel-register babel-preset-es2015 babel-preset-stage-2 babel-preset-stage-3`
Next, create a `.babelrc` file at the root of your repo, containing:

```
{
  "presets": ["es2015", "stage-2", "stage-3"]
}
```

Finally, make sure your `truffle-config.js` file contains the following lines at the beginning of the file:

```
require('babel-register');
require('babel-polyfill');
```

## How can I create an upgradeable instance from Solidity code?

You can create upgradeable instances from Solidity code by using your project's App contract, and then calling its `create` function from Solidity. Note that to be able to do this, your project needs to be published, i.e. it needs to have the ZeppelinOS [Contracts Architecture](https://docs.zeppelinos.org/docs/architecture.html) enabled.

To see an example of how this is done, please refer to the example project [creating-instances-from-solidity](https://github.com/zeppelinos/zos/tree/master/examples/creating-instances-from-solidity).