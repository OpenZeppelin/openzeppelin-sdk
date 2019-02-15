---
id: version-2.2.0-testing
title: Testing upgradeable projects
original_id: testing
---

When working with ZeppelinOS, you can test your contracts as you usually do, or you can have ZeppelinOS automatically set up your entire project in your testing environment. This allows you to replicate the same set of contracts that manage your project for each test you run.

The `zos` package provides a `TestHelper()` function to retrieve your project structure from the `zos.json` file and deploy everything to the current test network. All contracts you have registered via `zos add`, plus all the contracts provided by the EVM packages you have linked, will be available. The returned project object (either a [`SimpleProject`](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/src/project/SimpleProject.js) or an [`AppProject`](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/src/project/AppProject.js)) provides convenient methods for creating upgradeable instances of your contracts, which you can use for testing.

> **Important:** for `TestHelper` to work correctly in your testing environment, you need to set the `NODE_ENV` environment variable to `test` when running your tests. For instance, if you are using truffle, run `NODE_ENV=test truffle test`.

## Example

Given a small project, with a `Sample` contract, linked to an EVM package that provides a `ERC20` token implementation:

```json
{
  "zosversion": "2.2",
  "name": "my-project",
  "version": "0.1.0",
  "contracts": {
    "Sample": "Sample"
  },
  "dependencies": {
    "openzeppelin-eth": "2.0.2"
  }
}
```

To set up the full project in a test file, first import `TestHelper` from `zos`:
```js
import { TestHelper } from 'zos';
```

Then invoke it in the test suite setup, optionally including a set of options to be used when deploying the contracts (such as `from`, `gas`, and `gasPrice`):
```js
beforeEach(async function () {
  this.project = await TestHelper({ from: owner })
});
```

In a test, you can generate an instance for your contracts via the `createProxy` function of the project:

```js
const Sample = artifacts.require('Sample')
it('should create a proxy', async function () {
  const proxy = await this.project.createProxy(Sample);
  // Use proxy ...
})
```

The full code for the sample test file is:

```js
import { TestHelper } from 'zos'

require('chai').should()

const Sample = artifacts.require('Sample')
const ERC20 = artifacts.require('ERC20')

contract('Sample', function ([_, owner]) {

  beforeEach(async function () {
    this.project = await TestHelper({ from: owner })
  })

  it('should create a proxy', async function () {
    const proxy = await this.project.createProxy(Sample);
    const result = await proxy.greet()
    result.should.eq('A sample')
  })

  it('should create a proxy for the EVM package', async function () {
    const proxy = await this.project.createProxy(ERC20, { contractName: 'StandaloneERC20', packageName: 'openzeppelin-eth' });
    const result = await proxy.totalSupply();
    result.toNumber().should.eq(0);
  })
})
```

Use this convenient tool to write tests for your code and storage migrations before executing them in production.

## Calling Initialize Functions Manually in Your Unit Tests

Truffle does not know how to resolve situations where a contract 
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

The current solution to this issue is to `npm install zos-lib` and use the same 
helper function used by the `zos create` command: `encodeCall`. This helper 
receives the signature of your `initialize` function, as well as its arguments 
and their types. `encodeCall` crafts the calldata which you can send in a 
raw call. For example you can now call the `TimedCrowdsale#initialize` doing as follows:

```js
const { encodeCall } = require('zos-lib')

data = encodeCall(
  'initialize',
  ['uint256', 'uint256'],
  [openingTime, closingTime]
)
const timeCrowdsale = await TimeCrowdsale.new()
await timeCrowdsale.sendTransaction({ data, from: owner })
```
