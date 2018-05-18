pragma solidity ^0.4.21;

import "./versioning/ImplementationProvider.sol";
import "./versioning/ImplementationDirectory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title AppDirectory
 * @dev Implementation directory with a standard library as a default provider
 * @dev Will search the stdlib for an implementation if none is found in the directory
 */
contract AppDirectory is ImplementationDirectory {
  /**
   * @dev Emitted when the stdlib is changed
   * @param newStdlib New address of stdlib
   */
  event StdlibChanged(address newStdlib);

  /**
   * @dev Provider for standard library implementations
   */
  ImplementationProvider public stdlib;
  
  /**
   * @dev Constructor function
   * @param _stdlib Provider for standard library implementations
   */
  function AppDirectory(ImplementationProvider _stdlib) public {
    stdlib = _stdlib;
  }

  /**
   * @dev Gets the implementation address for a given contract name
   * @dev If the implementation is not found in the directory, search the stdlib
   * @dev Returns 0 if the implementation is absent from both the directory and stdlib
   * @param contractName Name of the contract
   * @return Address where the contract is implemented
   */
  function getImplementation(string contractName) public view returns (address) {
    address implementation = super.getImplementation(contractName);
    if(implementation != address(0)) return implementation;
    if(stdlib != address(0)) return stdlib.getImplementation(contractName);
    return address(0);
  }

  /**
   * @dev Sets a new implementation provider for standard library contracts
   * @param _stdlib New implementation provider
   */
  function setStdlib(ImplementationProvider _stdlib) public onlyOwner {
    stdlib = _stdlib;
    emit StdlibChanged(_stdlib);
  }
}
