---
id: testing
title: Testing upgradeable applications
sidebar_label: Testing
---

When working with ZeppelinOS, you can test your contracts as you usually do, or you can have ZeppelinOS automatically set up your entire application in your testing environment. This allows you to replicate the same set of contracts that manage your application for each test you run.

The `zos` package provides a `TestApp()` function to retrieve your application structure from the `zos.json` file and deploy everything to the current test network. All contracts you have registered via `zos add`, plus all the contracts provided by the EVM package you have linked, will be available. The returned [`App`](https://github.com/zeppelinos/zos-lib/blob/master/src/app/App.js) object provides convenient methods for creating upgradeable instances of your contracts, which you can use for testing.

> **Important:** for `TestApp` to work correctly in your testing environment, you need to set the `NODE_ENV` environment variable to `test` when running your tests. For instance, if you are using truffle, run `NODE_ENV=test truffle test`.

## Example

Given a small application, with a `Sample` contract, linked to an EVM package that provides a `StandardToken` implementation:

```json
{
  "name": "MyProject",
  "version": "0.1.0",
  "contracts": {
    "Sample": "Sample"
  },
  "stdlib": {
    "name": "openzeppelin-zos",
    "version": "1.9.0"
  }
}
```

To set up the full application in a test file, first import `TestApp` from `zos`:
```js
import { TestApp } from 'zos';
```

Then invoke it in the test suite setup, optionally including a set of options to be used when deploying the contracts (such as `from`, `gas`, and `gasPrice`):
```js
beforeEach(async function () {
  this.app = await TestApp({ from: owner })
});
```

In a test, you can generate an instance for your contracts via the `createProxy` function of the app:

```js
const Sample = artifacts.require('Sample')
it('should create a proxy', async function () {
  const proxy = await this.app.createProxy(Sample);
  // Use proxy ...
})
```

The full code for the sample test file is:

```js
import { TestApp } from 'zos';

const Sample = artifacts.require('Sample')
const StandardToken = artifacts.require('StandardToken')

contract('Sample', function ([_, owner]) {

  beforeEach(async function () {
    this.app = await TestApp({ from: owner })
  });

  it('should create a proxy', async function () {
    const proxy = await this.app.createProxy(Sample);
    const result = await proxy.greet();
    result.should.eq('A sample')
  })

  it('should create a proxy for the EVM package', async function () {
    const proxy = await this.app.createProxy(StandardToken);
    const result = await proxy.totalSupply();
    result.toNumber().should.eq(0);
  })
});
```

Use this convenient tool to write tests for your code and storage migrations before executing them in production.
