'use strict';
require('../setup');

import sinon from 'sinon';
import axios from 'axios';

import CaptureLogs from '../helpers/captureLogs';

import verify from '../../src/scripts/verify';
import push from '../../src/scripts/push';
import ProjectFile from '../../src/models/files/ProjectFile';

contract('verify script', function() {
  const contractAlias = 'Impl';
  const network = 'test';
  const txParams = {};

  const assertVerify = async function(contractAlias, options, message) {
    try {
      await verify(contractAlias, options);
    } catch (error) {
      error.message.should.match(message);
    }
  };

  describe('validations', function() {
    describe('with invalid package or network files', function() {
      it('throws error if zOS project is not yet initialized', async function() {
        const projectFile = new ProjectFile('non-existent-package.zos.json');
        const networkFile = projectFile.networkFile(network);
        await assertVerify(
          contractAlias,
          { network, networkFile },
          /Run 'zos init' first to initialize the project./,
        );
      });

      it('throws error if contract not yet added', async function() {
        const projectFile = new ProjectFile(
          'test/mocks/packages/package-with-contracts.zos.json',
        );
        const networkFile = projectFile.networkFile(network);
        const nonExistentContract = 'NonExistent';
        await assertVerify(
          nonExistentContract,
          { network, networkFile },
          /not found in this project/,
        );
      });
    });

    describe('with valid package and network files', async function() {
      beforeEach(function() {
        this.projectFile = new ProjectFile(
          'test/mocks/packages/package-with-contracts.zos.json',
        );
        this.networkFile = this.projectFile.networkFile(network);
      });

      it('throws error if contract not yet deployed', async function() {
        await assertVerify(
          contractAlias,
          { network, networkFile: this.networkFile },
          /is not deployed to/,
        );
      });

      it('throws error if contract source code has changed locally since last deploy', async function() {
        await push({ network, networkFile: this.networkFile, txParams });
        const contracts = this.networkFile.contracts;
        contracts[contractAlias].localBytecodeHash = '0x0303456';
        this.networkFile.contracts = contracts;
        await assertVerify(
          contractAlias,
          { network, networkFile: this.networkFile },
          /has changed locally since the last deploy/,
        );
      });
    });
  });

  describe('contract verification', function() {
    const network = 'mainnet';

    beforeEach(async function() {
      this.projectFile = new ProjectFile(
        'test/mocks/packages/package-with-contracts.zos.json',
      );
      this.networkFile = this.projectFile.networkFile(network);
      await push({ network, networkFile: this.networkFile, txParams });
      this.logs = new CaptureLogs();
      this.axiosStub = sinon.stub(axios, 'request');
    });

    afterEach(function() {
      this.logs.restore();
      this.axiosStub.restore();
    });

    it('throws error if specifying not permitted remote', async function() {
      await assertVerify(
        contractAlias,
        { network, networkFile: this.networkFile, remote: 'invalid-remote' },
        /Invalid remote/,
      );
    });

    describe('against etherscan', function() {
      it('throws error if not specifying api key option', async function() {
        await assertVerify(
          contractAlias,
          { network, networkFile: this.networkFile, remote: 'etherscan' },
          /Etherscan API key not specified/,
        );
      });

      it('throws error if contract could not be verified', async function() {
        this.axiosStub.returns({
          status: 200,
          data: { status: '0', result: 'Something went wrong' },
        });
        await assertVerify(
          contractAlias,
          {
            network,
            networkFile: this.networkFile,
            remote: 'etherscan',
            apiKey: 'AP1_k3Y',
          },
          /Error/,
        );
      });

      it('logs a success info message when contract is verified', async function() {
        this.axiosStub.onCall(0).returns({
          status: 200,
          data: { status: '1', result: 'GU1D_NUMB3R' },
        });
        this.axiosStub
          .onCall(1)
          .returns({ status: 200, data: { status: '1' } });
        await verify(contractAlias, {
          network,
          networkFile: this.networkFile,
          remote: 'etherscan',
          apiKey: 'AP1_k3Y',
        });
        this.logs.infos.should.have.lengthOf(2);

        this.logs.infos[0].should.match(/Verifying and publishing/);
        this.logs.infos[1].should.match(
          /Contract source code of ImplV1 verified and published successfully/,
        );
      });
    });

    describe('against etherchain', function() {
      it('throws error if specifying anything but mainnet as a network', async function() {
        await assertVerify(
          contractAlias,
          {
            network: 'test',
            networkFile: this.networkFile,
            remote: 'etherchain',
          },
          /Invalid network/,
        );
      });

      it('throws error if contract could not be verified', async function() {
        this.axiosStub.returns({
          status: 200,
          data:
            '<div id="infoModal"><div class="modal-body"> Error: </div></div>',
        });
        await assertVerify(
          contractAlias,
          { network, networkFile: this.networkFile, remote: 'etherchain' },
          /Error/,
        );
      });

      it('logs a success info message when contract is verified', async function() {
        this.axiosStub.returns({
          status: 200,
          data:
            '<div id="infoModal"><div class="modal-body"> successful </div></div>',
        });
        await verify(contractAlias, {
          network,
          networkFile: this.networkFile,
          remote: 'etherchain',
        });
        this.logs.infos.should.have.lengthOf(2);
        this.logs.infos[0].should.match(/Verifying and publishing/);
        this.logs.infos[1].should.match(
          /Contract source code of ImplV1 verified and published successfully. You can check it here/,
        );
      });
    });
  });
});
