pragma solidity ^0.5.0;

import "../Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test initializable functionality
 */
contract InitializableMock is Initializable {

  bool public initializerRan;
  uint256 public x;

  function initialize() public initializer {
    initializerRan = true;
  }

  function initializeNested() public initializer {
    initialize();
  }

  function initializeWithX(uint256 _x) public payable initializer {
    x = _x;
  }

  function fail() public pure {
    require(false, "InitializableMock forced failure");
  }

  function secret() private pure returns (string memory) {
    return 'Im secret';
  }

}
