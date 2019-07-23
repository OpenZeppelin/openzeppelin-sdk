pragma solidity >=0.4.24 <0.6.0;


/**
 * @title Initializable
 *
 * @dev Helper contract to support initializer functions. To use it, replace
 * the constructor with a function that has the `initializer` modifier.
 * WARNING: Unlike constructors, initializer functions must be manually
 * invoked. This applies both to deploying an Initializable contract, as well
 * as extending an Initializable contract via inheritance.
 * WARNING: When used with inheritance, manual care must be taken to not invoke
 * a parent initializer twice, or ensure that all initializers are idempotent,
 * because this is not dealt with automatically as with constructors.
 */
contract Initializable {

  /**
   * @dev Storage slot with the address of the current 'initialized' flag.
   * This is the keccak-256 hash of "zos.initializable.initialized" subtracted by 1
   */
  bytes32 internal constant INITIALIZED_SLOT = 0x7d7a37a9c9b8bd172dd5856df5c42095640bb8f663c76d7af29583ec5121dac4;

  /**
   * @dev Storage slot with the address of the current 'initializing' flag.
   * This is the keccak-256 hash of "zos.initializable.initializing" subtracted by 1
   */
  bytes32 internal constant INITIALIZING_SLOT = 0x1962c92ddb644cf68d2aa115edb30dc5f942367eaf370acead3c212ed8ea3439;

	/**
   * @dev Returns the current initialized flag.
   * @return Boolean value of the initialized flag
   */
  function _initialized() internal view returns (bool initialized) {
    bytes32 slot = INITIALIZED_SLOT;
    assembly {
      initialized := sload(slot)
    }
  }

  /**
   * @dev Sets the initialized flag.
   * @param newInitialized Boolean value of the initialized flag.
   */
  function _setInitialized(bool newInitialized) internal {
    bytes32 slot = INITIALIZED_SLOT;
    assembly {
      sstore(slot, newInitialized)
    }
  }

  /**
   * @dev Returns the current initializing flag.
   * @return Boolean value of the initializing flag
   */
  function _initializing() internal view returns (bool initializing) {
    bytes32 slot = INITIALIZING_SLOT;
    assembly {
      initializing := sload(slot)
    }
  }

  /**
   * @dev Sets the initializing flag.
   * @param newInitializing Boolean value of the initializing flag.
   */
  function _setInitializing(bool newInitializing) internal {
    bytes32 slot = INITIALIZING_SLOT;
    assembly {
      sstore(slot, newInitializing)
    }
  }

  /**
   * @dev Modifier to use in the initializer function of a contract.
   */
  modifier initializer() {
    require(_initializing() || isConstructor() || !_initialized(), "Contract instance has already been initialized");

    bool isTopLevelCall = !_initializing();
    if (isTopLevelCall) {
      _setInitializing(true);
      _setInitialized(true);
    }

    _;

    if (isTopLevelCall) {
      _setInitializing(false);
    }
  }

  /// @dev Returns true if and only if the function is running in the constructor
  function isConstructor() private view returns (bool) {
    // extcodesize checks the size of the code stored in an address, and
    // address returns the current address. Since the code is still not
    // deployed when running a constructor, any checks on its code size will
    // yield zero, making it an effective way to detect if a contract is
    // under construction or not.
    uint256 cs;
    assembly { cs := extcodesize(address) }
    return cs == 0;
  }
}
