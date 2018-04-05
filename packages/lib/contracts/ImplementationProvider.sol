pragma solidity ^0.4.18;

interface ImplementationProvider {
  function getImplementation(string distribution, string version, string contractName) public view returns (address);
}
