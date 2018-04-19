pragma solidity ^0.4.21;

import "../versioning/ContractProvider.sol";
import "../versioning/ContractDirectory.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title AppDirectory
 * @dev Contract directory with a standard library as a default provider
 * @dev Will search the stdlib for an implementation if none is found in the directory
 */
contract AppDirectory is ContractDirectory {
  // Default contract provider
  ContractProvider public stdlib;
  
  /**
   * @dev Constructor function
   * @param _stdlib Default contract provider where the missing implementations are searched for
   */
  function AppDirectory(ContractProvider _stdlib) public {
    stdlib = _stdlib;
  }

  /**
   * @dev Gets the implementation address for a given contract name
   * @dev If the implementation is not found in the directory, search the stdlib
   * @dev Returns 0 if the implementation is absent from both the directory and stdlib
   * @param contractName Name of the contract whose implementation address is desired
   * @return Address where the contract is implemented
   */
  function getImplementation(string contractName) public view returns (address) {
    address implementation = super.getImplementation(contractName);
    if(implementation != address(0)) return implementation;
    if(stdlib != address(0)) return stdlib.getImplementation(contractName);
    return address(0);
  }

  /**
   * @dev Sets a new default contract provider
   * @param _stdlib New default contract provider
   */
  function setStdlib(ContractProvider _stdlib) public onlyOwner {
    stdlib = _stdlib;
  }
}
