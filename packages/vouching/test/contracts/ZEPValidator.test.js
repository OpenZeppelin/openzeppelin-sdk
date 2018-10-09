import { encodeCall } from 'zos-lib'

const ZEPToken = artifacts.require('ZEPToken');
const ZEPValidator = artifacts.require('ZEPValidator');
const BasicJurisdiction = artifacts.require('BasicJurisdiction');

contract.only('ZEPValidator', ([_, tokenOwner, another, jurisdictionOwner, validatorOwner, organizationAddress, attributedAddress, inattributedAddress]) => {

  const receiveTokensAttributeID = 999;
  const nullAddress = '0x0000000000000000000000000000000000000000';

  beforeEach('initialize jurisdiction', async function() {
    this.jurisdiction = await BasicJurisdiction.new()
    const initializeJurisdictionData = encodeCall('initialize', ['address'], [jurisdictionOwner])
    await this.jurisdiction.sendTransaction({ data: initializeJurisdictionData })
  });

  beforeEach('initialize validator', async function() {
    this.validator = await ZEPValidator.new()
    const initializeValidatorData = encodeCall('initialize', ['address', 'address', 'uint256'], [validatorOwner, this.jurisdiction.address, receiveTokensAttributeID])
    await this.validator.sendTransaction({ data: initializeValidatorData })
  });

  // beforeEach('initialize ZEP token', async function () {
  //   this.zepToken = await ZEPToken.new()
  //   const initializeData = encodeCall('initialize', ['address', 'address', 'uint256'], [tokenOwner, this.jurisdiction.address, receiveTokensAttributeID])
  //   await this.zepToken.sendTransaction({ data: initializeData })
  // });
  
  describe('when no organizations where added to the validator', async function() {
  
    it('validator organizations are initially empty', async function() {
      const orgs = await this.validator.getOrganizations();
      assert.strictEqual(orgs.length, 0);
    });

    it('validator gives empty data for organization query', async function() {
      const info = await this.validator.getOrganization(organizationAddress);
      assert.strictEqual(info[0], false); // exists
      assert.strictEqual(info[1].toNumber(), 0); // maximumAddresses
      assert.strictEqual(info[2], ''); // name
      assert.strictEqual(info[3].length, 0); // issuedAddresses
    });

  });

  describe('when the validator is added to the jurisdiction', async function() {
  
    beforeEach('add validator to jurisdiction', async function () {
      await this.jurisdiction.addValidator(this.validator.address, "ZEP Validator", { from: jurisdictionOwner })
      // await this.jurisdiction.addAttributeType(receiveTokensAttributeID, false, false, nullAddress, 0, 0, 0, "can transfer", { from: jurisdictionOwner })
      // await this.jurisdiction.addValidatorApproval(this.validator.address, receiveTokensAttributeID, { from: jurisdictionOwner })
      // await this.validator.addOrganization(organizationAddress, 100, "ZEP Org", { from: validatorOwner })
    });
    
    it('validator points to the correct jurisdiction address', async function() {
      const address = await this.validator.getJurisdictionAddress();
      assert.strictEqual(address, this.jurisdiction.address);
    });

    // describe('when an organization is added', async function() {
    
    // });

  });

  // it('attribute type can be added to jurisdiction', async function() {
    
  // });
  
  // it('validator can be added to jurisdiction', async function() {
    
  // });

  // it('validator can add an organization', async function() {
    
  // });
  
  
  // it('validator can be approved to issue target attribute', async function() {
    
  // });

  // it('OrganizationAdded event is logged correctly', async function() {
    
  // });
  
  // it('the organization address can be found', async function() {
    
  // });

  // it('validator gives correct data for organization query', async function() {
    
  // });
  
  // it('validator cannot add an organization with an empty address', async function() {
    
  // });
  
  // it('validator cannot add a duplicate organization', async function() {
    
  // });
  
  // it('validator can add multiple organizations', async function() {
    
  // });
  
  // it('non-owner cannot add an organization', async function() {
    
  // });

  // it('validator can change maximum address an organization can issue', async function() {
    
  // });
  
  // it('the organization addresses can still be found', async function() {
    
  // });
  
  // it('validator gives updated data for organization query', async function() {
    
  // });
  
  // it('non-owner cannot change maximum address an organization can issue', async function() {
    
  // });
  
  // it('validator contract can be paused', async function() {
   
  // });
  
  // it('organization cannot issue attributes to an address when paused', async function() {
    
  // });
  
  // it('validator contract can be unpaused', async function() {
    
  // });
  
  // it('organization can issue attributes to an address', async function() {
    
  // });
  
  // it('AttributeIssued event is logged correctly', async function() {
    
  // });
  
  // it('validator gives updated data for organization query', async function() {
    
  // });
  
  // it('non-organization cannot issue attributes to an address', async function() {
    
  // });
  
  // it('organization cannot issue attributes to an empty address', async function() {
    
  // });
  
  // it('organization cannot issue attributes to duplicate addresses', async function() {
    
  // });
  
  // it('organization can issue attributes to multiple address', async function() {
    
  // });
  
  // it('validator gives updated data for organization query', async function() {
    
  // });

});
