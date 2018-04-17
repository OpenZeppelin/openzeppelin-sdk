pragma solidity ^0.4.21;

interface ContractProvider {
  function getImplementation(string contractName) public view returns (address);
}
