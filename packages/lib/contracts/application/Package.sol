pragma solidity ^0.4.24;

import "./ImplementationProvider.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Package
 * @dev Collection of contracts grouped into versions.
 * Contracts with the same name can have different implementation addresses in different versions.
 */
contract Package is Ownable {
  /**
   * @dev Emitted when a version is added to the package.
   * @param semanticVersion Name of the added version.
   * @param contractAddress ImplementationProvider associated with the version.
   */
  event VersionAdded(uint64[3] semanticVersion, address contractAddress, bytes contentURI);

  struct Version {
    uint64[3] semanticVersion;
    address contractAddress;
    bytes contentURI; 
  }

  /*
   * @dev Mapping associating versions and their implementation providers.
   */
  mapping (bytes32 => Version) internal versions;
  mapping (uint64 => bytes32) internal majorToLatestVersion;
  uint64 internal latestMajor;

  /**
   * @dev Returns a version.
   * @param semanticVersion Name of the version.
   * @return the version.
   */
  function getVersion(uint64[3] semanticVersion) public view returns (address contractAddress, bytes contentURI) {
    Version storage version = versions[semanticVersionHash(semanticVersion)];
    return (version.contractAddress, version.contentURI); 
  }

  function getContract(uint64[3] semanticVersion) public view returns (address contractAddress) {
    Version storage version = versions[semanticVersionHash(semanticVersion)];
    return version.contractAddress;
  }

  /**
   * @dev Adds the implementation provider of a new version to the package.
   * @param semanticVersion Name of the version.
   * @param contractAddress ImplementationProvider associated with the version.
   * @param contentURI content URI.
   */
  function addVersion(uint64[3] semanticVersion, address contractAddress, bytes contentURI) public onlyOwner {
    require(contractAddress != address(0), "Contract address is required");
    require(!hasVersion(semanticVersion), "Given version is already registered in package");
    require(!semanticVersionIsZero(semanticVersion), "Version must be non zero");

    // Register version
    bytes32 versionId = semanticVersionHash(semanticVersion);
    versions[versionId] = Version(semanticVersion, contractAddress, contentURI);
    
    // Update latest major
    uint64 major = semanticVersion[0];
    if (major > latestMajor) {
      latestMajor = semanticVersion[0];
    }

    // Update latest version for this major
    uint64 minor = semanticVersion[1];
    uint64 patch = semanticVersion[2];
    uint64[3] latestVersionForMajor = versions[majorToLatestVersion[major]].semanticVersion;
    if (semanticVersionIsZero(latestVersionForMajor) // No latest was set for this major
       || (minor > latestVersionForMajor[1]) // Or current minor is greater 
       || (minor == latestVersionForMajor[1] && patch > latestVersionForMajor[2]) // Or current patch is greater
       ) { 
      majorToLatestVersion[major] = versionId;
    }

    emit VersionAdded(semanticVersion, contractAddress, contentURI);
  }

  /**
   * @dev Checks whether a version is present in the package.
   * @param semanticVersion Name of the version.
   * @return true if the version is already in the package, false otherwise.
   */
  function hasVersion(uint64[3] semanticVersion) public view returns (bool) {
    Version storage version = versions[semanticVersionHash(semanticVersion)];
    return address(version.contractAddress) != address(0);
  }

  function getLatest() public view returns (uint64[3] semanticVersion, address contractAddress, bytes contentURI) {
    return getLatestByMajor(latestMajor);
  }

  function getLatestByMajor(uint64 major) public view returns (uint64[3] semanticVersion, address contractAddress, bytes contentURI) {
    Version storage version = versions[majorToLatestVersion[major]];
    return (version.semanticVersion, version.contractAddress, version.contentURI); 
  }

  function semanticVersionHash(uint64[3] version) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(version[0], version[1], version[2]));
  }

  function semanticVersionIsZero(uint64[3] version) internal pure returns (bool) {
    return version[0] == 0 && version[1] == 0 && version[2] == 0;
  }
}
