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
   * @dev Provider that stores the contract implementation addresses.
   */
  ImplementationProvider internal provider;

  /**
   * @dev Constructor function.
   * @param _provider Implementation provider.
   * @param _factory Proxy factory.
   */
  constructor(ImplementationProvider _provider, UpgradeabilityProxyFactory _factory) BaseApp(_factory) public {
    setProvider(_provider);
  }

  /**
   * @dev Returns the provider used by the app.
   * @return The provider.
   */
  function getProvider() internal view returns (ImplementationProvider) {
    return provider;
  }

  /**
   * @dev Sets a new implementation provider.
   * @param _provider New implementation provider
   */
  function setProvider(ImplementationProvider _provider) public onlyOwner {
    require(address(_provider) != address(0), "Cannot set the implementation provider of an app to the zero address");
    provider = _provider;
  }
}
