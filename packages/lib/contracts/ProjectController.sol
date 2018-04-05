pragma solidity ^0.4.18;

import './Registry.sol';
import './ImplementationProvider.sol';
import './ownership/Ownable.sol';
import './upgradeability/OwnedUpgradeabilityProxy.sol';
import './upgradeability/UpgradeabilityProxyFactory.sol';

/**
 * @title ProjectController
 * @dev This contract manages proxies creation and upgrades through a registry of versions
 */
contract ProjectController is ImplementationProvider, Ownable {
  // Project name hash
  bytes32 private _projectNameHash;

  // Versions registry
  Registry private _registry;

  // Managed proxy
  UpgradeabilityProxyFactory private _factory;

  // Fallback implementation provider
  ImplementationProvider private _fallbackProvider;

  /**
   * @dev Constructor function
   * @param projectName representing the name of the project
   * @param registry representing the versions registry
   * @param factory representing the proxy factory to be used by the controller
   * @param fallbackProvider representing an optional implementation provider
   */
  function ProjectController(
    string projectName,
    Registry registry,
    UpgradeabilityProxyFactory factory,
    ImplementationProvider fallbackProvider
  ) public {
    require(factory != address(0));
    require(registry != address(0));
    require(bytes(projectName).length != 0);

    _factory = factory;
    _registry = registry;
    _projectNameHash = keccak256(projectName);
    _fallbackProvider = fallbackProvider;
  }

  /**
   * @dev Tells the hash of the project name
   * @return bytes32 representing the hash of the project name
   */
  function projectNameHash() public view returns (bytes32) {
    return _projectNameHash;
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
   * @dev Tells the fallback implementation provider
   * @return address of the fallback implementation provider
   */
  function fallbackProvider() public view returns (ImplementationProvider) {
    return _fallbackProvider;
  }

  /**
   * @dev Allows the upgrader owner to upgrade a proxy to a new version.
   * @param distribution representing the distribution name of the new implementation to be set.
   * @param version representing the version of the new implementation to be set.
   * @param contractName representing the contract name of the new implementation to be set.
   */
  function upgradeTo(OwnedUpgradeabilityProxy proxy, string distribution, string version, string contractName) public onlyOwner {
    address _implementation = getImplementationOrRevert(distribution, version, contractName);
    proxy.upgradeTo(_implementation);
  }

  /**
   * @dev Allows the upgrader owner to upgrade a proxy to a new version and call the new implementation
   * to initialize whatever is needed through a low level call.
   * @param distribution representing the distribution name of the new implementation to be set.
   * @param version representing the version of the new implementation to be set.
   * @param contractName representing the contract name of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload.
   */
  function upgradeToAndCall(OwnedUpgradeabilityProxy proxy, string distribution, string version, string contractName, bytes data) payable public onlyOwner {
    address _implementation = getImplementationOrRevert(distribution, version, contractName);
    proxy.upgradeToAndCall.value(msg.value)(_implementation, data);
  }

  /**
   * @dev Creates an upgradeability proxy upgraded to an initial version
   * @param distribution representing the distribution name of the new implementation to be set.
   * @param version representing the version of the new implementation to be set.
   * @param contractName representing the contract name of the new implementation to be set.
   * @return address of the new proxy.
   */
  function create(string distribution, string version, string contractName) public returns (OwnedUpgradeabilityProxy) {
    address _implementation = getImplementationOrRevert(distribution, version, contractName);
    return _factory.createProxy(this, _implementation);
  }

  /**
   * @dev Creates an upgradeability proxy upgraded to an initial version and call the new implementation
   * @param distribution representing the distribution name of the new implementation to be set.
   * @param version representing the version of the new implementation to be set.
   * @param contractName representing the contract name of the new implementation to be set.
   * @param data represents the msg.data to bet sent in the low level call. This parameter may include the function
   * signature of the implementation to be called with the needed payload
   * @return address of the new proxy.
   */
  function createAndCall(string distribution, string version, string contractName, bytes data) payable public returns (OwnedUpgradeabilityProxy) {
    address _implementation = getImplementationOrRevert(distribution, version, contractName);
    return _factory.createProxyAndCall.value(msg.value)(this, _implementation, data);
  }

  /**
   * @dev Fetches an implementation address from the registry or the fallback provider
   * @param distribution representing the distribution name of the implementation to be queried.
   * @param version representing the version of the implementation to be queried.
   * @param contractName representing the contract name of the implementation to be queried.
   * @return address of the requested implementation.
   */
  function getImplementation(string distribution, string version, string contractName) public view returns (address) {
    if(keccak256(distribution) == _projectNameHash) return _registry.getImplementation(version, contractName);
    if(_fallbackProvider != address(0)) return _fallbackProvider.getImplementation(distribution, version, contractName);
    else return address(0);
  }

  /**
   * @dev Internal function to fetch an implementation address from the registry and validate it
   * @param distribution representing the distribution name of the implementation to be queried.
   * @param version representing the version of the implementation to be queried.
   * @param contractName representing the contract name of the implementation to be queried.
   * @return address of the requested implementation.
   */
  function getImplementationOrRevert(string distribution, string version, string contractName) internal view returns (address) {
    address _implementation = getImplementation(distribution, version, contractName);
    require(_implementation != address(0));
    return _implementation;
  }
}
