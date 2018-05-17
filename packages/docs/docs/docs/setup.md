---
id: setup
title: Setup
---

The following steps will get you started using ZeppelinOS.

## Installation

`zos` is the command line interface to ZeppelinOS. To install it, run:

    npm install --global zos

## Set up the application

`zos` integrates with Truffle. To set it up, run:

    npm install --global truffle
    mkdir myproject && cd myproject
    truffle init

You now need to initialize the `npm` project with:

    npm init

Finally, to initialize the `zos` application, run:

    zos init myproject 0.0.1

This will create a `package.zos.json` file, which will contain all the information about your project. 

You are now ready to start developing your application. If you want to build an upgradeable application using ZeppelinOS, please follow our [Building upgradeable applications](building-upgradeable.md) guide. If instead you want to build an app that uses the on-chain libraries provided by ZeppelinOS, follow instead our [Using the stdlib in your app](building-stdlib.md) guide. Of course, you can also do both, as exemplified in our [Basil](basil.md) demo. 



