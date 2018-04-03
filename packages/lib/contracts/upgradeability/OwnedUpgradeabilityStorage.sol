pragma solidity ^0.4.18;

import './UpgradeabilityStorage.sol';

/**
 * @title OwnedUpgradeabilityStorage
 * @dev This contract keeps track of the upgradeability owner
 */
contract OwnedUpgradeabilityStorage is UpgradeabilityStorage {
  // Owner of the contract
  address internal _upgradeabilityOwner;

  /**
  * @dev Constructor function
  */
  function OwnedUpgradeabilityStorage() public {}

  /**
   * @dev Sets the address of the owner
   */
  function setUpgradeabilityOwner(address newUpgradeabilityOwner) internal {
    _upgradeabilityOwner = newUpgradeabilityOwner;
  }
}
