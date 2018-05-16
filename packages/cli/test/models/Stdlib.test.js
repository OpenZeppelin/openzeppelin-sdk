'use strict'
require('../setup')

import Stdlib from '../../src/models/stdlib/Stdlib';

contract('Stdlib', function () {
  const packageName = 'mock-stdlib';
  const greeterName = 'Greeter';
  const greeterBytecode = '0x6060604052341561000f57600080fd5b61027b8061001e6000396000f30060606040526004361061004c576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063ead710c414610051578063f8194e48146100ae575b600080fd5b341561005c57600080fd5b6100ac600480803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091905050610184565b005b34156100b957600080fd5b610109600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061022b565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561014957808201518184015260208101905061012e565b50505050905090810190601f1680156101765780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b7fa5263230ff6fc3abbbad333e24faf0f402b4e050b83a1d30ad4051f4e5d0f7276101ae8261022b565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156101ee5780820151818401526020810190506101d3565b50505050905090810190601f16801561021b5780820380516001836020036101000a031916815260200191505b509250505060405180910390a150565b61023361023b565b819050919050565b6020604051908101604052806000815250905600a165627a7a723058201d1f9ef1f5e3ee19e352309d1ea20f6b7aa056b7999c0945a0ae0e4268e041cb0029';
  const deployedAddress = '0x0000000000000000000000000000000000000010';

  beforeEach("initializing stdlib", async function () {
    this.stdlib = new Stdlib(packageName);
  });

  it('should set a name', async function () {
    this.stdlib.name.should.eq(packageName);
  });

  xdescribe('getContract', function () {
    beforeEach("getting a greeter", async function () {
      this.greeter = await this.stdlib.getContract(greeterName);
    });

    // TODO: these tests are testing ContractProvider, move them there
    xit('should retrieve a greeter contract', async function () {
      should.exist(this.greeter);
      this.greeter.bytecode.should.eq(greeterBytecode);
    });
  
    xit('should set web3 provider', async function () {
      this.greeter.currentProvider.host.should.be.not.null;
    });

    xit('should set gas defaults', async function () {
      this.greeter.class_defaults.gas.should.eq(6721975);
      this.greeter.class_defaults.gasPrice.should.eq(100000000000);
    })
  });

  xit('should list all provided contracts', async function () {
    this.stdlib.listContracts().should.have.members([greeterName]);
  });

  xdescribe('deploy', function () {
    beforeEach('deploying an implementation directory', async function () {
      this.directory = await this.stdlib.deploy();
    });

    it('should deploy an implementation directory', async function () {
      this.directory.address.should.not.be.null;
      (typeof(this.directory.getImplementation)).should.eq('function');
    });

    it('should set a greeter in the directory', async function () {
      const address = await this.directory.getImplementation(greeterName);
      address.should.be.not.null;
      const clazz = await this.stdlib.getContract(greeterName);
      const greeter = await clazz.at(address);
      (await greeter.greeting('foo')).should.eq('foo');
    });
  });

  xdescribe('getDeployed', function () {
    it('should return deployment address for specified network', async function () {
      this.stdlib.getDeployed('test').should.eq(deployedAddress)
    });
  });
});