pragma solidity ^0.4.18;

import './IRegistry.sol';
import '../upgradeability/OwnedUpgradeabilityProxy.sol';


/**
 * @title Registry
 * @dev This contract works as a registry of versions, it holds the implementations for the registered versions.
 */
contract Registry is IRegistry {
  // Mapping of versions to implementations of different functions
  mapping (string => address) private versions;

  /**
  * @dev Registers a new version with its implementation address
  * @param version representing the version name of the new implementation to be registered
  * @param implementation representing the address of the new implementation to be registered
  */
  function addVersion(string version, address implementation) public {
    require(versions[version] == address(0));
    require(implementation != address(0));
    versions[version] = implementation;
    VersionAdded(version, implementation);
  }

  /**
  * @dev Tells the address of the implementation for a given version
  * @param version to query the implementation of
  * @return address of the implementation registered for the given version
  */
  function getVersion(string version) public view returns (address) {
    return versions[version];
  }

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version
  * @param version representing the first version to be set for the proxy
  * @return address of the new proxy created
  */
  function createProxy(string version) public returns (OwnedUpgradeabilityProxy) {
    OwnedUpgradeabilityProxy proxy = _createProxy();
    proxy.upgradeTo(version);
    proxy.transferProxyOwnership(msg.sender);
    return proxy;
  }

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version and call the new implementation
  * @param version representing the first version to be set for the proxy
  * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
  * signature of the implementation to be called with the needed payload
  * @return address of the new proxy created
  */
  function createProxyAndCall(string version, bytes data) public payable returns (OwnedUpgradeabilityProxy) {
    OwnedUpgradeabilityProxy proxy = _createProxy();
    proxy.upgradeToAndCall.value(msg.value)(version, data);
    proxy.transferProxyOwnership(msg.sender);
    return proxy;
  }

  /**
  * @dev Internal function to create an upgradeable proxy
  * @return address of the new proxy created
  */
  function _createProxy() internal returns (OwnedUpgradeabilityProxy) {
    OwnedUpgradeabilityProxy proxy = new OwnedUpgradeabilityProxy();
    ProxyCreated(proxy);
    return proxy;
  }
}
