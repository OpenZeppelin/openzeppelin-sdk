'use strict'
require('./setup')
const deploy = require('../index.js')

import { Contracts } from 'zos-lib'
import shouldBehaveLikeDonations from './behaviors/Donations.behavior'
import shouldBehaveLikeDonationsWithTokens from './behaviors/DonationsWithTokens.behavior'

const DonationsV2 = Contracts.getFromLocal('DonationsV2');

contract('App', ([_, owner, donor, wallet]) => {
  const initialVersion = '0.0.1';
  const updatedVersion = '0.0.2';
  const contractName = 'Donations';

  describe('setup', function() {
    beforeEach('deploying project', async function() {
      this.project = await deploy.setupApp({owner});
    });

    describe('package', function() {
      beforeEach('loading package', async function () {
        this.package = await this.project.getProjectPackage()
      })
      describe('when queried for the initial version', function() {
        it('claims to have it', async function() {
          (await this.package.hasVersion(initialVersion)).should.be.true;
        });
      });

      describe('when queried for the updated version', function() {
        it('doesnt claim to have it', async function() {
          (await this.package.hasVersion(updatedVersion)).should.be.false;
        });
      });
    });
  });

  describe('version 0.0.1', function() {
    beforeEach(async function() {
      this.project = await deploy.setupApp({owner});
      this.directory = await this.project.getCurrentDirectory();
      this.donations = await deploy.deployVersion1(this.project, owner);
    });
    
    describe('directory', function() {
      describe('when queried for the implementation', function() {
        it('returns a valid address', async function() {
          const implementation = await this.directory.getImplementation(contractName)
          implementation.should.be.nonzeroAddress
        });
      });
    });

    describe('implementation', function() {
      shouldBehaveLikeDonations(owner, donor, wallet);
    });
  });

  describe('version 0.0.2', function() {
    const tokenName = 'DonationToken';
    const tokenSymbol = 'DON';

    beforeEach(async function() {
      this.project = await deploy.setupApp({owner});
      this.donations = await deploy.deployVersion1(this.project, owner);
      this.token = await deploy.deployVersion2(this.project, this.donations, { owner });
      this.donations = DonationsV2.at(this.donations.address);
    });

    // TODO: check that token owner is donations

    describe('implementation', function() {
      shouldBehaveLikeDonationsWithTokens(owner, donor, wallet, tokenName, tokenSymbol);
    });
  });
});
