pragma solidity ^0.4.21;

import "./versioning/ImplementationProvider.sol";
import "../upgradeability/AdminUpgradeabilityProxy.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title BaseApp
 * @dev Abstract base contract for the management of upgradeable user projects
 * @dev Handles the creation and upgrading of proxies 
 */
contract BaseApp is Ownable {
  // factory for proxy creation
  UpgradeabilityProxyFactory public factory;

  /**
   * @dev Constructor function
   * @param _factory Proxy factory
   */
  function BaseApp(UpgradeabilityProxyFactory _factory) public {
    require(address(_factory) != address(0));
    factory = _factory;
  }

  /**
   * @dev Abstract function for fetching the app's implementation provider
   * @return The app's implementation provider
   */
  function getProvider() internal view returns (ImplementationProvider);

  /**
   * @dev Gets the implementation address for a given contract name, provided by the implementation provider
   * @param contractName Name of the contract whose implementation address is desired
   * @return Address where the contract is implemented
   */
  function getImplementation(string contractName) public view returns (address) {
    return getProvider().getImplementation(contractName);
  }

  /**
   * @dev Creates a new proxy for the given contract
   * @param contractName Name of the contract for which a proxy is desired
   * @return Address of the new proxy
   */
  function create(string contractName) public returns (AdminUpgradeabilityProxy) {
    address implementation = getImplementation(contractName);
    return factory.createProxy(this, implementation);
  }

  /**
   * @dev Creates a new proxy for the given contract and forwards a function call to it
   * @dev Useful for initializing the proxied contract
   * @param contractName Name of the contract for which a proxy is desired
   * @param data Data to be sent as msg.data in the low level call. 
   * It should include the signature of the function to be called in the
   * implementation together with its parameters, as described in
   * https://solidity.readthedocs.io/en/develop/abi-spec.html#function-selector-and-argument-encoding.
   * @return Address of the new proxy
   */
   function createAndCall(string contractName, bytes data) payable public returns (AdminUpgradeabilityProxy) {
    address implementation = getImplementation(contractName);
    return factory.createProxyAndCall.value(msg.value)(this, implementation, data);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract
   * @param proxy Proxy to be upgraded
   * @param contractName Name of the contract with a new implmentation
   */
  function upgrade(AdminUpgradeabilityProxy proxy, string contractName) public onlyOwner {
    address implementation = getImplementation(contractName);
    proxy.upgradeTo(implementation);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract and forwards it the function call packed in data
   * @param proxy Proxy to be upgraded
   * @param contractName Name of the contract with a new implmentation
   * @param data Data to be sent as msg.data in the low level call.
   * It should include the signature of the function to be called in the
   * implementation together with its parameters, as described in 
   * https://solidity.readthedocs.io/en/develop/abi-spec.html#function-selector-and-argument-encoding.
   */
  function upgradeAndCall(AdminUpgradeabilityProxy proxy, string contractName, bytes data) payable public onlyOwner {
    address implementation = getImplementation(contractName);
    proxy.upgradeToAndCall.value(msg.value)(implementation, data);
  }

  /**
   * @dev Gets the implementation for one of the owned proxies.
   * @dev It's necessary to have this here because only the proxy owner can query it.
   * @return the address of the current implemetation of the given proxy
   */
  function getProxyImplementation(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxy.implementation();
  }

  /**
   * @dev Gets a proxy's admin. Necessary because only the admin can query it.
   * @return the address of the current proxy admin of the given proxy
   */
  function getProxyAdmin(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxy.admin();
  }
}
