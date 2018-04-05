pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title Registry
 * @dev This contract works as a registry of versions, it holds different implementations for different versions of
 * different registered contracts.
 */
contract Registry is Ownable {
  /**
  * @dev This event will be emitted every time a new implementation is registered
  * @param version representing the version name of the registered implementation
  * @param contractName representing the name of the contract of the registered implementation
  * @param implementation representing the address of the registered implementation
  */
  event ImplementationAdded(string version, string contractName, address implementation);

  // Mapping of versions to mappings of contract name to implementation address
  mapping (string => mapping (string => address)) internal implementations;

  /**
  * @dev Registers a new implementation for the given version and contract name
  * @param version representing the version name of the new implementation to be registered
  * @param contractName representing the name of the contract of the new implementation to be registered
  * @param implementation representing the address of the new implementation to be registered
  */
  function addImplementation(string version, string contractName, address implementation) public onlyOwner {
    require(getImplementation(version, contractName) == address(0));
    require(implementation != address(0));
    implementations[version][contractName] = implementation;
    ImplementationAdded(version, contractName, implementation);
  }

  /**
  * @dev Tells the address of the implementation for a given version
  * @param version representing the version to query the implementation of
  * @param contractName representing the name of the contract to query the implementation of
  * @return address of the implementation registered for the given version of the requested contract
  */
  function getImplementation(string version, string contractName) public view returns (address) {
    return implementations[version][contractName];
  }
}
