'use strict';
require('../../setup');

import Contracts from '../../../src/artifacts/Contracts';
import assertRevert from '../../../src/test/helpers/assertRevert';
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable';
import { ZERO_ADDRESS } from '../../../src/utils/Addresses';
import utils from 'web3-utils';

const Package = Contracts.getFromLocal('Package');

contract('Package', accounts => {
  accounts = accounts.map(utils.toChecksumAddress); // Required by Web3 v1.x.

  const [
    _,
    owner,
    anotherAddress,
    contractAddress,
    anotherContractAddress,
  ] = accounts;

  const version = [1, 0, 0];
  const anotherVersion = [2, 0, 0];
  const contentURI = '0x102030';
  const anotherContentURI = '0x405060';
  const from = owner;

  beforeEach(async function() {
    this.package = await Package.new({ from: owner });
  });

  describe('ownership', function() {
    beforeEach(function() {
      this.ownable = this.package;
    });

    shouldBehaveLikeOwnable(owner, anotherAddress);
  });

  describe('addVersion', function() {
    it('registers given implementation directory', async function() {
      const { events } = await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });

      const {
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getVersion(version).call();
      registeredDirectory.should.be.equal(contractAddress);
      registeredContentURI.should.eq(contentURI);

      const event = events['VersionAdded'];
      expect(event).to.be.an('object');
      event.returnValues.semanticVersion.should.be.semverEqual(version);
      event.returnValues.contractAddress.should.be.equal(contractAddress);
      event.returnValues.contentURI.should.be.equal(contentURI);
    });

    it('registers multiple versions', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });
      await this.package.methods
        .addVersion(anotherVersion, anotherContractAddress, anotherContentURI)
        .send({ from });

      const {
        contractAddress: newRegisteredDirectory,
        contentURI: newRegisteredContentURI,
      } = await this.package.methods.getVersion(anotherVersion).call();
      newRegisteredDirectory.should.be.equal(anotherContractAddress);
      newRegisteredContentURI.should.eq(anotherContentURI);
    });

    it('accepts empty content URI', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, Buffer.from(''))
        .send({ from });
      const {
        contractAddress: _registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getVersion(version).call();
      assert.equal(registeredContentURI, null);
    });

    it('reverts if contract address is zero', async function() {
      await assertRevert(
        this.package.methods
          .addVersion(version, ZERO_ADDRESS, contentURI)
          .send({ from }),
      );
    });

    it('reverts if version is zero', async function() {
      await assertRevert(
        this.package.methods
          .addVersion([0, 0, 0], contractAddress, contentURI)
          .send({ from }),
      );
    });

    it('reverts if re-registering version', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });
      await assertRevert(
        this.package.methods
          .addVersion(version, anotherContractAddress, contentURI)
          .send({ from }),
      );
    });

    it('reverts if called from another address', async function() {
      await assertRevert(
        this.package.methods
          .addVersion(version, contractAddress, contentURI)
          .send({ from: anotherAddress }),
      );
    });
  });

  describe('getVersion', function() {
    it('returns the registered version', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from: owner });
      const {
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getVersion(version).call();
      registeredDirectory.should.be.equal(contractAddress);
      registeredContentURI.should.be.equal(contentURI);
    });

    it('returns zero if version is not registered', async function() {
      const {
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getVersion(version).call();
      registeredDirectory.should.be.zeroAddress;
      assert.equal(registeredContentURI, null);
    });
  });

  describe('getContract', function() {
    it('returns the registered contract', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from: owner });
      const registeredDirectory = await this.package.methods
        .getContract(version)
        .call();
      registeredDirectory.should.be.equal(contractAddress);
    });

    it('returns zero address if version is not registered', async function() {
      const registeredDirectory = await this.package.methods
        .getContract(version)
        .call();
      registeredDirectory.should.be.zeroAddress;
    });
  });

  describe('hasVersion', function() {
    it('returns true if version is registered', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from: owner });
      const hasVersion = await this.package.methods.hasVersion(version).call();
      hasVersion.should.be.true;
    });

    it('returns false if version is not registered', async function() {
      const hasVersion = await this.package.methods.hasVersion(version).call();
      hasVersion.should.be.false;
    });
  });

  describe('getLatest', function() {
    it('returns zero if no versions registered', async function() {
      const {
        semanticVersion: registeredVersion,
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getLatest().call();
      registeredVersion.should.be.semverEqual([0, 0, 0]);
      registeredDirectory.should.be.zeroAddress;
      assert.equal(registeredContentURI, null);
    });

    it('returns full version info', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });
      const {
        semanticVersion: registeredVersion,
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getLatest().call();
      registeredVersion.should.be.semverEqual(version);
      registeredDirectory.should.be.equal(contractAddress);
      registeredContentURI.should.be.equal(contentURI);
    });

    for (const latestVersion of [[2, 1, 5], [2, 2, 3], [3, 0, 3]]) {
      it(`returns latest version ${latestVersion}`, async function() {
        await this.package.methods
          .addVersion(latestVersion, contractAddress, contentURI)
          .send({ from });
        await this.package.methods
          .addVersion([1, 0, 0], contractAddress, contentURI)
          .send({ from });
        await this.package.methods
          .addVersion([2, 1, 4], contractAddress, contentURI)
          .send({ from });
        const {
          semanticVersion: registeredVersion,
        } = await this.package.methods.getLatest().call();
        registeredVersion.should.be.semverEqual(latestVersion);
      });
    }
  });

  describe('getLatestByMajor', function() {
    it('returns zero if no version for that major is registered', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });
      const {
        semanticVersion: registeredVersion,
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getLatestByMajor(3).call();
      registeredVersion.should.be.semverEqual([0, 0, 0]);
      registeredDirectory.should.be.zeroAddress;
      assert.equal(registeredContentURI, null);
    });

    it('returns full version info', async function() {
      await this.package.methods
        .addVersion(version, contractAddress, contentURI)
        .send({ from });
      const {
        semanticVersion: registeredVersion,
        contractAddress: registeredDirectory,
        contentURI: registeredContentURI,
      } = await this.package.methods.getLatestByMajor(1).call();
      registeredVersion.should.be.semverEqual(version);
      registeredDirectory.should.be.equal(contractAddress);
      registeredContentURI.should.be.equal(contentURI);
    });

    it('returns latest version by major', async function() {
      await this.package.methods
        .addVersion([3, 0, 0], contractAddress, contentURI)
        .send({ from });
      await this.package.methods
        .addVersion([1, 0, 0], contractAddress, contentURI)
        .send({ from });
      await this.package.methods
        .addVersion([1, 2, 0], contractAddress, contentURI)
        .send({ from });
      await this.package.methods
        .addVersion([2, 4, 0], contractAddress, contentURI)
        .send({ from });
      await this.package.methods
        .addVersion([2, 1, 0], contractAddress, contentURI)
        .send({ from });

      const {
        semanticVersion: registeredVersionFor1,
      } = await this.package.methods.getLatestByMajor(1).call();
      registeredVersionFor1.should.be.semverEqual([1, 2, 0]);
      const {
        semanticVersion: registeredVersionFor2,
      } = await this.package.methods.getLatestByMajor(2).call();
      registeredVersionFor2.should.be.semverEqual([2, 4, 0]);
      const {
        semanticVersion: registeredVersionFor3,
      } = await this.package.methods.getLatestByMajor(3).call();
      registeredVersionFor3.should.be.semverEqual([3, 0, 0]);
    });
  });
});
