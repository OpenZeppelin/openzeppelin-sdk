pragma solidity ^0.4.24;

import "./StorageMocks2.sol";

contract StorageMockWithRecursiveReferences {
  StorageMockWithEnums.MyEnum internal my_enum;
  StorageMockWithStructs.MyStruct internal my_struct;
  SimpleStorageMock internal my_contract;
}
