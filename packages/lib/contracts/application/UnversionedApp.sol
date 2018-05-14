pragma solidity ^0.4.21;

import "./BaseApp.sol";
import "./versioning/ImplementationProvider.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title UnversionedApp
 * @dev Basic implementation of an upgradable app with no versioning
 */
contract UnversionedApp is BaseApp {
  /*
   * @dev stores the contract implementation addresses
   */
  ImplementationProvider internal provider;

  /**
   * @dev Constructor function
   * @param _provider Implementation provider
   * @param _factory Proxy factory
   */
  function UnversionedApp(ImplementationProvider _provider, UpgradeabilityProxyFactory _factory)
    BaseApp(_factory)
    public
  {
    setProvider(_provider);
  }

  /**
   * @return Implementation provider used by the app
   */
  function getProvider() internal view returns (ImplementationProvider) {
    return provider;
  }

  /**
   * @dev Sets a new implementation provider
   * @param _provider New implementation provider
   */
  function setProvider(ImplementationProvider _provider) public onlyOwner {
    require(address(_provider) != address(0));
    provider = _provider;
  }
}
