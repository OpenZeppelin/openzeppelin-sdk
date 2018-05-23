pragma solidity ^0.4.21;

import "./BaseApp.sol";
import "./versioning/Package.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title PackagedApp
 * @dev App for an upgradeable project that can use different versions.
 * This is the standard entry point for an upgradeable app.
 */
contract PackagedApp is BaseApp {
  /// @dev Package that stores the contract implementation addresses.
  Package public package;
  /// @dev App version.
  string public version;

  /**
   * @dev Constructor function.
   * @param _package Package that stores the contract implementation addresses.
   * @param _version Initial version of the app.
   * @param _factory Proxy factory.
   */
  function PackagedApp(Package _package, string _version, UpgradeabilityProxyFactory _factory)
    BaseApp(_factory)
    public
  {
    require(address(_package) != address(0));
    require(_package.hasVersion(_version));
    package = _package;
    version = _version;
  }

  /**
   * @dev Sets the current version of the application.
   * Contract implementations for the given version must already be registered in the package.
   * @param newVersion Name of the new version.
   */
  function setVersion(string newVersion) public onlyOwner {
    require(package.hasVersion(newVersion));
    version = newVersion;
  }

  /**
   * @dev Returns the provider for the current version.
   * @return The provider for the current version.
   */
  function getProvider() internal view returns (ImplementationProvider) {
    return package.getVersion(version);
  }
}
