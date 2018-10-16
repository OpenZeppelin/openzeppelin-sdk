---
id: developing
title: Developing a new EVM package
sidebar_label: Developing EVM packages
---

Any developer can publish new ZeppelinOS EVM packages. The `zos` command allows developers to go through this process seamlessly, as well as managing different versions of the package. 

The first step is creating the package with the following command:
```sh
zos init --lib <package-name>
```
Initializing the package will create a `zos.json` file that tracks the contracts included in it. After this first step, the desired contracts can be added to the package through:
```sh
zos add <contract-name-1> <contract-name-2> ... <contract-name-n>
```

Finally, we need to deploy the `Package`, the specific `Release` of the EVM package, and the individual library contracts. All of this is accomplished by doing:
```sh
zos push --network=<network>
```
This completes the deployment of the new EVM package release to the chosen network. 

Do this for every network you want to support your EVM package in, and publish it on `npm` with the same name you used in the `zos init` command.

Once it's published, send your EVM package name to other developers to get them to use it! (by running `zos link` with your package name)
