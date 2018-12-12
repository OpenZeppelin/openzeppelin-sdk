'use strict';
require('../../setup')

import Contracts from '../../../src/artifacts/Contracts'
import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';

const Package = Contracts.getFromLocal('Package')

contract('Package', ([_, owner, anotherAddress, contractAddress, anotherContractAddress]) => {
  const version = [1,0,0]
  const anotherVersion = [2,0,0]
  const contentURI = "0x102030"
  const anotherContentURI = "0x405060"
  const from = owner
  
  beforeEach(async function () {
    this.package = await Package.new({ from: owner })
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.package
    })

    shouldBehaveLikeOwnable(owner, anotherAddress)
  })

  describe('addVersion', function () {
    it('registers given implementation directory', async function () {
      const { logs } = await this.package.addVersion(version, contractAddress, contentURI, { from })

      const [registeredDirectory, registeredContentURI] = await this.package.getVersion(version)
      registeredDirectory.should.be.equal(contractAddress)
      registeredContentURI.should.eq(contentURI)

      logs.should.have.lengthOf(1)
      logs[0].event.should.be.equal('VersionAdded')
      logs[0].args.semanticVersion.map(x => x.toNumber()).should.be.deep.equal(version)
      logs[0].args.contractAddress.should.be.equal(contractAddress)
      logs[0].args.contentURI.should.be.equal(contentURI)
    })

    it('registers multiple versions', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from })
      await this.package.addVersion(anotherVersion, anotherContractAddress, anotherContentURI, { from })

      const [newRegisteredDirectory, newRegisteredContentURI] = await this.package.getVersion(anotherVersion)
      newRegisteredDirectory.should.be.equal(anotherContractAddress)
      newRegisteredContentURI.should.eq(anotherContentURI)
    })

    it('accepts empty content URI', async function () {
      await this.package.addVersion(version, contractAddress, "", { from })
      const [_registeredDirectory, registeredContentURI] = await this.package.getVersion(version)
      registeredContentURI.should.eq('0x')
    })

    it('reverts if contract address is zero', async function () {
      await assertRevert(this.package.addVersion(version, ZERO_ADDRESS, contentURI, { from }))
    })

    it('reverts if version is zero', async function () {
      await assertRevert(this.package.addVersion([0,0,0], contractAddress, contentURI, { from }))
    })

    it('reverts if re-registering version', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from })
      await assertRevert(this.package.addVersion(version, anotherContractAddress, contentURI, { from }))
    })

    it('reverts if called from another address', async function () {
      await assertRevert(this.package.addVersion(version, contractAddress, contentURI, { from: anotherAddress }))
    })
  })

  describe('getVersion', function () {
    it('returns the registered version', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from: owner })
      const [registeredDirectory, registeredContentURI] = await this.package.getVersion(version)
      registeredDirectory.should.be.equal(contractAddress)
      registeredContentURI.should.be.equal(contentURI)
    })

    it('returns zero if version is not registered', async function () {
      const [registeredDirectory, registeredContentURI] = await this.package.getVersion(version)
      registeredDirectory.should.be.zeroAddress
      registeredContentURI.should.eq("0x")
    })
  })

  describe('getContract', function () {
    it('returns the registered contract', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from: owner })
      const registeredDirectory = await this.package.getContract(version)
      registeredDirectory.should.be.equal(contractAddress)
    })

    it('returns zero address if version is not registered', async function () {
      const registeredDirectory = await this.package.getContract(version)
      registeredDirectory.should.be.zeroAddress
    })
  })

  describe('hasVersion', function () {
    it('returns true if version is registered', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from: owner })
      const hasVersion = await this.package.hasVersion(version)
      hasVersion.should.be.true;
    })

    it('returns false if version is not registered', async function () {
      const hasVersion = await this.package.hasVersion(version)
      hasVersion.should.be.false;
    })
  })

  describe('getLatest', function () {
    it('returns zero if no versions registered', async function () {
      const [registeredVersion, registeredDirectory, registeredContentURI] = await this.package.getLatest();
      registeredVersion.map(x => x.toNumber()).should.be.deep.eq([0,0,0])
      registeredDirectory.should.be.zeroAddress
      registeredContentURI.should.be.eq('0x')
    })

    it('returns full version info', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from })
      const [registeredVersion, registeredDirectory, registeredContentURI] = await this.package.getLatest();
      registeredVersion.map(x => x.toNumber()).should.be.deep.eq(version);
      registeredDirectory.should.be.equal(contractAddress)
      registeredContentURI.should.be.equal(contentURI)
    })

    for (const latestVersion of [[2,1,5], [2,2,3], [3,0,3]]) {
      it(`returns latest version ${latestVersion}`, async function () {
        await this.package.addVersion(latestVersion, contractAddress, contentURI, { from })
        await this.package.addVersion([1,0,0], contractAddress, contentURI, { from })
        await this.package.addVersion([2,1,4], contractAddress, contentURI, { from })
        const [registeredVersion] = await this.package.getLatest();
        registeredVersion.map(x => x.toNumber()).should.be.deep.eq(latestVersion);
      })
    }
  })

  describe('getLatestByMajor', function () {
    it('returns zero if no version for that major is registered', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from })
      const [registeredVersion, registeredDirectory, registeredContentURI] = await this.package.getLatestByMajor(3);
      registeredVersion.map(x => x.toNumber()).should.be.deep.eq([0,0,0])
      registeredDirectory.should.be.zeroAddress
      registeredContentURI.should.be.eq('0x')
    })

    it('returns full version info', async function () {
      await this.package.addVersion(version, contractAddress, contentURI, { from })
      const [registeredVersion, registeredDirectory, registeredContentURI] = await this.package.getLatestByMajor(1);
      registeredVersion.map(x => x.toNumber()).should.be.deep.eq(version);
      registeredDirectory.should.be.equal(contractAddress)
      registeredContentURI.should.be.equal(contentURI)
    })

    it('returns latest version by major', async function () {
      await this.package.addVersion([3,0,0], contractAddress, contentURI, { from })
      await this.package.addVersion([1,0,0], contractAddress, contentURI, { from })
      await this.package.addVersion([1,2,0], contractAddress, contentURI, { from })
      await this.package.addVersion([2,4,0], contractAddress, contentURI, { from })
      await this.package.addVersion([2,1,0], contractAddress, contentURI, { from })
      
      const [registeredVersionFor1] = await this.package.getLatestByMajor(1);
      registeredVersionFor1.map(x => x.toNumber()).should.be.deep.eq([1,2,0])
      const [registeredVersionFor2] = await this.package.getLatestByMajor(2);
      registeredVersionFor2.map(x => x.toNumber()).should.be.deep.eq([2,4,0])
      const [registeredVersionFor3] = await this.package.getLatestByMajor(3);
      registeredVersionFor3.map(x => x.toNumber()).should.be.deep.eq([3,0,0])
    })
  })
})
