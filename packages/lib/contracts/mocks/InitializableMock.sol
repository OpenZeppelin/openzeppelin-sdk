pragma solidity ^0.4.21;

import "../migrations/Migratable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test upgradeability functionality
 */
contract InitializableMock is Migratable {
  uint256 public x;

  function InitializableMock() public {}
  
  function initialize(uint256 value) public payable isInitializer("InitializableMock", "0") {
    x = value;
  }

  function fail() public pure {
    require(false);
  }
}
