pragma solidity ^0.4.21;

import "../versioning/ContractProvider.sol";
import "../../upgradeability/OwnedUpgradeabilityProxy.sol";
import "../../upgradeability/UpgradeabilityProxyFactory.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract BaseAppManager is Ownable {
  UpgradeabilityProxyFactory public factory;

  function BaseAppManager(UpgradeabilityProxyFactory _factory) public {
    require(address(_factory) != address(0));
    factory = _factory;
  }

  function getProvider() internal view returns (ContractProvider);

  function getImplementation(string contractName) public view returns (address) {
    return getProvider().getImplementation(contractName);
  }

  function create(string contractName) public returns (OwnedUpgradeabilityProxy) {
    address implementation = getImplementationOrRevert(contractName);
    return factory.createProxy(this, implementation);
  }

  function createAndCall(string contractName, bytes data) payable public returns (OwnedUpgradeabilityProxy) {
    address implementation = getImplementationOrRevert(contractName);
    return factory.createProxyAndCall.value(msg.value)(this, implementation, data);
  }

  function upgradeTo(OwnedUpgradeabilityProxy proxy, string contractName) public onlyOwner {
    address implementation = getImplementationOrRevert(contractName);
    proxy.upgradeTo(implementation);
  }

  function upgradeToAndCall(OwnedUpgradeabilityProxy proxy, string contractName, bytes data) payable public onlyOwner {
    address implementation = getImplementationOrRevert(contractName);
    proxy.upgradeToAndCall.value(msg.value)(implementation, data);
  }

  function getImplementationOrRevert(string contractName) internal view returns (address) {
    address implementation = getImplementation(contractName);
    require(implementation != address(0));
    return implementation;
  }
}
