pragma solidity ^0.4.21;

import "./BaseAppManager.sol";
import "../versioning/ImplementationProvider.sol";
import "../../upgradeability/UpgradeabilityProxyFactory.sol";

/**
 * @title UnversionedAppManager
 * @dev Basic implementation of an upgradable user project manager with no versions
 */
contract UnversionedAppManager is BaseAppManager {
  /*
   * @dev stores the contract implementation addresses
   */
  ImplementationProvider internal provider;

  /**
   * @dev Constructor function
   * @param _provider Implementation provider
   * @param _factory Proxy factory
   */
  function UnversionedAppManager(ImplementationProvider _provider, UpgradeabilityProxyFactory _factory)
    BaseAppManager(_factory)
    public
  {
    setProvider(_provider);
  }

  /**
   * @return Implementation provider used by the manager
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
