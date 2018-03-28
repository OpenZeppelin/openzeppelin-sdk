pragma solidity ^0.4.18;

import './UpgradeabilityStorage.sol';
import '../Registry.sol';

/**
 * @title OwnedUpgradeabilityStorage
 * @dev This contract keeps track of the upgradeability owner
 */
contract OwnedUpgradeabilityStorage is UpgradeabilityStorage {
  // Owner of the contract
  address public upgradeabilityOwner;

  /**
  * @dev Constructor function
  */
  function OwnedUpgradeabilityStorage(Registry registry) 
    UpgradeabilityStorage(registry)
    public
  {}

  /**
   * @dev Sets the address of the owner
   */
  function setUpgradeabilityOwner(address newUpgradeabilityOwner) internal {
    upgradeabilityOwner = newUpgradeabilityOwner;
  }
}
