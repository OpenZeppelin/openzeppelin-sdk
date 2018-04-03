pragma solidity ^0.4.18;

/**
 * @title UpgradeabilityStorage
 * @dev This contract holds all the necessary state variables to support the upgrade functionality
 */
contract UpgradeabilityStorage {
  // Address of the current implementation
  address internal _implementation;

  /**
  * @dev Constructor function
  */
  function UpgradeabilityStorage() public {}

  /**
  * @dev Tells the address of the current implementation
  * @return address of the current implementation
  */
  function implementation() public view returns (address) {
    return _implementation;
  }

  /**
   * @dev Sets the address of the current implementation
   */
  function setImplementation(address newImplementation) internal {
    _implementation = newImplementation;
  }
}
