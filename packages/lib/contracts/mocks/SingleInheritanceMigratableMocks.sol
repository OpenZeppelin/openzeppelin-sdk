pragma solidity ^0.4.24;

import '../migrations/Migratable.sol';

/**
 * @title MigratableMockV1
 * @dev This contract is a mock to test initializable functionality through migrations
 */
contract MigratableMockV1 is Migratable {
  uint256 public x;

  function initialize(uint256 value) isInitializer("MigratableMock", "migration_1") public payable {
    x = value;
  }
}

/**
 * @title MigratableMockV2
 * @dev This contract is a mock to test migratable functionality with params
 */
contract MigratableMockV2 is MigratableMockV1 {
  uint256 public y;

  function migrate(uint256 value, uint256 anotherValue) isMigration("MigratableMock", "migration_1", "migration_2") public payable {
    x = value;
    y = anotherValue;
  }
}

/**
 * @title MigratableMockV3
 * @dev This contract is a mock to test migratable functionality without params
 */
contract MigratableMockV3 is MigratableMockV2 {
  function migrate() isMigration("MigratableMock", "migration_2", "migration_3") public payable {
    uint256 oldX = x;
    x = y;
    y = oldX;
  }
}
