pragma solidity ^0.5.0;

import '../Initializable.sol';

/**
 * @title MigratableMockV1
 * @dev This contract is a mock to test initializable functionality through migrations
 */
contract MigratableMockV1 is Initializable {
  uint256 public x;

  function initialize(uint256 value) initializer public payable {
    x = value;
  }
}

/**
 * @title MigratableMockV2
 * @dev This contract is a mock to test migratable functionality with params
 */
contract MigratableMockV2 is MigratableMockV1 {
  bool migratedV2;
  uint256 public y;

  function migrate(uint256 value, uint256 anotherValue) public payable {
    require(!migratedV2);
    x = value;
    y = anotherValue;
    migratedV2 = true;
  }
}

/**
 * @title MigratableMockV3
 * @dev This contract is a mock to test migratable functionality without params
 */
contract MigratableMockV3 is MigratableMockV2 {
  bool migratedV3;

  function migrate() public payable {
    require(!migratedV3);
    uint256 oldX = x;
    x = y;
    y = oldX;
    migratedV3 = true;
  }
}
