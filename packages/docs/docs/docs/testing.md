---
id: testing
title: Testing upgradeable applications
sidebar_label: Testing
---

To simplify the testing process, you can use the `AppManager` class to set up your entire application (including a standard library) in the test network. This class also acts as wrapper to your deployed application, and can be used to programatically create new proxies of the contracts to test:

```js
import AppManager from 'zos/lib/models/AppManager';

const MyContract = artifacts.require('MyContract');
const MintableToken = artifacts.require('MintableToken');

contract('MyContract', function([owner]) {
  beforeEach(async function () {
    this.appManager = new AppManager(owner, 'test');
    await this.appManager.deployAll();
  });

  it('should create a proxy of MyContract', async function () {
    const proxy = await this.appManager.createProxy(MyContract, 'MyContract');
    const result = await proxy.y();
    result.toNumber().should.eq(1337)
  })

  it('should create and initialize a proxy of MyContract', async function () {
    const proxy = await this.appManager.createProxy(MyContract, 'MyContract', 'initialize', [42]);
    const result = await proxy.x();
    result.toNumber().should.eq(42)
  })

  it('should create a proxy from the stdlib', async function () {
    const proxy = await this.appManager.createProxy(MintableToken, 'MintableToken');
    const result = await proxy.totalSupply();
    result.toNumber().should.eq(0);
  })
});
```
