pragma solidity ^0.4.18;

import '../Registry.sol';
import './Proxy.sol';
import './UpgradeabilityStorage.sol';

/**
 * @title UpgradeabilityProxy
 * @dev This contract represents a proxy where the implementation address to which it will delegate can be upgraded
 */
contract UpgradeabilityProxy is Proxy, UpgradeabilityStorage {
  /**
  * @dev This event will be emitted every time the implementation gets upgraded
  * @param version representing the version name of the upgraded implementation
  * @param implementation representing the address of the upgraded implementation
  */
  event Upgraded(string version, address indexed implementation);

  function UpgradeabilityProxy(Registry registry) 
    Proxy()
    UpgradeabilityStorage(registry)
    public
  {}

  /**
  * @dev Upgrades the implementation address
  * @param version representing the version name of the new implementation to be set
  */
  function _upgradeTo(string version) internal {
    address implementation = registry().getVersion(version);
    require(implementation != address(0));
    require(_implementation != implementation);

    _version = version;
    _implementation = implementation;
    Upgraded(version, implementation);
  }
}
