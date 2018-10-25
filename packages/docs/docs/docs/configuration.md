---
id: configuration
title: Configuration Files
---

ZeppelinOS's CLI generates `json` files where it stores the configuration of your project.


## `zos.json`
The first file stores the general configuration and is created by the `zos init` command. It has the following structure:

```json
{
  "name": <projectName>
  "version": <version>
  "contracts": {
    <contract-1-alias>: <contract-1-name>,
    <contract-2-alias>: <contract-2-name>,
    ...
    <contract-N-alias>: <contract-N-name>
  },
  "stdlib": {
    "name": <stdlibName>
  }
}
```

Here, `<projectName>` is the name of the project, and `<version>` is the current version number. Once you start adding your contracts via `zos add`, they will be recorded under the `"contracts"` field, with the contract aliases as the keys (which default to the contract names), and the contract names as the values. Finally, if you link an `stdlib` with `zos link`, this will be reflected in the `"stdlib"` field, where `<stdlibName>` is the name of the linked `EVM Package`.


## `zos.<network>.json`
ZeppelinOS will also generate a file for each of the networks you work on (`local`, `ropsten`, `live`, ... These should be configured [in your `truffle.js` file](http://truffleframework.com/docs/advanced/configuration#networks), but note that `zos init` already configures the `local` network, which can be run by `npx truffle develop`). These files share the same structure:

```json
{
  "contracts": {
    <contract-1-name>: {
      "address": <contract-1-address>,
      "bytecodeHash": <contract-1-hash>
    },
    <contract-2-name>: {
      "address": <contract-2-address>,
      "bytecodeHash": <contract-2-hash>
    },
    ...
    <contract-N-name>: {
      "address": <contract-N-address>,
      "bytecodeHash": <contract-N-hash>
    }
  },
  "proxies": {
    <contract-1-name>: [
        {
          "address": <proxy-1-address>,
          "version": <proxy-1-version>,
          "implementation": <implementation-1-address>
        }
      ],
      <contract-2-name>: [
        {
          "address": <proxy-2-address>,
          "version": <proxy-2-version>,
          "implementation": <implementation-2-address>
        }
      ],
      ...
      <contract-N-name>: [
        {
          "address": <proxy-N-address>,
          "version": <proxy-N-version>,
          "implementation": <implementation-N-address>
        }
      ]
  },
  "app": {
    "address": <app-address>
  },
  "version": <app-version>,
  "package": {
    "address": <package-address>
  },
  "provider": {
    "address": <provider-address>
  },
  "stdlib": {
    "address": <stdlib-address>,
    ["customDeploy": <custom-deploy>]
    "name": <stdlib-name>
  }
}
```

The most important thing to see here are the proxies and contracts' addresses, `<proxy-i-address>` and `<contract-i-address>` respectively. What will happen is that each time you upgrade your contracts, `<contract-i-address>` will change, reflecting the underlying logic contract change. The proxy addresses, however, will stay the same, so you can interact seamlessly with the same addresses as if no change had taken place. Note that `<implementation-i-address>` will normally point to the current contract address `<contract-i-address>`. Finally, `<contract-i-hash>` stores a SHA256 hash of the contract bytecode.

Another thing to notice in these files are the version numbers. The `<appVersion>` keeps track of the latest app version, and matches `<version>` from `zos.json`. The `<proxy-i-version>`s, on the other hand, keep track of which version of the contracts the proxies are pointing to. Say you deploy a contract in your app version 1.0, and then bump the version to 1.1 and push some upgraded code for that same contract. This will be reflected in the `<contract-i-address>`, but not yet in the proxy, which will display 1.0 in `<proxy-i-version>` and the old logic contract address in `<implementation-i-address>`. Once you run `zos update` to your contract, `<proxy-i-version>` will show the new 1.1 version, and `<implementation-i-address>` will point to the new `<contract-i-address>`.

Also, notice the fields `<app>` and `<package>`. These contain the addresses of contracts that ZeppelinOS uses to facilitate the creation of proxies and the management of different versions of your contracts. These contracts will only be deployed once you publish your project to a desired network. That is, your project will not have an `app` or `package` unless explicitly running the `publish` command. Note that this step is required for projects that produce an EVM package. To read more about the architecture of contracts we are using to publish your project on-chain please refer to the [Contract Architecture](https://docs.zeppelinos.org/docs/architecture.html) section.

Finally, the `stdlib` field stores information about linked EVM packages. Its address is stored in `<stdlib-address>`, and its name in `<stdlib-name>`, matching that in `zos.json`. The `custom-deploy` field will be present only when a version of the EVM package is deployed using the `--deploy-libs` flag of the `push` command, in which case `<custom-deploy>` will be `true`. The remaining addresses, `<app-address>`, `<package-address>`, and `<provider-address>` store the addresses of the `App`, the `Package`, and the current `ImplementationProvider` respectively.

The naming of the file will be `zos.<network>.json`, but note that `<network>` is not taken from the name of the network's entry in the Truffle configuration file, but is instead inferred from the cannonical network id associated to the entry. For example, if the Truffle cofiguration file defines the following networks:

```json
networks: {
   geth_ropsten: {
    host: 'localhost',
    port: 8555,
    network_id: 3
  },
   parity_ropsten: {
    host: 'localhost',
    port: 8565,
    network_id: 3
  },
   local: {
    host: 'localhost',
    port: 8545,
    network_id: *
  }
 }
```
 Using `zos push --network geth_ropsten` or `zos push --network parity_ropsten` will both produce a file named `zos.ropsten.json` no matter which method was used to connect to the ropsten network. ZeppelinOS will automatically detect which public network is being referred to (using web3.network.getVersion()) and use this information for determining the file name.
 When dealing with local networks, ZeppelinOS will generate files with `dev-<network_id>`, given that these networks are not public and don't have a cannonical name. Using `zos push --network local` will produce a file named `zos.dev-1540303312049.json` (or some other number representing the network id of the local network).

## `zos.json` files in version control

`zos.json` files should be tracked in version control. This file represents a project's ZeppelinOS configuration; the contracts and EVM packages that compose it, its name and version, the version of the ZeppelinOS CLI it uses, etc. The file should be identical for all the contributors of a project.

Public network files like `zos.mainnet.json` or `zos.ropsten.json` should also be tracked in version control. These contain valuable information about your project's status in the corresponding network; the addresses of the contract implementations that have been deployed, the addresses of the proxies that have been deployed, etc. Such files should also be identical for all the contributors of a project.

However, local network files like `zos.dev-<netowrk_id>.json` only represent a project's deployment in a temporary local network such as `ganache-cli` that are only relevant to a single contributor of the project and should not be tracked in version control.

An example `.gitignore` file could contain the following entries for ZeppelinOS :

```
# ZeppelinOS
zos.dev-*.json
.zos.session
```
