pragma solidity ^0.4.21;

import "./ImplementationProvider.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Package
 * @dev Complex collection of contracts that groups contracts into versions
 * @dev Contracts with the same name can have different implementation addresses in different versions
 */
contract Package is Ownable {
  /**
   * @dev This event signals the addition of a version to the package
   * @dev Version is not indexed due to truffle testing constraints
   * @param version Name of the version added
   * @param provider ImplementationProvider associated with the added version
   */
  event VersionAdded(string version, ImplementationProvider provider);

  /*
   * @dev Mapping that stores the association between versions 
   * @dev and their implementation providers.
   */
  mapping (string => ImplementationProvider) internal versions;

  /**
   * @dev Gets the implementation provider for a given version
   * @param version name of the version
   * @return Implementation provider for the given version
   */
  function getVersion(string version) public view returns (ImplementationProvider) {
    ImplementationProvider provider = versions[version];
    return provider;
  }

  /**
   * @dev Adds the implementation provider of a new version to the package
   * @param version Name of the new version
   * @param provider ImplementationProvider associated with the new version
   */
  function addVersion(string version, ImplementationProvider provider) public onlyOwner {
    require(!hasVersion(version));
    versions[version] = provider;
    emit VersionAdded(version, provider);
  }

  /**
   * @dev Checks whether a version is present in the package
   * @param version Name of the version to be checked for
   * @return true if the version is already in the package
   */
  function hasVersion(string version) public view returns (bool) {
    return address(versions[version]) != address(0);
  }

  /**
   * @dev Gets the implementation address for a given version and contract name
   * @param version Name of the version where the implementation address is fetched
   * @param contractName Name of the contract whose implementation address is requested
   * @return Address where the contract is implemented
   */
  function getImplementation(string version, string contractName) public view returns (address) {
    ImplementationProvider provider = getVersion(version);
    return provider.getImplementation(contractName);
  }
}
