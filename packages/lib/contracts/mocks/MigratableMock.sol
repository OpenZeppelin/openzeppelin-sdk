pragma solidity ^0.4.24;

import "../migrations/Migratable.sol";

/**
 * @title MigratableMock
 * @dev This contract is a mock to test upgradeability functionality
 */
contract MigratableMock is Migratable {
  uint256 public x;

  function initialize(uint256 value) public payable isInitializer("MigratableMock", "0") {
    x = value;
  }

  function fail() public pure {
    require(false, "MigratableMock forced failure");
  }

  function secondInitialize() public isInitializer("MigratableMock", "1") {
  }
}
