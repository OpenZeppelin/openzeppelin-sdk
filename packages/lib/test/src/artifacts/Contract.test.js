'use strict'
require('../../setup')

import utils from 'web3-utils';

import Contracts from '../../../src/artifacts/Contracts'

const ContractWithConstructorImplementation = Contracts.getFromLocal('WithConstructorImplementation');


contract('Contract', function(accounts) {
  const [_, account] = accounts.map(utils.toChecksumAddress)
  const txParams = { from: account };

  describe('methods', function() {
    describe('#at', function () {
      beforeEach('deploying contracts', async function () {
        this.instance1 = await ContractWithConstructorImplementation.new([10, "foo"], txParams);
        this.instance2 = await ContractWithConstructorImplementation.new([20, "bar"], txParams);
      });

      it('creates a copy of the instance', async function () {
        const instance1 = ContractWithConstructorImplementation.at(this.instance1.address);
        const instance2 = ContractWithConstructorImplementation.at(this.instance2.address);
        instance1.address.should.not.eq(instance2.address);
        instance1.options.address.should.not.eq(instance2.options.address);
        (await instance1.methods.text().call()).should.eq('foo');
        (await instance2.methods.text().call()).should.eq('bar');
      });
    });
  });
});

