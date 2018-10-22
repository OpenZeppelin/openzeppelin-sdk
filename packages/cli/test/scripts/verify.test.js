'use strict'
require('../setup')

import sinon from 'sinon'
import axios from 'axios'

import CaptureLogs from '../helpers/captureLogs'

import verify from '../../src/scripts/verify.js'
import push from '../../src/scripts/push.js'
import ZosPackageFile from '../../src/models/files/ZosPackageFile'

contract('verify script', function () {
  const contractAlias = 'Impl'
  const network = 'test'
  const txParams = {}

  const assertVerify = async function (contractAlias, options, message) {
    try {
      await verify(contractAlias, options)
    } catch(error) {
      error.message.should.match(message)
    }
  }

  describe('validations', function () {
    describe('with invalid package or network files', function () {
      it('throws error if zOS project is not yet initialized', async function () {
        const packageFile = new ZosPackageFile('non-existent-package.zos.json')
        const networkFile = packageFile.networkFile(network)
        await assertVerify(contractAlias, { network, networkFile }, /Run 'zos init' first to initialize the project./)
      })

      it('throws error if contract not yet added', async function () {
        const packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
        const networkFile = packageFile.networkFile(network)
        const nonExistentContract = 'NonExistent'
        await assertVerify(nonExistentContract, { network, networkFile }, /not found in this project/)
      })
    })

    describe('with valid package and network files', async function () {
      beforeEach(function () {
        this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
        this.networkFile = this.packageFile.networkFile(network)
      })

      it('throws error if contract not yet deployed', async function () {
        await assertVerify(contractAlias, { network, networkFile: this.networkFile }, /is not deployed to/)
      })

      it('throws error if contract source code has changed locally since last deploy', async function () {
        await push({ network, networkFile: this.networkFile, txParams })
        const contracts = this.networkFile.contracts
        contracts[contractAlias].localBytecodeHash = '0x0303456'
        this.networkFile.contracts = contracts
        await assertVerify(contractAlias, { network, networkFile: this.networkFile }, /has changed locally since the last deploy/)
      })
    })
  })

  describe('contract verification', function () {
    beforeEach(async function () {
      this.packageFile = new ZosPackageFile('test/mocks/packages/package-with-contracts.zos.json')
      this.networkFile = this.packageFile.networkFile(network)
      await push({ network, networkFile: this.networkFile, txParams })
      this.logs = new CaptureLogs()
      this.axiosStub = sinon.stub(axios, 'request')
    })

    afterEach(function () {
      this.logs.restore()
      this.axiosStub.restore()
    })

    it('throws error if specifying not permitted remote', async function () {
      await assertVerify(contractAlias, { network, networkFile: this.networkFile, remote: 'invalid-remote' }, /Invalid remote/)
    })

    it('throws error if contract could not be verified', async function () {
      this.axiosStub.returns({ status: 200, data: '<div id="infoModal"><div class="modal-body"> Error: </div></div>' })
      await assertVerify(contractAlias, { network, networkFile: this.networkFile, remote: 'etherchain' }, /Error/)
    })

    it('logs a success info message when contract is verified', async function () {
      this.axiosStub.returns({ status: 200, data: '<div id="infoModal"><div class="modal-body"> successful </div></div>' })
      await verify(contractAlias, { network, networkFile: this.networkFile, remote: 'etherchain' })
      this.logs.infos.should.have.lengthOf(2)
      this.logs.infos[0].should.match(/Verifying and publishing/)
      this.logs.infos[1].should.match(/Contract verified and published successfully. You can check it here/)
    })
  })
})
