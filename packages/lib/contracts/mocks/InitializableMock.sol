pragma solidity ^0.4.18;

import '../upgradeability/OwnedUpgradeabilityStorage.sol';
import '../Registry.sol';

contract InitializableMock is OwnedUpgradeabilityStorage {

  uint256 public x;

  function InitializableMock() 
    OwnedUpgradeabilityStorage(Registry(0x0))
    public
  {}
  
  function initialize(uint256 value) public {
    x = value;
  }

}
