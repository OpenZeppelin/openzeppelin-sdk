pragma solidity ^0.4.21;

import "./BaseApp.sol";
import "./versioning/Package.sol";
import "../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title PackagedApp
 * @dev App for an upgradeable user project that uses different versions
 * @dev Standard entry point for an upgradeable user app
 */
contract PackagedApp is BaseApp {
  // Directory where the contract implementation addresses are stored
  Package public package;
  // Project version
  string public version;

  /**
   * @dev Constructor function
   * @param _package Package that stores the contract implementation addresses
   * @param _factory Proxy factory
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
   * @dev Changes the application's current version
   * @dev Contract implementations for the given version must already be registered in the package
   * @param newVersion Name of the new version
   */
  function setVersion(string newVersion) public onlyOwner {
    require(package.hasVersion(newVersion));
    version = newVersion;
  }

  /**
   * @return Implementation provider for the current version
   */
  function getProvider() internal view returns (ImplementationProvider) {
    return package.getVersion(version);
  }
}
