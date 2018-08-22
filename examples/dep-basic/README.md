# Sample library for ZeppelinOS

This project depicts a sample library to be used from a ZeppelinOS project. It provides a single contract (named `EthBox`) which is registered in the `zos.json` file. This library is already deployed to the ropsten testnet, so you can link directly to it if testing there.

## How to create your own library

To create your own library to be used by other ZeppelinOS users, just install the ZeppelinOS CLI and init a new library project.

```bash
$ npm install -g zos
$ zos init MyLibrary --lib
```

Then add your contracts, and publish it to testnet and mainnet, so others can use it directly:
```bash
$ zos add MyContract
$ zos push --network ropsten
$ zos push --network rinkeby
$ zos push --network mainnet
```

## How to use a library

Just run `zos link MyLibrary` from a ZeppelinOS project to start using a library. Refer to the `cli-with-deps` sample project in this same repository for more info.