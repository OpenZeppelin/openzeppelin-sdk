pragma solidity ^0.4.21;

import "../migrations/Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test initializable functionality
 */
contract InitializableMock is Initializable {

  function initialize() public isInitializer {
  }

}
