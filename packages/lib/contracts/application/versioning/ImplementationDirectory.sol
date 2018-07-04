pragma solidity ^0.4.24;

import "./ImplementationProvider.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import 'openzeppelin-solidity/contracts/AddressUtils.sol';

/**
 * @title ImplementationDirectory
 * @dev Implementation provider that stores contract implementations in a mapping.
 */
contract ImplementationDirectory is ImplementationProvider, Ownable {
  /**
   * @dev Emitted when the implementation of a contract is changed.
   * @param contractName Name of the contract.
   * @param implementation Address of the added implementation.
   */
  event ImplementationChanged(string contractName, address implementation);

  /// @dev Mapping where the addresses of the implementations are stored.
  mapping (string => address) internal implementations;

  /**
   * @dev Returns the implementation address of a contract.
   * @param contractName Name of the contract.
   * @return Address of the implementation.
   */
  function getImplementation(string contractName) public view returns (address) {
    return implementations[contractName];
  }

  /**
   * @dev Sets the address of the implementation of a contract in the directory.
   * @param contractName Name of the contract.
   * @param implementation Address of the implementation.
   */
  function setImplementation(string contractName, address implementation) public onlyOwner {
    require(AddressUtils.isContract(implementation), "Cannot set implementation in directory with a non-contract address");
    implementations[contractName] = implementation;
    emit ImplementationChanged(contractName, implementation);
  }

  /**
   * @dev Removes the address of a contract implementation from the directory.
   * @param contractName Name of the contract.
   */
  function unsetImplementation(string contractName) public onlyOwner {
    implementations[contractName] = address(0);
    emit ImplementationChanged(contractName, address(0));
  }
}
