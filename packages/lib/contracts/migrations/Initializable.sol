pragma solidity ^0.4.21;


/**
 * @title Initializable
 * @dev Simple helper contract to support initialization outside of the constructor.
 * To use it, replace the constructor with a function that has the
 * `isInitializer` modifier.
 * WARNING: This helper does not support multiple inheritance.
 * WARNING: It is the developer's responsibility to ensure that an initializer
 * is actually called.
 * Use `Migratable` for more complex migration mechanisms.
 */
contract Initializable {

  /**
   * @dev Indicates if the contract has been initialized.
   */
  bool public initialized;

  /**
   * @dev Modifier to use in the initialization function of a contract.
   */
  modifier isInitializer() {
    require(!initialized);
    _;
    initialized = true;
  }
}
