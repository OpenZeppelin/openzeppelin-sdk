pragma solidity ^0.4.21;

import "./ContractProvider.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title ContractDirectory
 * @dev Implementation of ContractProvider that stores contract implementation addresses
 */
contract ContractDirectory is ContractProvider, Ownable {
  /**
   * @dev This event will be emitted when an implementation is added to the directory
   * @param contractName Name of the contract for which an implementation was added
   * @param implementation Address of added implementation
   */
  event ImplementationChanged(string contractName, address implementation);

  // Mapping where the addresses of the implementations are stored
  mapping (string => address) internal implementations;

  /**
   * @dev Gets the implementation address for a given contract name
   * @param contractName Name of the contract whose implementation address is desired
   * @return Address where the contract is implemented
   */
  function getImplementation(string contractName) public view returns (address) {
    return implementations[contractName];
  }

  /**
   * @dev Adds the address of a contract implementation to the directory
   * @param contractName Name of the contract whose implementation address is added
   * @param implementation Address where the added contract is implemented
   */
  function setImplementation(string contractName, address implementation) public onlyOwner {
    implementations[contractName] = implementation;
    emit ImplementationChanged(contractName, implementation);
  }
}
