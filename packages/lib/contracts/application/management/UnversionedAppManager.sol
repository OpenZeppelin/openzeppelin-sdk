pragma solidity ^0.4.21;

import "./BaseAppManager.sol";
import "../versioning/ContractProvider.sol";
import "../../upgradeability/UpgradeabilityProxyFactory.sol";

contract UnversionedAppManager is BaseAppManager {
  ContractProvider internal provider;

  function UnversionedAppManager(ContractProvider _provider, UpgradeabilityProxyFactory _factory)
    BaseAppManager(_factory)
    public
  {
    setProvider(_provider);
  }

  function getProvider() internal view returns (ContractProvider) {
    return provider;
  }

  function setProvider(ContractProvider _provider) public onlyOwner {
    require(address(_provider) != address(0));
    provider = _provider;
  }
}
