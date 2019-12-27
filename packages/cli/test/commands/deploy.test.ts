import '../setup';

import { Contracts } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import { ProxyType } from '../../src/scripts/interfaces';
import ProjectFile from '../../src/models/files/ProjectFile';
import NetworkFile from '../../src/models/files/NetworkFile';

import { action as deploy } from '../../src/commands/deploy/action';

const SimpleNonUpgradeable = Contracts.getFromLocal('SimpleNonUpgradeable');
const WithConstructorNonUpgradeable = Contracts.getFromLocal('WithConstructorNonUpgradeable');

describe('deploy (action)', function() {
  const [owner] = accounts;

  const network = 'test';
  const txParams = { from: owner };

  beforeEach(function() {
    this.projectFile = new ProjectFile('test/mocks/packages/package-empty.zos.json');
    this.networkFile = new NetworkFile(this.projectFile, network);
  });

  it('should deploy a simple contract with no constructor', async function() {
    const contract = 'SimpleNonUpgradeable';
    await deploy(contract, [], {
      network,
      txParams,
      networkFile: this.networkFile,
    });
    const instances = this.networkFile.getProxies({ contract });
    instances.should.have.lengthOf(1);

    const instanceInfo = instances[0];
    instanceInfo.kind.should.equal(ProxyType.NonProxy);
    const instance = SimpleNonUpgradeable.at(instanceInfo.address);
    (await instance.methods.answer().call()).should.equal('42');
  });

  it('should deploy a simple contract with constructor arguments', async function() {
    const contract = 'WithConstructorNonUpgradeable';
    await deploy(contract, ['30', 'abcde', '[3, 7]'], {
      network,
      txParams,
      networkFile: this.networkFile,
    });
    const instances = this.networkFile.getProxies({ contract });
    instances.should.have.lengthOf(1);

    const instanceInfo = instances[0];
    instanceInfo.kind.should.equal(ProxyType.NonProxy);
    const instance = WithConstructorNonUpgradeable.at(instanceInfo.address);
    (await instance.methods.answer().call()).should.equal('42');
  });

  it('should fail to deploy an unknown contract', async function() {
    await deploy('NotExists', [], {
      network,
      txParams,
      networkFile: this.networkFile,
    }).should.be.rejectedWith('Contract NotExists not found');
  });

  it('should deploy multiple instances', async function() {
    const contract = 'SimpleNonUpgradeable';
    const deployArgs: Parameters<typeof deploy> = [
      contract,
      [],
      {
        network,
        txParams,
        networkFile: this.networkFile,
      },
    ];

    await deploy(...deployArgs);
    await deploy(...deployArgs);
    await deploy(...deployArgs);

    const instances = this.networkFile.getProxies({ contract });
    instances.should.have.lengthOf(3);
  });

  it('should fail to deploy without necessary constructor arguments', async function() {
    const contract = 'WithConstructorNonUpgradeable';
    await deploy(contract, [], {
      network,
      txParams,
      networkFile: this.networkFile,
    }).should.be.rejectedWith('Expected 3 values but got 0');
    const instances = this.networkFile.getProxies({ contract });
    instances.should.have.lengthOf(0);
  });

  it.skip('should deploy a contract from a package', async function() {
    const contract = 'mock-stdlib/GreeterImpl';
    await deploy(contract, [], {
      network,
      txParams,
      networkFile: this.networkFile,
    });
    const instances = this.networkFile.getProxies({ contract });
    instances.should.have.lengthOf(1);

    // const instanceInfo = instances[0];
    // instanceInfo.kind.should.equal(ProxyType.NonProxy);
    // const instance = SimpleNonUpgradeable.at(instanceInfo.address);
    // (await instance.methods.answer().call()).should.equal('42');
  });

  // see push tests for reference
  // local libraries
  // dependencies
  // test with alias
  // custom gasprice in txparams
  // saved in truffle artifact
});
