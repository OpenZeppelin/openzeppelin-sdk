pragma solidity ^0.4.18;

import './Registry.sol';
import './ownership/Ownable.sol';
import './upgradeability/OwnedUpgradeabilityProxy.sol';
import './upgradeability/UpgradeabilityProxyFactory.sol';

/**
 * @title ProxyController
 * @dev This contract manages proxies creation and upgrades through a registry of versions
 */
contract ProxyController is Ownable {
  // Versions registry
  Registry private _registry;

  // Managed proxy
  UpgradeabilityProxyFactory private _factory;

  /**
   * @dev Constructor function
   * @param registry representing the versions registry
   * @param factory representing the proxy factory to be used by the controller
   */
  function ProxyController(Registry registry, UpgradeabilityProxyFactory factory) public {
    require(factory != address(0));
    require(registry != address(0));
    _factory = factory;
    _registry = registry;
  }

  /**
   * @dev Tells the versions registry
   * @return address of the registry
   */
  function registry() public view returns (Registry) {
    return _registry;
  }

  /**
   * @dev Tells the proxy factory
   * @return address of the factory
   */
  function factory() public view returns (UpgradeabilityProxyFactory) {
    return _factory;
  }

  /**
   * @dev Allows the upgrader owner to upgrade a proxy to a new version.
   * @param version representing =the version name of the new implementation to be set.
   */
  function upgradeTo(OwnedUpgradeabilityProxy proxy, string version) public onlyOwner {
    address _implementation = implementation(version);
    proxy.upgradeTo(_implementation);
  }

  /**
   * @dev Allows the upgrader owner to upgrade a proxy to a new version and call the new implementation
   * to initialize whatever is needed through a low level call.
   * @param version representing the version of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload.
   */
  function upgradeToAndCall(OwnedUpgradeabilityProxy proxy, string version, bytes data) payable public onlyOwner {
    address _implementation = implementation(version);
    proxy.upgradeToAndCall(_implementation, data);
  }

  /**
   * @dev Creates an upgradeability proxy upgraded to an initial version
   * @param version representing the version of the new implementation to be set.
   * @return address of the new proxy.
   */
  function create(string version) public returns (OwnedUpgradeabilityProxy) {
    address _implementation = implementation(version);
    return factory().createProxy(this, _implementation);
  }

  /**
   * @dev Creates an upgradeability proxy upgraded to an initial version and call the new implementation
   * @param version representing the version of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   * @return address of the new proxy.
   */
  function createAndCall(string version, bytes data) payable public returns (OwnedUpgradeabilityProxy) {
    address _implementation = implementation(version);
    return factory().createProxyAndCall(this, _implementation, data);
  }

  /**
   * @dev Internal function to fetch an implementation address from the registry and validate it
   * @param version representing the version of the new implementation to be queried.
   */
  function implementation(string version) internal returns (address) {
    address _implementation = registry().getImplementation(version);
    require(_implementation != address(0));
    return _implementation;
  }
}
