---
id: faq
title: Frequently asked questions
---

## Is it safe to upgrade a contract compiled with a version of Solidity to another compiled with a different version?

Yes. The Solidity team guarantess that the compiler [preserves storage layout among versions](https://twitter.com/ethchris/status/1073692785176444928).

## Is it possible to specify which Solidity compiler version to use in the OpenZeppelin SDK?

Yes. You can run `openzeppelin compile --solc-version 5.X` to compile your contracts with a specific Solidity compiler version. This choice will be saved to `.openzeppelin/project.json` for future runs.
```
{
  "manifestVersion": "2.2",
  "name": "my-project",
  "version": "1.0.0",
  "compiler": {
    "manager": "openzeppelin",
    "solcVersion": "0.5.9"
  }
}
```

If you are using `truffle` for compiling your project,, you can specify which compiler version to use in your `truffle.js` or `truffle-config.js` file, as you do normally in a truffle 5+ project:

```
module.exports = {
  compilers: {
     solc: {
       version: "0.5.9"
     }
  }
}
```

## Why are my getting the error "Cannot call fallback function from the proxy admin"?

This is due to the [transparent proxy pattern](pattern#transparent-proxies-and-function-clashes). You shouldn't get this error when using the OpenZeppelin SDK via its CLI, since it relies on the `ProxyAdmin` contract for managing your proxies.

However, if you are using the OpenZeppelin SDK programmatically, you could run into such error. The solution is to always interact with your proxies from an account that is not the admin of the proxy, unless you want to specifically call functions of the proxy itself.

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

You can create upgradeable instances from Solidity code by using your project's App contract, and then calling its `create` function from Solidity. Note that to be able to do this, your project needs to be published, i.e. it needs to have the OpenZeppelin SDK [Contracts Architecture](architecture) enabled.

To see an example of how this is done, please refer to the example project [creating-instances-from-solidity](https://github.com/OpenZeppelin/openzeppelin-sdk/tree/master/examples/creating-instances-from-solidity).