pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-zos/contracts/ownership/Ownable.sol";
import "openzeppelin-zos/contracts/lifecycle/Pausable.sol";
import "tpl-contracts-zos/contracts/AttributeRegistry.sol";
import "tpl-contracts-zos/contracts/BasicJurisdictionInterface.sol";

/**
 * @title ZEPValidator
 * @dev TPL validating entity for the ZEPToken. Defines a series of organizations which can define a limited set of addresses that can receive ZEPTokens.
 */
contract ZEPValidator is Initializable, Ownable, Pausable {

  /**
   * @dev Emitted when an organization has been added to the validator.
   * @param organization Address of the organization that has been added.
   * @param name String representing the name of the organization that has been added.
   */
  event OrganizationAdded(address organization, string name);
  /**
   * @dev Emitted when an organization has issued the valid recipient attribute to an address.
   * @param organization Address of the organization that issued the attribute validation.
   * @param attributedAddress Address that received the attribute validation.
   */
  event AttributeIssued(address indexed organization, address attributedAddress);

  /**
   * @dev Registry interface, used to request attributes from a jurisdiction.
   */
  AttributeRegistry registry;

  /**
   * @dev jurisdiction interface, used to set attributes in the jurisdiction.
   */
  BasicJurisdictionInterface jurisdiction;

  /**
   * @dev Attribute id required by the ZEPToken in order to transfer tokens.
   */
  uint256 validAttributeID;

  /**
   * @dev Struct that represents organizations. Organizations are entities that can add attibutes to a limited number of addresses.
   */
  struct Organization {
    bool exists;
    uint248 maximumAddresses;
    string name;
    address[] addresses;
  }

  /**
   * @dev Addresses of all organizations that have been added to the validator.
   */
  address[] private organizationAddresses;

  /**
   * @dev Maps organization addresses to Organization structs.
   */
  mapping(address => Organization) private organizations;

  /**
   * @dev Initializer function. Called only once when a proxy for the contract is created. The initializer will attach the validator to a jurisdiction & set attribute.
   * @param _sender Address that will own the validator.
   * @param _jurisdiction Address of the TPL jurisdiction that the validator will act upon.
   * @param _validAttributeID uint256 of the TPL attribute id of the ZEPToken that will be controlled by the validator.
   */
  function initialize(
    address _sender,
    address _jurisdiction,
    uint256 _validAttributeID
  )
    initializer
    public
  {
    Ownable.initialize(_sender);
    Pausable.initialize(_sender);
    registry = AttributeRegistry(_jurisdiction);
    jurisdiction = BasicJurisdictionInterface(_jurisdiction);
    validAttributeID = _validAttributeID;
    // NOTE: we can require that the jurisdiction implements the right interface
    // using EIP-165 or that the contract is designated as a validator and has
    // authority to issue attributes of the specified type here if desired
  }

  /**
   * @dev Adds new organizations to the validator. Can only be performed by the owner of the validator.
   * @param _organization Address of the organization being added.
   * @param _maximumAddresses uint248 representing the maximum number of addresses a given organization can issue for ZEPToken recipient validation.
   * @param name String representing the name of the organization.
   */
  function addOrganization(
    address _organization,
    uint248 _maximumAddresses,
    string _name
  ) external onlyOwner {
    // check that an empty address was not provided by mistake
    require(_organization != address(0), "must supply a valid address");

    // prevent existing organizations from being overwritten
    require(
      organizations[_organization].exists == false,
      "an organization already exists at the provided address"
    );

    // set up the organization in the organizations mapping
    organizations[_organization].exists = true;
    organizations[_organization].maximumAddresses = _maximumAddresses;
    organizations[_organization].name = _name;
    
    // add the organization to the end of the organizationAddresses array
    organizationAddresses.push(_organization);

    // log the addition of the organization
    emit OrganizationAdded(_organization, _name);
  }

  /**
   * @dev The owner may modify the max number addresses a organization can issue. Can only be performed by the owner of the validator.
   * @param _organization Address of the organization whose maximum number of addresses is being modified.
   * @param _maximum uint248 New value being set for the maximum number of addresses that the organization in question can issue.
   */
  function setMaximumAddresses(
    address _organization,
    uint248 _maximum
  ) external onlyOwner {
    // make sure the organization exists
    require(
      organizations[_organization].exists == true,
      "an organization does not exist at the provided address"
    );

    // set the organization's maximum addresses; a value <= current freezes them
    organizations[_organization].maximumAddresses = _maximum;
  }

  /**
   * @dev An organization can add an attibute to an address if maximum isn't exceeded.
   * @param _who Address that the organization is validating for ZEPToken usage.
   */
  // (NOTE: this function would need to be payable if a jurisdiction fee is set)
  function issueAttribute(address _who) external whenNotPaused {

    // check that an empty address was not provided by mistake
    require(_who != address(0), "must supply a valid address");

    // make sure the request is coming from a valid organization
    require(
      organizations[msg.sender].exists == true,
      "only organizations may issue attributes"
    );

    // ensure that the maximum has not been reached yet
    uint256 maximum = uint256(organizations[msg.sender].maximumAddresses);
    require(
      organizations[msg.sender].addresses.length < maximum,
      "the organization is not permitted to issue any additional attributes"
    );
 
    // assign the attribute to the jurisdiction (NOTE: a value is not required)
    jurisdiction.addAttributeTo(_who, validAttributeID, 0);

    // ensure that the attribute was correctly assigned
    require(
      registry.hasAttribute(_who, validAttributeID) == true,
      "attribute addition was not accepted by the jurisdiction"
    );

    // add the address to the end of the organization's `addresses` array
    organizations[msg.sender].addresses.push(_who);
    
    // log the addition of the new attributed address
    emit AttributeIssued(msg.sender, _who);
  }

  /**
   * @dev Returns the address of the associated TPL jurisdiction for the validator.
   * @returns The address of the jurisdiction.
   */
  function getJurisdictionAddress() external view returns (address) {
    return address(jurisdiction);
  }

  /**
   * @dev External interface for getting a list of organization addresses.
   * @dev Returns the addresses of all the organizations registered in the validator.
   * @returns An array with all the addresses.
   */
  function getOrganizations() external view returns (address[] addresses) {
    return organizationAddresses;
  }

  /**
   * @dev Returns a tuple representing the Organization struct for a given organization.
   * @param _organization Address of the organization whose information is being queried.
   * @returns a tuple containing the information of the organization.
   */
  function getOrganization(address _organization) external view returns (
    bool exists,
    uint248 maximumAddresses,
    string name,
    address[] issuedAddresses
  ) {
    return (
      organizations[_organization].exists,
      organizations[_organization].maximumAddresses,
      organizations[_organization].name,
      organizations[_organization].addresses
    );
  }
}
