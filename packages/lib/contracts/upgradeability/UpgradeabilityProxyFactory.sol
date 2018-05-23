pragma solidity ^0.4.21;

import './AdminUpgradeabilityProxy.sol';

/**
 * @title UpgradeabilityProxyFactory
 * @dev Factory to create upgradeability proxies.
 */
contract UpgradeabilityProxyFactory {
  /**
   * @dev Emitted when a new proxy is created.
   * @param proxy Address of the created proxy.
   */
  event ProxyCreated(address proxy);

  /**
   * @dev Creates an upgradeability proxy with an initial implementation.
   * @param owner Proxy owner.
   * @param implementation Address of the initial implementation.
   * @return Address of the new proxy.
   */
  function createProxy(address owner, address implementation) public returns (AdminUpgradeabilityProxy) {
    AdminUpgradeabilityProxy proxy = _createProxy(implementation);
    proxy.changeAdmin(owner);
    return proxy;
  }

  /**
   * @dev Creates an upgradeability proxy with an initial implementation and calls it.
   * This is useful to initialize the proxied contract.
   * @param owner Proxy owner.
   * @param implementation Address of the initial implementation.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be
   * called, as described in
   * https://solidity.readthedocs.io/en/develop/abi-spec.html#function-selector-and-argument-encoding.
   * @return Address of the new proxy.
   */
  function createProxyAndCall(address owner, address implementation, bytes data) public payable returns (AdminUpgradeabilityProxy) {
    AdminUpgradeabilityProxy proxy = _createProxy(implementation);
    proxy.changeAdmin(owner);
    require(address(proxy).call.value(msg.value)(data));
    return proxy;
  }

  /**
   * @dev Internal function to create an upgradeable proxy.
   * @param implementation Address of the initial implementation.
   * @return Address of the new proxy.
   */
  function _createProxy(address implementation) internal returns (AdminUpgradeabilityProxy) {
    AdminUpgradeabilityProxy proxy = new AdminUpgradeabilityProxy(implementation);
    emit ProxyCreated(proxy);
    return proxy;
  }
}
