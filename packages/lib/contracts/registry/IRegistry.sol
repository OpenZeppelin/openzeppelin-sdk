pragma solidity ^0.4.18;

import '../upgradeability/OwnedUpgradeabilityProxy.sol';


/**
 * @title IRegistry
 * @dev This contract represents the interface of a registry contract
 */
interface IRegistry {
  /**
  * @dev This event will be emitted every time a new proxy is created
  * @param proxy representing the address of the proxy created
  */
  event ProxyCreated(address proxy);

  /**
  * @dev This event will be emitted every time a new implementation is registered
  * @param version representing the version name of the registered implementation
  * @param implementation representing the address of the registered implementation
  */
  event VersionAdded(string version, address implementation);

  /**
  * @dev Registers a new version with its implementation address
  * @param version representing the version name of the new implementation to be registered
  * @param implementation representing the address of the new implementation to be registered
  */
  function addVersion(string version, address implementation) public;

  /**
  * @dev Tells the address of the implementation for a given version
  * @param version to query the implementation of
  * @return address of the implementation registered for the given version
  */
  function getVersion(string version) public view returns (address);

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version
  * @param version representing the first version to be set for the proxy
  * @return address of the new proxy created
  */
  function createProxy(string version) public returns (OwnedUpgradeabilityProxy);

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version and call the new implementation
  * @param version representing the first version to be set for the proxy
  * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
  * signature of the implementation to be called with the needed payload
  * @return address of the new proxy created
  */
  function createProxyAndCall(string version, bytes data) public payable returns (OwnedUpgradeabilityProxy);
}
