---
id: version-2.2.0-testing
title: Testing upgradeable projects
original_id: testing
---

When working with ZeppelinOS, you can test your contracts as you usually do. That is, you can manually deploy your logic contracts, and test them just like any other contract. However, when using ZeppelinOS, you are dealing with upgradeable instances. Of course, you could use ZeppelinOS at a lower level programmatically in your tests but this could be rather cumbersome.

Instead, you can use specifically designed ZeppelinOS tools that automatically set up your entire project in your testing environment. This allows you to replicate the same set of contracts that manage your project for each test you run.

The `zos` package provides a `TestHelper()` function to retrieve your project structure from the `zos.json` file and deploy everything to the current test network. All the contracts that you have registered via `zos add`, plus all the contracts provided by the EVM packages you have linked, will be available. The returned project object (either a [`ProxyAdminProject`](https://github.com/zeppelinos/zos/blob/v2.2.0/packages/lib/src/project/ProxyAdminProject.ts) or an [`AppProject`](https://github.com/zeppelinos/zos/blob/v2.2.0/packages/lib/src/project/AppProject.ts)) provides convenient methods for creating upgradeable instances of your contracts, which you can use within your tests. Let's see how this would work in a simple project.

## Setting up a sample project

The following section describes a succinct way in how a simple ZeppelinOS project can be set up. If you already have a project set up, you may skip to the next section.

_If you don't understand what's going on in this section, please refer to the Quickstart guides of the documentation, specifically the [Deploying your first project](https://docs.zeppelinos.org/docs/deploying.html), [Upgrading your project](https://docs.zeppelinos.org/docs/upgrading.html) and [Linking to EVM packages](https://docs.zeppelinos.org/docs/linking.html) guides. These guides provide detailed explanations on how a basic ZeppelinOS project works._

Create a new project by running:

```console
mkdir my-project
cd my-project
npm init --yes
npm install zos zos-lib openzeppelin-eth truffle chai
```

Now, run:

```console
npx zos init my-project
```

Let's add a simple contract to the project, create the file `contracts/Sample.sol`:

```solidity
pragma solidity ^0.5.0;

contract Sample {
  function greet() public pure returns (string memory) {
    return "A sample";
  }
}
```

Now, add your contract to the ZeppelinOS project:

```console
npx zos add Sample
```

And link your ZeppelinOS project to the `openzeppelin-eth` EVM package:

```
npx zos link openzeppelin-eth
```

## Writing the test script

> This test is written in ES5 Javascript. If you'd like to use ES6 syntax instead, make sure you [set up babel in your project](https://docs.zeppelinos.org/docs/faq.html#how-do-i-use-es6-javascript-syntax-in-my-tests).

Now, let's create the test file `test/Sample.test.js`:

```javascript
const { TestHelper } = require('zos');
const { Contracts, ZWeb3 } = require('zos-lib');

ZWeb3.initialize(web3.currentProvider);

const Sample = Contracts.getFromLocal('Sample');
const ERC20 = Contracts.getFromNodeModules('openzeppelin-eth', 'ERC20');

require('chai').should();

contract('Sample', function () {

  beforeEach(async function () {
    this.project = await TestHelper();
  })

  it('should create a proxy', async function () {
    const proxy = await this.project.createProxy(Sample);
    const result = await proxy.methods.greet().call();
    result.should.eq('A sample');
  })

  it('should create a proxy for the EVM package', async function () {
    const proxy = await this.project.createProxy(ERC20, { contractName: 'StandaloneERC20', packageName: 'openzeppelin-eth' });
    const result = await proxy.methods.totalSupply().call();
    result.should.eq('0');
  })
})
```

Next, modify your `package.json` file to include the following script:

```json
"test": "truffle test"
```

And run the test in your console with:

```console
npm test
```

That's it! Now, let's look at what we just did in more detail.

## Understanding the test script

We first require `TestHelper` from `zos`. This helper facilitates the creation of a project object that will set up the entire ZeppelinOS project within a test environment.

```js
const { TestHelper } = require('zos');
```

We are also requiring `Contracts` and `ZWeb3` from `zos-lib`. `Contracts` helps us retrieve compiled contract artifacts, while `ZWeb3` is needed to set up our Web3 provider to ZeppelinOS.

```js
const { Contracts, ZWeb3 } = require('zos-lib');

ZWeb3.initialize(web3.currentProvider);

const Sample = Contracts.getFromLocal('Sample');
const ERC20 = Contracts.getFromNodeModules('openzeppelin-eth', 'ERC20');
```

We then invoke `TestHelper` in the test, optionally including a set of options to be used when deploying the contracts (such as `from`, `gas`, and `gasPrice`):
```js
beforeEach(async function () {
  this.project = await TestHelper()
});
```

And finally, we add the tests themselves. Notice how each test first creates a upgradeable instance for each contract:

```js
const proxy = await this.project.createProxy(Sample);
```

The [createProxy](https://github.com/zeppelinos/zos/blob/master/packages/lib/src/project/BaseSimpleProject.ts#L96) method of the project accepts an additional object parameter in which you can specify an initializer function with arguments, just as you would by using the regular `zos create` command from the CLI, but due to the simplicity of this example, it's not necessary in our case. If you would need to pass parameters though, you would do so like this:

```js
const proxy = await this.project.createProxy(Sample, {
  initMethod: 'initialize',
  initArgs: [42]
});
```

This is assuming our `Sample` contract had an `initialize` function with one `uint256` parameter, which it doesn't. The above code simply illustrates how you would create the upgradeable instance if it had an `initialize` function.

Continuing with our example, notice that the way we interact with the contracts is by using their `methods` object. This is because ZeppelinOS uses Web3 1.0 Contract interface:

```js
const result = await proxy.methods.totalSupply().call();
```

This is how you should write tests for your ZeppelinOS projects. The project object provided by `TestHelper` wraps all of ZeppelinOS programmatic interface in a way that is very convenient to use in tests. By running tests in this way, you make sure that you are testing your contracts with the exact set of conditions that they would have in production, after you deploy them with ZeppelinOS.

## Calling initialize functions manually in your tests

Sometimes, there are situations where a contract 
has functions that have matching names, but different arities. 
Here's an example of a `TimedCrowdsale` contract that inherits 
from `Crowdsale` which results in a contract that has two 
`initialize` functions with different arities:

```solidity
contract TimedCrowdsale is Crowdsale {

  initialize(uint256 _openingTime, uint256 _closingTime) public initializer {
    Crowdsale.initialize(_rate, _wallet, _token);
  }
}

contract Crowdsale {

  initialize(uint256 _rate, address _wallet, ERC20 _token) public initializer {
    // does something
  }
}
```

This means that calls to contracts with more than one function named `initialize`, 
as is the case with some contracts from OpenZeppelin (e.g., TimedCrowdsale), 
may revert if you call `initialize` directly from Truffle. `zos create` handles 
this correctly as it encodes the parameters. However, for your unit tests you will 
need to call `initialize` manually.

As of version 5, Truffle has the ability to
overcome the problem depicted above. That is, you can call functions with matching
names that have different arities in Javascript by using the methods property of Truffle Contract. 

To call TimedCrowdsale's initialize function, use the following syntax:

```
timedCrowadsale.methods['initialize(uint256,uint256)'](openingTime, closingTime);
```

And to call Crowdsale's initialize function,

```
timedCrowadsale.methods['initialize(uint256,address,address)'](rate, wallet, token);
```
