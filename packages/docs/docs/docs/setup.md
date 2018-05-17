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

You are now ready to start developing your application. To build an upgradeable application using ZeppelinOS, please follow our next guide, [Building upgradeable applications](building-upgradeable.md).



