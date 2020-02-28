'use strict';
require('../setup');
import { accounts } from '@openzeppelin/test-environment';

import add from '../../scripts/add';
import push from '../../scripts/push';
import sendTx from '../../scripts/send-tx';
import createProxy from '../../scripts/create';
import CaptureLogs from '../helpers/captureLogs';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';

describe('send-tx script', function() {
  const [account] = accounts;

  const txParams = { from: account };
  const network = 'test';

  beforeEach('setup', async function() {
    this.logs = new CaptureLogs();
    this.projectFile = new ProjectFile('mocks/packages/package-empty.zos.json');

    this.networkFile = new NetworkFile(this.projectFile, network);

    const contracts = ['ImplV1'];
    await add({ contracts, projectFile: this.projectFile });
    await push({ network, txParams, networkFile: this.networkFile });
    await createProxy({
      contractName: 'ImplV1',
      network,
      txParams,
      networkFile: this.networkFile,
    });
  });

  afterEach('restore captures', function() {
    this.logs.restore();
  });

  describe('validations', function() {
    context('when not specifying proxy address', function() {
      it('throws an error', async function() {
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          methodName: 'initialize',
          methodArgs: [42],
        }).should.be.rejectedWith('A contract address must be specified.');
      });
    });

    context('when specifying a non-existent proxy address', function() {
      it('throws an error', async function() {
        const proxyAddress = '0x124';
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42],
        }).should.be.rejectedWith(`Proxy at address ${proxyAddress} not found`);
      });
    });

    context('when not specifying a method name', function() {
      it('throws an error', async function() {
        const proxyAddress = '0x124';
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodArgs: [42],
        }).should.be.rejectedWith('A method name must be specified.');
      });
    });
  });

  describe('errors', function() {
    context('when specifying a wrong number of method arguments', function() {
      it('throws an error', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42, 44],
        }).should.be.rejectedWith('Could not find method initialize with 2 arguments in contract ImplV1');
      });
    });

    context('when sending a value inside txParams to a nonpayable method', function() {
      it('throws an error', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42],
          value: 1000,
        }).should.be.rejectedWith('Can not send value to non-payable contract method or constructor');
      });
    });

    context('when sending a non-reasonable gas amount', function() {
      it('throws an error', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42],
          gas: 1,
        }).should.be.rejectedWith(/base fee exceeds gas limit/);
      });
    });
  });

  context('when specifying valid address, method name and method args', function() {
    context('when the method emits an event', function() {
      it('calls the function and logs the transaction hash and events', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initializeWithEvent',
          methodArgs: [42],
        });

        this.logs.infos[this.logs.infos.length - 2].should.match(/Transaction successful/);
        this.logs.infos[this.logs.infos.length - 1].should.match(/Events emitted:/);
      });
    });

    context('when the method does not emit any event', function() {
      it('calls the function and logs the transaction hash and events', async function() {
        const proxyAddress = this.networkFile.getProxies({
          contract: 'Impl',
        })[0].address;
        await sendTx({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42],
        });

        this.logs.infos[this.logs.infos.length - 1].should.match(/Transaction successful/);
      });
    });
  });
});
