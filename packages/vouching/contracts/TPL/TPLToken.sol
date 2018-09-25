pragma solidity ^0.4.24;

import "openzeppelin-zos/contracts/token/ERC20/ERC20.sol";
import "./AttributeRegistry.sol";

contract TPLToken is ERC20 {

  // declare registry interface, used to request attributes from a jurisdiction
  AttributeRegistry registry;

  // declare attribute ID required in order to receive transferred tokens
  uint256 validRecipientAttributeId;

  // initialize token with a jurisdiction address and an initial token balance
  function initialize(
    AttributeRegistry _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  )
    initializer
    public
  {
    registry = _jurisdictionAddress;
    validRecipientAttributeId = _validRecipientAttributeId;
  }

  // provide getter function for finding the registry address the token is using
  function getRegistryAddress() external view returns (address) {
    return address(registry);
  }

  // in order to transfer tokens, the receiver must be valid
  function canTransfer(address _to, uint256 _value) public view returns (bool) {
    _value;
    return registry.hasAttribute(_to, validRecipientAttributeId);
  }

  // in order to transfer tokens via transferFrom, the receiver must be valid
  function canTransferFrom(
    address _from,
    address _to,
    uint256 _value
  ) public view returns (bool) {
    _from;
    _value;
    return registry.hasAttribute(_to, validRecipientAttributeId);
  }

  // check that target is allowed to receive tokens before enabling the transfer
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(registry.hasAttribute(_to, validRecipientAttributeId));
    super.transfer(_to, _value);
  }

  // check that the transfer is valid before enabling approved transfers as well
  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  ) public returns (bool) {
    require(registry.hasAttribute(_to, validRecipientAttributeId));
    super.transferFrom(_from, _to, _value);
  }

}