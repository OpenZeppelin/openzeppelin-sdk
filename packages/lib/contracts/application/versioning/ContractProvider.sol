pragma solidity ^0.4.21;

/**
 * @title ContractProvider
 * @dev Interface for contracts that can provide implementation addresses for other contracts
 */
interface ContractProvider {
  /**
   * @dev Prototype of function that returns implementation addresses
   * @param contractName Name of the contract whose address is being fetched
   * @return Implementation address of desired contract
   */
  function getImplementation(string contractName) public view returns (address);
}
