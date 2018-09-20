pragma solidity ^0.4.24;

import "./BaseApp.sol";
import "./versioning/Package.sol";

/**
 * @title VersionedApp
 * @dev App for an upgradeable project that can use different versions from packages.
 * This is the standard entry point for an upgradeable app.
 */
contract VersionedApp is BaseApp {
  
  struct ProviderInfo {
    Package package;
    string version;
  }
  
  mapping(string => ProviderInfo) internal providers;

  /**
   * @dev Emitted when a package dependency is changed in the application.
   * @param providerName Name of the package that changed.
   * @param package Address of the package associated to the name.
   * @param version Version of the package in use.
   */
  event PackageChanged(string providerName, address package, string version);

  /**
   * @dev Constructor function.
   */
  constructor() BaseApp() public { }

  /**
   * @dev Returns the provider for a given package name, or zero if not set.
   * @param packageName Name of the package to be retrieved.
   * @return The provider.
   */
  function getProvider(string packageName) public view returns (ImplementationProvider) {
    ProviderInfo storage info = providers[packageName];
    if (address(info.package) == address(0)) return ImplementationProvider(0);
    return info.package.getVersion(info.version);
  }

  /**
   * @dev Returns information on a package given its name.
   * @param packageName Name of the package to be queried.
   * @return A tuple with the package address and pinned version given a package name, or zero if not set
   */
  function getPackage(string packageName) public view returns (Package, string) {
    ProviderInfo storage info = providers[packageName];
    return (info.package, info.version);
  } 

  /**
   * @dev Sets a package in a specific version as a dependency for this application. 
   * Requires the version to be present in the package.
   * @param packageName Name of the package to set or overwrite.
   * @param package Address of the package to register.
   * @param version Version of the package to use in this application.
   */
  function setPackage(string packageName, Package package, string version) public onlyOwner {
    require(package.hasVersion(version), "The requested version must be registered in the given package");
    providers[packageName] = ProviderInfo(package, version);
    emit PackageChanged(packageName, package, version);
  }

  /**
   * @dev Unsets a package given its name.
   * Reverts if the package is not set in the application.
   * @param packageName Name of the package to remove.
   */
  function unsetPackage(string packageName) public onlyOwner {
    require(address(providers[packageName].package) != address(0), "Package to unset not found");
    delete providers[packageName];
    emit PackageChanged(packageName, address(0), "");
  }
}
