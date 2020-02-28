'use strict';
require('../setup');

import { random } from 'lodash';
import { accounts } from '@openzeppelin/test-environment';

import querySignedDeployment from '../../scripts/query-signed-deployment';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';
import { helpers } from '@openzeppelin/upgrades';
import push from '../../scripts/push';
import queryDeployment from '../../scripts/query-deployment';

describe('query-signed-deployment script', function() {
  const [owner, , admin] = accounts;

  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };
  const contractName = 'ImplV1';

  const shouldHandleQuerySignedDeploymentScript = function() {
    beforeEach('setup', async function() {
      this.networkFile = new NetworkFile(this.projectFile, network);

      this.salt = random(0, 2 ** 32);
      await push({ network, networkFile: this.networkFile });
    });

    it('should query deployment address from signature', async function() {
      const networkFile = this.networkFile;
      const salt = this.salt;

      const predictedAddress = await queryDeployment({
        network,
        txParams,
        networkFile,
        salt,
        sender: helpers.signer,
      });
      const implementation = this.networkFile.contract(contractName).address;
      const signature = helpers.signDeploy(this.networkFile.proxyFactoryAddress, this.salt, implementation, admin);

      const address = await querySignedDeployment({
        signature,
        salt,
        contractName,
        admin,
        network,
        txParams,
        networkFile,
      });
      address.should.eq(predictedAddress);
    });

    it('should query deployment address from signature with initialization', async function() {
      const networkFile = this.networkFile;
      const salt = this.salt;

      const predictedAddress = await queryDeployment({
        network,
        txParams,
        networkFile,
        salt,
        sender: helpers.signer,
      });
      const implementation = this.networkFile.contract(contractName).address;
      const initData = '0xfe4b84df000000000000000000000000000000000000000000000000000000000000001e';
      const signature = helpers.signDeploy(
        this.networkFile.proxyFactoryAddress,
        this.salt,
        implementation,
        admin,
        initData,
      );

      const address = await querySignedDeployment({
        signature,
        salt,
        contractName,
        methodName: 'initialize',
        methodArgs: [30],
        admin,
        network,
        txParams,
        networkFile,
      });
      address.should.eq(predictedAddress);
    });
  };

  describe('on unpublished project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = false;
    });

    shouldHandleQuerySignedDeploymentScript();
  });

  describe('on published project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = true;
    });

    shouldHandleQuerySignedDeploymentScript();
  });
});
