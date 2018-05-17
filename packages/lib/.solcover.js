module.exports = {
  copyPackages: ['zeppelin-solidity'],
  skipFiles: [
    'lifecycle/Migrations.sol',
    'mocks/ClashingImplementation.sol',
    'mocks/DummyImplementation.sol',
    'mocks/InitializableMock.sol',
    'mocks/MigratableMock.sol',
    'mocks/MultipleInheritanceMigratableMocks.sol',
    'mocks/SingleInheritanceMigratableMocks.sol',
  ]
};