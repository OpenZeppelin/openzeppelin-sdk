---
id: setup
title: Installation and setup
---

The following steps will get you started using ZeppelinOS.

## Installation

`zos` is the [command line interface](https://github.com/zeppelinos/zos-cli) to ZeppelinOS. To install it, go to your terminal and run:

```sh
npm install --global zos
```

## Setting up your application

Initialize your `zos` application with:

```sh
mkdir my-app && cd my-app
npm init
zos init my-app
```

This creates a `zos.json` file, which contains all the information about your application. For details about this file format, please see the [advanced topics](advanced.md#format-of-zosjson-and-zos-network-json-files) section. 

You are now ready to [start building your upgradable application](building.md).
