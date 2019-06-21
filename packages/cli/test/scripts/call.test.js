'use strict';
require('../setup');
import utils from 'web3-utils';

import add from '../../src/scripts/add';
import push from '../../src/scripts/push';
import call from '../../src/scripts/call';
import sendTx from '../../src/scripts/send-tx';
import createProxy from '../../src/scripts/create';
import { Contracts } from 'zos-lib';
import CaptureLogs from '../helpers/captureLogs';
import ProjectFile from '../../src/models/files/ProjectFile';

contract('call script', function(accounts) {
  accounts = accounts.map(utils.toChecksumAddress);
  const [_skipped, account] = accounts;
  const txParams = { from: account };
  const network = 'test';

  beforeEach('setup', async function() {
    this.logs = new CaptureLogs();
    this.projectFile = new ProjectFile(
      'test/mocks/packages/package-empty.zos.json',
    );
    this.networkFile = this.projectFile.networkFile(network);
    const contractsData = [{ name: 'ImplV1', alias: 'Impl' }];
    await add({ contractsData, projectFile: this.projectFile });
    await push({ network, txParams, networkFile: this.networkFile });
    await createProxy({
      contractAlias: 'Impl',
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
        await call({
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
        await call({
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
        await call({
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
        await call({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'initialize',
          methodArgs: [42, 44],
        }).should.be.rejectedWith(
          'Could not find method initialize with 2 arguments in contract ImplV1',
        );
      });
    });
  });

  describe('specifying valid address, method name and method args', function() {
    context('when calling a variable getter', function() {
      it('calls the getter and logs the returned value', async function() {
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
        await call({
          network,
          txParams,
          networkFile: this.networkFile,
          proxyAddress,
          methodName: 'value',
          methodArgs: [],
        });

        this.logs.infos[this.logs.infos.length - 1].should.eq(
          `Method 'value' returned: 42`,
        );
      });
    });

    context('when calling a regular method', function() {
      context('when the method does not return', function() {
        it('calls the method and logs that it has been returned empty', async function() {
          const proxyAddress = this.networkFile.getProxies({
            contract: 'Impl',
          })[0].address;
          await call({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'doesNotReturn',
            methodArgs: [],
          });

          this.logs.infos[this.logs.infos.length - 1].should.eq(
            `Method 'doesNotReturn' returned empty.`,
          );
        });
      });

      context('when the method returns a value', function() {
        it('calls the method and logs the returned value', async function() {
          const proxyAddress = this.networkFile.getProxies({
            contract: 'Impl',
          })[0].address;
          await call({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'say',
            methodArgs: [],
          });

          this.logs.infos[this.logs.infos.length - 1].should.eq(
            `Method 'say' returned: V1`,
          );
        });
      });

      context('when the method returns multiple values', function() {
        it('calls the method and logs the returned values', async function() {
          const proxyAddress = this.networkFile.getProxies({
            contract: 'Impl',
          })[0].address;
          await call({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'sayMore',
            methodArgs: [],
          });

          this.logs.infos[this.logs.infos.length - 1].should.eq(
            `Method 'sayMore' returned: (V1, 1)`,
          );
        });
      });

      context('when the method returns an array', function() {
        it('calls the method and logs an empty array', async function() {
          const proxyAddress = this.networkFile.getProxies({
            contract: 'Impl',
          })[0].address;
          await call({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'sayNumbers',
            methodArgs: [],
          });

          this.logs.infos[this.logs.infos.length - 1].should.eq(
            `Method 'sayNumbers' returned: []`,
          );
        });

        it('calls the method and logs the array', async function() {
          const proxyAddress = this.networkFile.getProxies({
            contract: 'Impl',
          })[0].address;
          await sendTx({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'initializeNumbers',
            methodArgs: [[1, 2, 3]],
          });
          await call({
            network,
            txParams,
            networkFile: this.networkFile,
            proxyAddress,
            methodName: 'sayNumbers',
            methodArgs: [],
          });

          this.logs.infos[this.logs.infos.length - 1].should.eq(
            `Method 'sayNumbers' returned: [1,2,3]`,
          );
        });
      });
    });
  });
});
