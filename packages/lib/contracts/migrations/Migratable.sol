pragma solidity ^0.4.21;


/**
 * @title Migratable
 *
 * @dev Helper contract to support migration schemes between different
 * @dev implementations of a contract in the context of upgradeability.
 *
 * @dev Beware! It is the developer's responsibility to ensure migrations are
 * @dev run in a correct order, or that they are run at all.
 *
 * @dev See Initializable for a simpler version.
 */
contract Migratable {
  /**
   * @dev Emitted when the contract performs a migration
   * @param contractName Contract name
   * @param migrationId migration id applied
   */
  event Migrated(string contractName, string migrationId);

  /**
   * @dev Stores which migrations have been applied already. 
   * @dev (contractName => (migrationId => bool))
   */
  mapping (string => mapping (string => bool)) internal migrated;


  /**
   * @dev used to decorate the initialization function of a contract version
   * @param contractName Contract name
   * @param migrationId migration id to be applied
   */
  modifier isInitializer(string contractName, string migrationId) {
    require(!isMigrated(contractName, migrationId));
    _;
    emit Migrated(contractName, migrationId);
    migrated[contractName][migrationId] = true;
  }

  /**
   * @dev used to decorate a migration function of a contract
   * @param contractName Contract name
   * @param requiredMigrationId previous migration required to run new one
   * @param newMigrationId new migration id to be applied
   */
  modifier isMigration(string contractName, string requiredMigrationId, string newMigrationId) {
    require(isMigrated(contractName, requiredMigrationId) && !isMigrated(contractName, newMigrationId));
    _;
    emit Migrated(contractName, newMigrationId);
    migrated[contractName][newMigrationId] = true;
  }

  /**
   * @param contractName Contract name
   * @param migrationId migration id
   * @return if the contract was already migrated with given migration
   */
  function isMigrated(string contractName, string migrationId) public view returns(bool) {
    return migrated[contractName][migrationId];
  }
}
