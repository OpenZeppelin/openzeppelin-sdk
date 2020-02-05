'use strict';
require('../setup');

import { random } from 'lodash';
import { accounts } from '@openzeppelin/test-environment';

import querySignedDeployment from '../../src/scripts/query-signed-deployment';
import ProjectFile from '../../src/models/files/ProjectFile';
import NetworkFile from '../../src/models/files/NetworkFile';
import { helpers } from '@openzeppelin/upgrades';
import push from '../../src/scripts/push';
import queryDeployment from '../../src/scripts/query-deployment';

const should = require('chai').should();

describe('query-signed-deployment script', function() {
  const [owner, another, admin] = accounts;

  const network = 'test';
  const version = '0.4.0';
  const txParams = { from: owner };
  const contractAlias = 'Impl';

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
      const implementation = this.networkFile.contract(contractAlias).address;
      const signature = helpers.signDeploy(this.networkFile.proxyFactoryAddress, this.salt, implementation, admin);

      const address = await querySignedDeployment({
        signature,
        salt,
        contractAlias,
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
      const implementation = this.networkFile.contract(contractAlias).address;
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
        contractAlias,
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
      this.projectFile = new ProjectFile('test/mocks/packages/package-with-contracts.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = false;
    });

    shouldHandleQuerySignedDeploymentScript();
  });

  describe('on published project', function() {
    beforeEach('setup', async function() {
      this.projectFile = new ProjectFile('test/mocks/packages/package-with-contracts.zos.json');
      this.projectFile.version = version;
      this.projectFile.publish = true;
    });

    shouldHandleQuerySignedDeploymentScript();
  });
});
