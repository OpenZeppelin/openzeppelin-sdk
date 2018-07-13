pragma solidity ^0.4.24;

import "./versioning/ImplementationProvider.sol";
import "../upgradeability/AdminUpgradeabilityProxy.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title BaseApp
 * @dev Abstract base contract for upgradeable applications.
 * It handles the creation and upgrading of proxies.
 */
contract BaseApp is Ownable {
  /// @dev Factory that creates proxies.
  UpgradeabilityProxyFactory public factory;

  /**
   * @dev Constructor function
   * @param _factory Proxy factory
   */
  constructor(UpgradeabilityProxyFactory _factory) public {
    require(address(_factory) != address(0), "Cannot set the proxy factory of an app to the zero address");
    factory = _factory;
  }

  /**
   * @dev Abstract function to return the implementation provider.
   * @return The implementation provider.
   */
  function getProvider() internal view returns (ImplementationProvider);

  /**
   * @dev Returns the implementation address for a given contract name, provided by the `ImplementationProvider`.
   * @param contractName Name of the contract.
   * @return Address where the contract is implemented.
   */
  function getImplementation(string contractName) public view returns (address) {
    return getProvider().getImplementation(contractName);
  }

  /**
   * @dev Creates a new proxy for the given contract.
   * @param contractName Name of the contract.
   * @return Address of the new proxy.
   */
  function create(string contractName) public returns (AdminUpgradeabilityProxy) {
    address implementation = getImplementation(contractName);
    return factory.createProxy(this, implementation);
  }

  /**
   * @dev Creates a new proxy for the given contract and forwards a function call to it.
   * This is useful to initialize the proxied contract.
   * @param contractName Name of the contract.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be
   * called, as described in
   * https://solidity.readthedocs.io/en/develop/abi-spec.html#function-selector-and-argument-encoding.
   * @return Address of the new proxy.
   */
   function createAndCall(string contractName, bytes data) payable public returns (AdminUpgradeabilityProxy) {
    address implementation = getImplementation(contractName);
    return factory.createProxyAndCall.value(msg.value)(this, implementation, data);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract.
   * @param proxy Proxy to be upgraded.
   * @param contractName Name of the contract.
   */
  function upgrade(AdminUpgradeabilityProxy proxy, string contractName) public onlyOwner {
    address implementation = getImplementation(contractName);
    proxy.upgradeTo(implementation);
  }

  /**
   * @dev Upgrades a proxy to the newest implementation of a contract and forwards a function call to it.
   * This is useful to initialize the proxied contract.
   * @param proxy Proxy to be upgraded.
   * @param contractName Name of the contract.
   * @param data Data to send as msg.data in the low level call.
   * It should include the signature and the parameters of the function to be
   * called, as described in
   * https://solidity.readthedocs.io/en/develop/abi-spec.html#function-selector-and-argument-encoding.
   */
  function upgradeAndCall(AdminUpgradeabilityProxy proxy, string contractName, bytes data) payable public onlyOwner {
    address implementation = getImplementation(contractName);
    proxy.upgradeToAndCall.value(msg.value)(implementation, data);
  }

  /**
   * @dev Returns the current implementation of a proxy.
   * This is needed because only the proxy admin can query it.
   * @return The address of the current implementation of the proxy.
   */
  function getProxyImplementation(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxy.implementation();
  }

  /**
   * @dev Returns the admin of a proxy.
   * Only the admin can query it.
   * @return The address of the current admin of the proxy.
   */
  function getProxyAdmin(AdminUpgradeabilityProxy proxy) public view returns (address) {
    return proxy.admin();
  }

  /**
   * @dev Changes the admin of a proxy.
   * @param proxy Proxy to change admin.
   * @param newAdmin Address to transfer proxy administration to.
   */
  function changeProxyAdmin(AdminUpgradeabilityProxy proxy, address newAdmin) public onlyOwner {
    proxy.changeAdmin(newAdmin);
  }
}
