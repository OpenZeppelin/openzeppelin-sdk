pragma solidity ^0.4.18;

import './upgradeability/OwnedUpgradeabilityProxy.sol';
import './Registry.sol';

/**
 * @title Factory
 * @dev This contracts provides required functionality to create upgradeability proxies
 */
contract Factory {
  // Versions registry
  Registry internal _registry;

  /**
  * @dev Constructor function
  */
  function Factory(Registry registry) public {
    _registry = registry;
  }

  /**
  * @dev Tells the address of the registry
  * @return address of the registry
  */
  function registry() public view returns (Registry) {
    return _registry;
  }

  /**
  * @dev This event will be emitted every time a new proxy is created
  * @param proxy representing the address of the proxy created
  */
  event ProxyCreated(address proxy);

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
    OwnedUpgradeabilityProxy proxy = new OwnedUpgradeabilityProxy(_registry);
    ProxyCreated(proxy);
    return proxy;
  }
}
