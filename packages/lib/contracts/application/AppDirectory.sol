pragma solidity ^0.4.24;

import "./versioning/ImplementationProvider.sol";
import "./versioning/ImplementationDirectory.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title AppDirectory
 * @dev Implementation directory with a standard library as a fallback provider.
 * If the implementation is not found in the directory, it will search in the
 * standard library.
 */
contract AppDirectory is ImplementationDirectory {
  /**
   * @dev Emitted when the standard library is changed.
   * @param newStdlib Address of the new standard library.
   */
  event StdlibChanged(address newStdlib);

  /**
   * @dev Provider for standard library implementations.
   */
  ImplementationProvider public stdlib;

  /**
   * @dev Constructor function.
   * @param _stdlib Provider for standard library implementations.
   */
  constructor(ImplementationProvider _stdlib) public {
    stdlib = _stdlib;
  }

  /**
   * @dev Returns the implementation address for a given contract name.
   * If the implementation is not found in the directory, it will search in the
   * standard library.
   * @param contractName Name of the contract.
   * @return Address where the contract is implemented, or 0 if it is not
   * found.
   */
  function getImplementation(string contractName) public view returns (address) {
    address implementation = super.getImplementation(contractName);
    if(implementation != address(0)) return implementation;
    if(stdlib != address(0)) return stdlib.getImplementation(contractName);
    return address(0);
  }

  /**
   * @dev Sets a new implementation provider for standard library contracts.
   * @param _stdlib Standard library implementation provider.
   */
  function setStdlib(ImplementationProvider _stdlib) public onlyOwner {
    stdlib = _stdlib;
    emit StdlibChanged(_stdlib);
  }
}
