pragma solidity ^0.4.21;

import "./ContractProvider.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract ContractDirectory is ContractProvider, Ownable {
  event ImplementationAdded(string contractName, address indexed implementation);

  mapping (string => address) internal implementations;

  function getImplementation(string contractName) public view returns (address) {
    return implementations[contractName];
  }

  function setImplementation(string contractName, address implementation) public onlyOwner {
    implementations[contractName] = implementation;
    emit ImplementationAdded(contractName, implementation);
  }
}
