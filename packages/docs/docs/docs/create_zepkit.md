---
id: create_zepkit
title: Build your own Starter Kit
---

In this guide, we will learn how to create an [OpenZeppelin Starter Kit]((https://zepkit.zeppelinos.org/)) and share it with other developers. A Starter Kit is an easy way to start building a Web3 project, and comes with preconfigured Ethereum tools. The default OpenZeppelin Starter Kit ships with:

* [OpenZeppelin Contracts Ethereum Package](https://github.com/OpenZeppelin/contracts-ethereum-package)

* [OpenZeppelin SDK](https://github.com/OpenZeppelin/openzeppelin-sdk) for upgradeable smart contracts

* [Infura](https://infura.io/) setup for easy deployments & connection

* [Truffle](https://truffleframework.com/) to compile & test smart contracts

* [React](https://github.com/facebook/create-react-app) & [Rimble](https://rimble.consensys.design/) to build usable and friendly interfaces.

## Creating your own Starter Kit 

A starter kit is created out of a Github repository. There are two requirements:

* Having a `kit.json` file at the root of the repository
* Pushing a **stable** branch that will hold the code for your users

The `kit.json` file contains all the configuration information for your Starter Kit. For example:

```json
{
  "manifestVersion": "0.1.0",
  "message": "Hello world!",
  "files": [
    ".gitignore",
    "LICENSE",
    "client",
    "contracts",
    "kit.json",
    "migrations",
    "package.json",
    "solhint.json",
    "test",
    "truffle-config.js"
  ],
  "hooks": {
    "post-unpack": "npm install && cd client && npm install"   
  } 
}
```
Let's understand the terminology used in `kit.json`

* **manifestVersion** — A version of a manifest which ensures proper handling of a kit. Always use the version provided in the documentation (`0.1.0` as of the current version).

* **message** — A message displayed in the terminal immediately after installation. Keep it short and to the point.

* **files** — An array of files and folders to be copied from the repo. An empty array would result in copying all the files. Do not add auto-generated files and folders such as `node_modules` or `.openzeppelin`.

* **hooks** — An object containing terminal commands to execute during unpacking. Currently, only `post-unpack` command supported which is executed right after unpacking a kit.

You then need to push the configuration file and the kit contents into Github on a branch named `stable`.

## Testing your starter kit

To test your starter kit, push its contents to a `stable` branch, and run `openzeppelin unpack username/reponame` on an empty folder. This is the same command your users need to run to use it.

## Best practices

As a Starter Kit will be reviewed and shared with other developers, there are few important points to consider:

* Your repository should have meaningful `README.md` file walking users through installation, running and building a kit. 

* The repository must have a `stable` branch which is used as a source for kit deployment. Use the `stable` branch only for the kit's releases. 

## Getting listed

We value community contributions and would love to list your Starter Kit on our website. Every submitted kit undergoes a screening process. To start this process send us an email with your desired kit name and description, along with a link to its GitHub repo, or post your Starter Kit information on the OpenZeppelin [forum](https://forum.zeppelin.solutions).

