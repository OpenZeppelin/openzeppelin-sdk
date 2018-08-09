pragma solidity ^0.4.24;

import "../migrations/Initializable.sol";

/**
 * @title InitializableMock
 * @dev This contract is a mock to test initializable functionality
 */
contract InitializableMock is Initializable {

  bool public initializerRan;

  function initialize() public isInitializer {
    initializerRan = true;
  }

  function initializeNested() public isInitializer {
    initialize();
  }

}
