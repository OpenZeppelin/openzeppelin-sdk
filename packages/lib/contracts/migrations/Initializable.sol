pragma solidity ^0.4.21;


/**
 * @title Initializable
 *
 * @dev Simple helper contract to support initialization outside of constructor.
 * @dev Use Migratable for more complex migration mechanisms.
 *
 * @dev Beware! It is the developer's responsibility to ensure an initializer
 * @dev is actually called.
 */
contract Initializable {

  /**
   * @dev changed to true when contract has been initialized
   */
  bool public initialized;

  /**
   * @dev used to decorate the initialization function of a contract
   */
  modifier isInitializer() {
    require(!initialized);
    _;
    initialized = true;
  }
}
