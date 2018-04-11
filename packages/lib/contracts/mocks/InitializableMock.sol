pragma solidity ^0.4.21;

import "../Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test upgradeability functionality
 */
contract InitializableMock is Initializable {
  uint256 public x;

  function InitializableMock() public {}
  
  function initialize(uint256 value) public payable isInitializer {
    x = value;
  }

  function fail() public {
    require(false);
  }
}
