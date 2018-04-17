pragma solidity ^0.4.21;

import "./ContractProvider.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Package is Ownable {
  event VersionAdded(string version, ContractProvider indexed provider);

  mapping (string => ContractProvider) internal versions;

  function getVersion(string version) public view returns (ContractProvider) {
    return versions[version];
  }

  function addVersion(string version, ContractProvider provider) public onlyOwner {
    require(!hasVersion(version));
    versions[version] = provider;
    emit VersionAdded(version, provider);
  }

  function hasVersion(string version) public view returns (bool) {
    return address(getVersion(version)) != address(0);
  }

  function getImplementation(string version, string contractName) public view returns (address) {
    ContractProvider provider = getVersion(version);
    require(address(provider) != address(0));
    return provider.getImplementation(contractName);
  }
}
