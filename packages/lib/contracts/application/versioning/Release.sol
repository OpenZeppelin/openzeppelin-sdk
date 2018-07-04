pragma solidity ^0.4.24;

import "./FreezableImplementationDirectory.sol";

/**
 * @title Release
 * @dev This contract represents a particular standard library version from a developer.
 * It has an immutable reference to the implementations of all contracts that comprise it.
 */
contract Release is FreezableImplementationDirectory {

  /**
   * @dev Developer address.
   * This is the owner of the implementation directory.
   */
  address public developer;

  /**
   * @dev Constructor function.
   * It sets the `msg.sender` as the developer of this release.
   */
  constructor() public {
    developer = msg.sender;
  }
}
