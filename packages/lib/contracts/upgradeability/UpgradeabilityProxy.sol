pragma solidity ^0.4.18;

import './Proxy.sol';
import './UpgradeabilityStorage.sol';

/**
 * @title UpgradeabilityProxy
 * @dev This contract represents a proxy where the implementation address to which it will delegate can be upgraded
 */
contract UpgradeabilityProxy is Proxy, UpgradeabilityStorage {
  /**
  * @dev This event will be emitted every time the implementation gets upgraded
  * @param implementation representing the address of the upgraded implementation
  */
  event Upgraded(address indexed implementation);

  /**
  * @dev Constructor function
  */
  function UpgradeabilityProxy() public {}

  /**
  * @dev Upgrades the implementation address
  * @param newImplementation representing the address of the new implementation to be set
  */
  function _upgradeTo(address newImplementation) internal {
    require(newImplementation != address(0));
    require(_implementation != newImplementation);

    setImplementation(newImplementation);
    Upgraded(newImplementation);
  }
}
