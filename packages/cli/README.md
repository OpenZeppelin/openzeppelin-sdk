# zeppelin_os command line interface
[![Build Status](https://travis-ci.org/zeppelinos/zos-cli.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-cli)

## Managing a project with zeppein_os

### Install

```
$ npm install zos --save
```

By now, zeppelin_os cli tool runs on top of truffle exec. Then, it requires to have a truffle.js file including the
networks configurations you will use for your project. 

### Setup your project 

Initialize your project with zeppelin_os, the next command will create a new package.zos file:

```
$ zos init [NAME] [VERSION] --network [NETWORK]
```

### Add your contracts implementations

The next step is to register all the contract implementations of the current `version` of your project. It is important
to keep your `package.zos.json` file up-to-date. To do this please run:  

```
$ zos add-implementation [CONTRACT_NAME_1] [ALIAS_2] --network [NETWORK]
$ zos add-implementation [CONTRACT_NAME_2] [ALIAS_2] --network [NETWORK]
$ ...
$ zos add-implementation [CONTRACT_NAME_N] [ALIAS_N] --network [NETWORK]
```

Where [CONTRACT_NAME] is the name of your Solidity contract, and [ALIAS] is the name under which it will be registered 
in zeppelin_os. 

### Sync your project with the blockchain 

This command will create a new application manager. This is the contract that handles all the versions of your project
contracts. This command will deploy each registered contract implementation to the requested network, and will packaged
them using the `version` property of your `package.zos.json` file:

```
$ zos sync --network [NETWORK]
```

Note that if you never synced your project with the requested network, a new `package.zos.<network>.json` should have
been created. This file will reflect the status of your project in that network.

### Create a new contract proxy 

The next command will deploy a new proxy to make your contract upgradeable. All these proxies will be held in your 
`package.zos.<network>.json` file:

```
$ zos create-proxy [ALIAS_1] --network [NETWORK]
$ zos create-proxy [ALIAS_2] --network [NETWORK]
...
$ zos create-proxy [ALIAS_N] --network [NETWORK]
``` 

### Add a new version 

To add a new version of your project, you will have to register it first. To do so run:
```
$ zos new-version [NEW_VERSION]
```

This command will update the `version` property of your `package.zos.json` file and reset its contracts list. 
Therefore, you will have to add the corresponding contract implementations to be included in it, as you did in the 
[third step](https://github.com/zeppelinos/zos-cli#add-your-contracts-implementations):

```
$ zos add-implementation [CONTRACT_NAME_1] [ALIAS_2] --network [NETWORK]
$ zos add-implementation [CONTRACT_NAME_2] [ALIAS_2] --network [NETWORK]
$ ...
$ zos add-implementation [CONTRACT_NAME_N] [ALIAS_N] --network [NETWORK]
```

Let's sync the new version of your project to the blockchain running: 

```
$ zos sync
```

Now the new version of your project has been updated in your application manager. Finally, you just need to upgrade 
all your contract proxies: 

```
$ zos upgrade-proxy [ALIAS_1] --network [NETWORK]
$ zos upgrade-proxy [ALIAS_2] --network [NETWORK]
...
$ zos upgrade-proxy [ALIAS_N] --network [NETWORK]
```

## Registering and vouching zeppelin_os releases
TODO!
