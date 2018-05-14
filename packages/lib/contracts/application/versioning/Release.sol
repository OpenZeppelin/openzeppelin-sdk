pragma solidity ^0.4.21;

import "./FreezableImplementationDirectory.sol";

/**
 * @title Release
 * @dev This contract represents a particular stdlib version from a developer
 * @dev Has an immutable reference to all contract implementations that comprise this version
 */
contract Release is FreezableImplementationDirectory {

  /**
   * @dev Developer address, owner of the implementation directory
   */
  address public developer;
  
  /**
   * @dev Constructor function that sets the developer of this release
   */
  function Release() public {
    developer = msg.sender;
  }
}
