pragma solidity ^0.4.18;

/**
 * @title Registry
 * @dev This contract works as a registry of versions, it holds the implementations for the registered versions.
 */
contract Registry {
  /**
  * @dev This event will be emitted every time a new implementation is registered
  * @param version representing the version name of the registered implementation
  * @param implementation representing the address of the registered implementation
  */
  event VersionAdded(string version, address implementation);

  // Mapping of versions to implementations of different functions
  mapping (string => address) internal versions;

  /**
  * @dev Registers a new version with its implementation address
  * @param version representing the version name of the new implementation to be registered
  * @param implementation representing the address of the new implementation to be registered
  */
  function addVersion(string version, address implementation) public {
    require(versions[version] == address(0));
    require(implementation != address(0));
    versions[version] = implementation;
    VersionAdded(version, implementation);
  }

  /**
  * @dev Tells the address of the implementation for a given version
  * @param version to query the implementation of
  * @return address of the implementation registered for the given version
  */
  function getVersion(string version) public view returns (address) {
    return versions[version];
  }
}
