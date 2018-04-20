pragma solidity ^0.4.21;

import "./ContractProvider.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Package
 * @dev Complex directory of contracts that groups contracts into versions
 * @dev Contracts with the same name can have different implementation addresses in the different versions
 */
contract Package is Ownable {
  /**
   * @dev This event signals the addition of a version to the directory
   * @dev version is not indexed due to truffle testing constraints
   * @param version Name of the version for which a directory was added
   * @param provider ContractProvider associated to the added version
   */
  event VersionAdded(string version, ContractProvider provider);

  // mapping that stores the association between versions and their contract providers
  mapping (string => ContractProvider) internal versions;
  
  /**
   * @dev Gets the contract provider for a given version
   * @param version Name of the version whose contract provider
   * @return Contract provider for the given version
   */
  function getVersion(string version) public view returns (ContractProvider) {
    ContractProvider provider = versions[version];
    require(provider != address(0));
    return provider;
  }

  /**
   * @dev Adds the contract provider of a new version to the directory
   * @param version Name of the new version
   * @param provider ContractProvider associated to the new version
   */
  function addVersion(string version, ContractProvider provider) public onlyOwner {
    require(!hasVersion(version));
    versions[version] = provider;
    emit VersionAdded(version, provider);
  }

  /**
   * @dev Checks whether a version is present in the directory
   * @param version Name of the version to be checked for
   * @return Whether the version is already in the directory
   */
  function hasVersion(string version) public view returns (bool) {
    return address(versions[version]) != address(0);
  }

  /**
   * @dev Gets the implementation address for a given version and contract name
   * @param version Name of the version where the implementation address is to be fetched
   * @param contractName Name of the contract whose implementation address is desired
   * @return Address where the contract is implemented
   */
  function getImplementation(string version, string contractName) public view returns (address) {
    ContractProvider provider = getVersion(version);
    return provider.getImplementation(contractName);
  }
}
