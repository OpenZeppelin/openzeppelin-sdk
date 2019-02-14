---
id: version-2.1.0-mainnet
title: Deploying to mainnet
original_id: mainnet
---

The [guide about Deploying your first project](deploying.md) explains how to
deploy a project to a local network, which is very good for testing.
Once you are happy with your initial contracts, you can deploy them to mainnet
using the `--network` flag.

This flag takes the network details from the Truffle configuration file. You
can use Infura to connect to mainnet, with a `truffle-config.js` like this one:

```js
'use strict';

var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "orange apple banana ... ";

module.exports = {
  networks: {
    mainnet: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/<INFURA_Access_Token>")
      },      
      gas: 5000000,
      gasPrice: 5e9,
      network_id: 1
    }
  }
};
```

Make sure to replace the `mnemonic` with the one you used to generate your
accounts, and change `<INFURA_Access_Token>` to your token.

Install the `truffle-hdwallet-provider` module with:

```console
npm install truffle-hdwallet-provider
```

And now you can run `zos` commands in mainnet. For example:

```console
zos push --network mainnet
```


This will use your first account generated from the mnemonic. If you want to
specify a different account, use the `--from` flag.

Here you will find a
[guide with more details about configuring Truffle to use Infura](http://truffleframework.com/tutorials/using-infura-custom-provider).

You can use other test networks like ropsten to further test your contracts
before pushing them to mainnet. But remember that now your contracts are
upgradeable! Even if you find a bug after deploying them to mainnet, you will
be able to fix it without losing the contract state and in a way that's
transparent for your users.
