pragma solidity ^0.4.24;

/**
 * @title ImplementationProvider
 * @dev Interface for providing implementation addresses for other contracts by name.
 */
interface ImplementationProvider {
  /**
   * @dev Abstract function to return the implementation address of a contract.
   * @param contractName Name of the contract.
   * @return Implementation address of the contract.
   */
  function getImplementation(string contractName) public view returns (address);
}

