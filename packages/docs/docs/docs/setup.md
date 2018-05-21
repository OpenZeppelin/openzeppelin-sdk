---
id: setup
title: Installation and setup
---

The following steps will get us started using ZeppelinOS.

## Installation

`zos` is the [command line interface](https://github.com/zeppelinos/zos-cli) to ZeppelinOS. To install it, let's go to our terminal and run:

```sh
npm install --global zos
```

## Setting up our application

`zos` integrates with [Truffle](http://truffleframework.com/), install it with:

```sh
npm install --global truffle
```

Next we set up the truffle project:

```sh
mkdir myapp
cd myapp
truffle init
npm init
```

Finally, we initialize our `zos` application:

```sh
zos init myapp
```

This will create a `zos.json` file, which will contain all the information about our application. For more information about this file, please see the [advanced topics](advanced.md#format-of-zosjson-and-zos-network-json-files) section. 

We are now ready to start [developing our upgradable application](building.md).