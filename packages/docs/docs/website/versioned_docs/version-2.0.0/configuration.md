---
id: version-2.0.0-configuration
title: Configuration Files
original_id: configuration
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
