pragma solidity ^0.4.18;

import './OwnedUpgradeabilityProxy.sol';

/**
 * @title UpgradeabilityProxyFactory
 * @dev This contracts provides required functionality to create upgradeability proxies
 */
contract UpgradeabilityProxyFactory {
  /**
  * @dev Constructor function
  */
  function UpgradeabilityProxyFactory() public {}

  /**
  * @dev This event will be emitted every time a new proxy is created
  * @param proxy representing the address of the proxy created
  */
  event ProxyCreated(address proxy);

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version
  * @param owner representing the owner of the proxy to be set
  * @param implementation representing the address of the initial implementation to be set
  * @return address of the new proxy created
  */
  function createProxy(address owner, address implementation) public returns (OwnedUpgradeabilityProxy) {
    OwnedUpgradeabilityProxy proxy = _createProxy();
    proxy.upgradeTo(implementation);
    proxy.transferProxyOwnership(owner);
    return proxy;
  }

  /**
  * @dev Creates an upgradeable proxy upgraded to an initial version and call the new implementation
  * @param owner representing the owner of the proxy to be set
  * @param implementation representing the address of the initial implementation to be set
  * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
  * signature of the implementation to be called with the needed payload
  * @return address of the new proxy created
  */
  function createProxyAndCall(address owner, address implementation, bytes data) public payable returns (OwnedUpgradeabilityProxy) {
    OwnedUpgradeabilityProxy proxy = _createProxy();
    proxy.upgradeToAndCall.value(msg.value)(implementation, data);
    proxy.transferProxyOwnership(owner);
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
