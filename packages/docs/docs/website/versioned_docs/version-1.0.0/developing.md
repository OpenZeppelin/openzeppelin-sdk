---
id: version-1.0.0-developing
title: Developing a new standard library
sidebar_label: Developing stdlibs
original_id: developing
---

Any developer can publish new ZeppelinOS stdlib releases. The `zos` command allows developers to go through this process seamlessly, by creating packages that handle the different versions of the stdlib. 

The first step is creating a standard library package with the following command:
```sh
zos init --lib <package-name>
```
Initializing the package will create a `zos.json` file that tracks the contracts included in the standard library release. After this first step, the desired contracts can be added to the package through:
```sh
zos add <contract-name-1> <contract-name-2> ... <contract-name-n>
```

Finally, we need to deploy the `Package`, the specific `Release` of the stdlib, and the individual library contracts. All of this is accomplished by doing:
```sh
zos push --network=<network>
```
This completes the deployment of the new stdlib release to the chosen network. 

Do this for every network you want to support in your stdlib release, and publish it on `npm` with the same name you used in the `zos init` command.

Once it's published, send your standard library package name to other developers to get them to use it! (by running `zos link` with your package name)
