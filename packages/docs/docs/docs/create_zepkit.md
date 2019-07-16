---
id: create_zepkit
title: Build your own ZepKit
---


In this guide, we will learn how to create a ZepKit and share it with other developers. If you didn’t try ZepKit until now, check [here](https://zepkit.zeppelinos.org/). ZepKit is the easiest way to start building a Web3 application and comes with already configured Ethereum tools. ZepKit involves

* [OpenZeppelin](https://openzeppelin.org/) as an EVM package.

* Upgradeable smart contracts with [ZeppelinOS](https://zeppelinos.org/).

* [Infura](https://infura.io/) setup for easy deployments & connection.

* [Truffle](https://truffleframework.com/) to compile & test smart contracts.

* [React ](https://github.com/facebook/create-react-app)& [Rimble](https://rimble.consensys.design/) to build usable and friendly interfaces.

**Build your own ZepKit**

To build our own ZepKit, we will use [Tutorial ZepKit](https://zepkit.zeppelinos.org/) and add an extra `Hello` contract. To download and install Tutorial ZepKit follow [these](https://zepkit.zeppelinos.org/) instructions.

**Add Hello contract**

```console solidity
pragma solidity ^0.5.0;
import "zos-lib/contracts/Initializable.sol";

contract Hello is Initializable {
  string public message;
  function initialize(string memory initialMessage) public initializer {   
    message = initialMessage;
  }
  function setMessage(string memory newMessage) public {
    message = newMessage;
  }
}
```
> Note: Ideally you want to change front-end code and test your ZepKit properly before sharing it with others. 

### Creating ZepKit 

To create a ZOS kit there are two main requirement 

* A `kit.json` file

* A GitHub repository with ***stable*** branch

`Kit.json` file contains all the configuration information for your ZepKit. Below is our `kit.json` file.  
```console json
{
  "manifestVersion": "0.1.0",
  "message": "Hello Zepkit, original repo [https://github.com/zeppelinos/zepkit](https://github.com/buddies2705/HelloKit)",
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
Let’s understand the terminology used in `kit.json`

* **manifestVersion** — A version of a manifest which ensures proper handling of a kit. Always use the version provided in the documentation.

* **message** — A message displayed in the terminal immediately after installation. Keep it short and to the point.

* **files** — An array of files and folders to be copied from the repo. An empty array would result in copying all the files., Do not add auto-generated files and folders such asnode_modules or zos.json .

* **hooks** — An object containing terminal commands to execute during unpacking. Currently, only post-unpack command supported which is executed right after unpacking a kit.

We also need to push this into Github on stable branch, It means you need to create a branch named `stable` and publish the source code on this branch. [Here](https://github.com/buddies2705/HelloKit) is our `HelloKit` repository. 

**Best practices**

As ZepKit will be reviewed and shared with other developers, there are few important points.

* Your repository should have meaningful README.md file walking users through installation, running and building a kit. 

* Repo should have a `stable` branch which is used as a source for kit deployment. Use `stable` branch only for kit’s releases. 

**Getting listed at ZeppelinOS website**

We value community contribution and would love to list your ZepKit on ZeppelinOS website. Every submitted kit undergoes a screening process to ensure safety. To start this process send us an email with your desired kit name and description, along with a link to its GitHub repo or post your ZepKit information on the Zeppelin [forum](https://forum.zeppelin.solutions). 

