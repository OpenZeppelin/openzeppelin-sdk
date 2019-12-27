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
});
