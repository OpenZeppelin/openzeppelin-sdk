pragma solidity ^0.4.21;


contract Migratable {
  event Migrated(string contractName, string migrationId);

  mapping (string => mapping (string => bool)) internal migrated;

  modifier isInitializer(string contractName, string migrationId) {
    require(!isMigrated(contractName, migrationId));
    _;
    emit Migrated(contractName, migrationId);
    migrated[contractName][migrationId] = true;
  }

  modifier isMigration(string contractName, string requiredMigrationId, string newMigrationId) {
    require(isMigrated(contractName, requiredMigrationId) && !isMigrated(contractName, newMigrationId));
    _;
    emit Migrated(contractName, newMigrationId);
    migrated[contractName][newMigrationId] = true;
  }

  function isMigrated(string contractName, string migrationId) public view returns(bool) {
    return migrated[contractName][migrationId];
  }
}
