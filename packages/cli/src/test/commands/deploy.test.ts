import '../setup';
import sinon from 'sinon';

import { Contracts, Transactions } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import { ProxyType } from '../../scripts/interfaces';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';

import { action as deploy } from '../../commands/deploy/action';
import { Options, Args } from '../../commands/deploy/spec';

const SimpleNonUpgradeable = Contracts.getFromLocal('SimpleNonUpgradeable');
const WithConstructorNonUpgradeable = Contracts.getFromLocal('WithConstructorNonUpgradeable');

describe('deploy (action)', function() {
  const [owner] = accounts;

  const network = 'test';
  const txParams = { from: owner };

  let projectFile: ProjectFile;
  let networkFile: NetworkFile;

  beforeEach(function() {
    projectFile = new ProjectFile('mocks/packages/package-empty.zos.json');
    networkFile = new NetworkFile(projectFile, network);
  });

  it('deploys a simple contract with no constructor', async function() {
    const contract = 'SimpleNonUpgradeable';
    await deploy({
      contract,
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    });
    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(1);

    const instanceInfo = instances[0];
    instanceInfo.kind.should.equal(ProxyType.NonProxy);
    const instance = SimpleNonUpgradeable.at(instanceInfo.address);
    (await instance.methods.answer().call()).should.equal('42');
  });

  it('deploys a simple contract with constructor arguments', async function() {
    const contract = 'WithConstructorNonUpgradeable';
    await deploy({
      contract,
      arguments: ['30', 'abcde', '[3, 7]'],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    });
    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(1);

    const instanceInfo = instances[0];
    instanceInfo.kind.should.equal(ProxyType.NonProxy);
    const instance = WithConstructorNonUpgradeable.at(instanceInfo.address);
    (await instance.methods.answer().call()).should.equal('42');
  });

  it('should fail to deploy an unknown contract', async function() {
    await deploy({
      contract: 'NotExists',
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    }).should.be.rejectedWith('Contract NotExists not found');
  });

  it('deploys multiple instances', async function() {
    const contract = 'SimpleNonUpgradeable';
    const params = {
      contract,
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular' as Options['kind'],
    };

    await deploy(params);
    await deploy(params);
    await deploy(params);

    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(3);
  });

  it('should fail to deploy without necessary constructor arguments', async function() {
    const contract = 'WithConstructorNonUpgradeable';
    await deploy({
      contract,
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    }).should.be.rejectedWith('Expected 3 values but got 0');
    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(0);
  });

  it('deploys libraries if necessary', async function() {
    const contract = 'WithLibraryNonUpgradeable';
    await deploy({
      contract,
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    });
    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(1);
  });

  it('deploys a contract from a dependency', async function() {
    await deploy({
      contract: 'mock-stdlib-undeployed/GreeterBase',
      arguments: [],
      network,
      txParams,
      networkFile,
      kind: 'regular',
    });
    const instances = networkFile.getProxies({ contractName: 'GreeterBase' });
    instances.should.have.lengthOf(1);
  });

  it('does not redeploy unchanged library', async function() {
    const contract = 'WithLibraryNonUpgradeable';
    const options = { contract, network, txParams, networkFile, arguments: [], kind: 'regular' as Options['kind'] };

    const spy = sinon.spy(Transactions, 'deployContract');

    await deploy(options);
    await deploy(options);

    const instances = networkFile.getProxies({ contractName: contract });
    instances.should.have.lengthOf(2);

    spy.callCount.should.equal(3); // 1 for each contract deploy, only 1 for the library (reused the second time)
    spy.restore();
  });

  // see push tests for reference
  // custom gasprice in txparams
  // saved in truffle artifact
});
