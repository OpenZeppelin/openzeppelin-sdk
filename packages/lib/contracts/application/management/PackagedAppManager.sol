pragma solidity ^0.4.21;

import "./BaseAppManager.sol";
import "../versioning/Package.sol";
import "../../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title PackagedAppManager
 * @dev Manager for an upgradeable user project that uses different versions
 * @dev Standard entry point for an upgradeable user app
 */
contract PackagedAppManager is BaseAppManager {
  // Directory where the contract implementation addresses are stored
  Package public package;
  // Project version
  string public version;

  /**
   * @dev Constructor function
   * @param _package Package that stores the contract implementation addresses
   * @param _factory Proxy factory
   */
  function PackagedAppManager(Package _package, string _version, UpgradeabilityProxyFactory _factory)
    BaseAppManager(_factory)
    public
  {
    require(address(_package) != address(0));
    require(_package.hasVersion(_version));
    package = _package;
    version = _version;
  }

  /**
   * @dev Changes to a new version
   * @dev Contract implementations for the given version must already be registered in the package
   * @param newVersion Name of the new version
   */
  function setVersion(string newVersion) public onlyOwner {
    require(package.hasVersion(newVersion));
    version = newVersion;
  }

  /**
   * @dev Gets the contract provider where the implementation addresses of the current version are stored
   * @return Contract provider for the current version
   */
  function getProvider() internal view returns (ContractProvider) {
    return package.getVersion(version);
  }
}
