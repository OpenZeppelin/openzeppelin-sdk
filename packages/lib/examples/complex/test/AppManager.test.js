const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy.sol');
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory');
const Package = artifacts.require('Package');
const AppDirectory = artifacts.require('AppDirectory');
const ContractDirectory = artifacts.require('ContractDirectory');
const AppManager = artifacts.require('PackagedAppManager');
const MintableERC721Token = artifacts.require('MintableERC721Token');

const DonationsV1 = artifacts.require('DonationsV1');
const DonationsV2 = artifacts.require('DonationsV2');

const decodeLogs = require('zos-lib').decodeLogs;
const encodeCall = require('zos-lib').encodeCall;
const validateAddress = require('./helpers/validateAddress.js');
const shouldBehaveLikeDonations = require('./Donations.behavior.js');
const shouldBehaveLikeDonationsWithTokens = require('./DonationsWithTokens.behavior.js');
const should = require('chai').should();
const deploy = require('../index.js');

contract('AppManager', ([_, owner, donor, wallet]) => {

  let initialVersion = '0.0.1';
  let updatedVersion = '0.0.2';
  let contractName = "Donations";
  let tokenClass = 'MintableERC721Token';
  let tokenName = 'DonationToken';
  let tokenSymbol = 'DON';

  describe('setup', function() {

    beforeEach(async function() {
      this.appManager = await deploy.setupAppManager({owner});
    });

    describe('package', function() {

      describe('when queried for the initial version', function() {
        it('claims to have it', async function() {
          (await this.appManager.package.hasVersion(initialVersion)).should.be.true;
        });
      });

      describe('when queried for the updated version', function() {
        it('doesnt claim to have it', async function() {
          (await this.appManager.package.hasVersion(updatedVersion)).should.be.false;
        });
      });

    });

  });

  describe('version 0.0.1', function() {
    
    beforeEach(async function() {
      this.appManager = await deploy.setupAppManager({owner});
      this.donations = await deploy.deployVersion1(this.appManager, {owner});
    });
    
    describe('directory', function() {

      describe('when queried for the implementation', function() {

        it('returns a valid address', async function() {
          validateAddress(await this.appManager.directories[initialVersion].getImplementation(contractName)).should.be.true;
        });
      });
    });

    describe('implementation', function() {
      shouldBehaveLikeDonations(owner, donor, wallet);
    });
  });

  describe('version 0.0.2', function() {

    let tokenName = 'DonationToken';
    let tokenSymbol = 'DON';

    beforeEach(async function() {
      this.appManager = await deploy.setupAppManager({owner});
      this.donations = await deploy.deployVersion1(this.appManager, {owner});
      this.token = await deploy.deployVersion2(this.appManager, this.donations, {owner});
      this.donations = DonationsV2.at(this.donations.address);
    });

    // TODO: check that token owner is donations

    describe('implementation', function() {
      shouldBehaveLikeDonationsWithTokens(owner, donor, wallet, tokenName, tokenSymbol);
    });
  });
});
