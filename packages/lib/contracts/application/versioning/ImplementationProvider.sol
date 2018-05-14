pragma solidity ^0.4.21;

/**
 * @title ImplementationProvider
 * @dev Interface for providing implementation addresses for other contracts by name
 */
interface ImplementationProvider {
  /**
   * @dev Prototype of function that returns implementation addresses
   * @param contractName Name of the contract whose address is being fetched
   * @return Implementation address of desired contract
   */
  function getImplementation(string contractName) public view returns (address);
}
