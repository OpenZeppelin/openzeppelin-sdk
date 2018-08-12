pragma solidity ^0.4.24;

import "./BaseApp.sol";
import "./versioning/ImplementationProvider.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title UnversionedApp
 * @dev Basic implementation of an upgradable app with no versioning.
 */
contract UnversionedApp is BaseApp {
  /*
   * @dev Providers for contract implementation addresses.
   */
  mapping(string => ImplementationProvider) internal providers;

  /**
   * @dev Emitted when a provider dependency is changed in the application.
   * @param providerName Name of the provider that changed.
   * @param implementation Address of the provider associated to the name.
   */
  event ProviderChanged(string providerName, address implementation);

  /**
   * @dev Constructor function.
   * @param _factory Proxy factory.
   */
  constructor(UpgradeabilityProxyFactory _factory) BaseApp(_factory) public { }

  /**
   * @dev Returns the provider for a given package name, or zero if not set.
   * @param packageName Name of the package to be retrieved.
   * @return The provider.
   */
  function getProvider(string packageName) public view returns (ImplementationProvider) {
    return providers[packageName];
  }

  /**
   * @dev Sets a new implementation provider.
   * @param packageName Name under which the provider is to be registered in the app.
   * @param _provider New implementation provider.
   */
  function setProvider(string packageName, ImplementationProvider _provider) public onlyOwner {
    require(address(_provider) != address(0), "Cannot set the implementation provider of an app to the zero address");
    providers[packageName] = _provider;
    emit ProviderChanged(packageName, _provider);
  }

  /**
   * @dev Unsets an existing provider. Reverts if the provider does not exist.
   * @param packageName Name of the provider to be removed.
   */
  function unsetProvider(string packageName) public onlyOwner {
    require(providers[packageName] != address(0), "Provider to unset not found");
    delete providers[packageName];
    emit ProviderChanged(packageName, address(0));
  }
}
