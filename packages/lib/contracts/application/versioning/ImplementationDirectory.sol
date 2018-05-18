pragma solidity ^0.4.21;

import "./ImplementationProvider.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import 'openzeppelin-solidity/contracts/AddressUtils.sol';

/**
 * @title ImplementationDirectory
 * @dev Concrete version of ImplementationProvider that stores contract implementations in a mapping
 */
contract ImplementationDirectory is ImplementationProvider, Ownable {
  /**
   * @dev Emitted when an implementation is added to the directory
   * @param contractName Name of the contract for which an implementation was added
   * @param implementation Address of added implementation
   */
  event ImplementationChanged(string contractName, address implementation);

  // Mapping where the addresses of the implementations are stored
  mapping (string => address) internal implementations;

  /**
   * @dev Gets the implementation address for a given contract name
   * @param contractName Name of the contract whose implementation address is desired
   * @return Address of the implementation
   */
  function getImplementation(string contractName) public view returns (address) {
    return implementations[contractName];
  }

  /**
   * @dev Adds the address of an implementation to the directory
   * @param contractName Name of the contract whose implementation address is added
   * @param implementation Address of the implementation
   */
  function setImplementation(string contractName, address implementation) public onlyOwner {
    require(AddressUtils.isContract(implementation));
    implementations[contractName] = implementation;
    emit ImplementationChanged(contractName, implementation);
  }

  function unsetImplementation(string contractName) public onlyOwner {
    implementations[contractName] = address(0);
    emit ImplementationChanged(contractName, address(0));
  }
}
