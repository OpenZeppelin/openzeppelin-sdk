pragma solidity ^0.4.21;

import "./ContractDirectory.sol";

/**
 * @title FreezableContractDirectory
 * @dev Contract directory which can be made irreversibly immutable by the owner 
 */
 contract FreezableContractDirectory is ContractDirectory {
  // stores the mutability state of the directory
  bool public frozen;

  /**
   * @dev Modifier that allows functions to be called only when the contract is not frozen
   */
  modifier whenNotFrozen() {
    require(!frozen);
    _;
  }
  
  /**
   * @dev Makes the directory irreversibly immutable. Can only be called once, by the owner.
   */
  function freeze() onlyOwner whenNotFrozen public {
    frozen = true;
  }
  
  /**
   * @dev Adds the address of a contract implementation to the directory
   * @dev Overrides parent implementation to prevent it from running if the directory is fro
   * @param contractName Name of the contract whose implementation address is being added
   * @param implementation Address where the added contract is implemented
   */
  function setImplementation(string contractName, address implementation) public whenNotFrozen {
    super.setImplementation(contractName, implementation);
  }
}
