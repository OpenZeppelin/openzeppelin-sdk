pragma solidity ^0.4.21;

import "../versioning/ContractProvider.sol";
import "../versioning/ContractDirectory.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract AppDirectory is ContractDirectory {
  ContractProvider public stdlib;

  function AppDirectory(ContractProvider _stdlib) public {
    stdlib = _stdlib;
  }

  function getImplementation(string contractName) public view returns (address) {
    address implementation = super.getImplementation(contractName);
    if(implementation != address(0)) return implementation;
    if(stdlib != address(0)) return stdlib.getImplementation(contractName);
    return address(0);
  }

  function setStdlib(ContractProvider _stdlib) public onlyOwner {
    stdlib = _stdlib;
  }
}
