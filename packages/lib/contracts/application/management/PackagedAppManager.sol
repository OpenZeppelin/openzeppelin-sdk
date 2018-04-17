pragma solidity ^0.4.21;

import "./BaseAppManager.sol";
import "../versioning/Package.sol";
import "../../upgradeability/UpgradeabilityProxyFactory.sol";

contract PackagedAppManager is BaseAppManager {
  Package public package;
  string public version;

  function PackagedAppManager(Package _package, string _version, UpgradeabilityProxyFactory _factory)
    BaseAppManager(_factory)
    public
  {
    require(address(_package) != address(0));
    require(_package.hasVersion(_version));
    package = _package;
    version = _version;
  }

  function setVersion(string newVersion) public onlyOwner {
    require(package.hasVersion(newVersion));
    version = newVersion;
  }

  function getProvider() internal view returns (ContractProvider) {
    return package.getVersion(version);
  }
}
