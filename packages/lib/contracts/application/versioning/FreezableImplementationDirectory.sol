pragma solidity ^0.4.24;

import "./ImplementationDirectory.sol";

/**
 * @title FreezableImplementationDirectory
 * @dev Implementation directory which can be made irreversibly immutable by the owner.
 */
contract FreezableImplementationDirectory is ImplementationDirectory {
  /// @dev Mutability state of the directory.
  bool public frozen;

  /**
   * @dev Modifier that allows functions to be called only before the contract is frozen.
   */
  modifier whenNotFrozen() {
    require(!frozen, "Cannot perform action for a frozen implementation directory");
    _;
  }

  /**
   * @dev Makes the directory irreversibly immutable.
   * It can only be called once, by the owner.
   */
  function freeze() onlyOwner whenNotFrozen public {
    frozen = true;
  }

  /**
   * @dev Sets the address of the implementation of a contract.
   * It overrides the parent function to prevent it from running if the directory is frozen.
   * @param contractName Name of the contract.
   * @param implementation Address where the contract is implemented.
   */
  function setImplementation(string contractName, address implementation) public whenNotFrozen {
    super.setImplementation(contractName, implementation);
  }

  /**
   * @dev Unsets the implementation of a contract.
   * It overrides the parent function to prevent it from running if the directory is frozen.
   * @param contractName Name of the contract.
   */
  function unsetImplementation(string contractName) public whenNotFrozen {
    super.unsetImplementation(contractName);
  }
}
