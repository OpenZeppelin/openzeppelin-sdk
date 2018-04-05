pragma solidity ^0.4.18;

/**
 * @title InitializableMock
 * @dev This contract is a mock to test upgradeability functionality
 */
contract InitializableMock {
  uint256 public x;

  function InitializableMock() public {}
  
  function initialize(uint256 value) public payable {
    x = value;
  }
}
