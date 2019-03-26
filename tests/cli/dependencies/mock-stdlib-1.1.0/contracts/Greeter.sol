pragma solidity ^0.4.24;

import "./InternalLibrary.sol";

contract Greeter {
  using Numbers for uint256;

  bool private isInitialized;
  string public who;

  function initialize(string _who) public {
    require (!isInitialized);
    who = _who;
    isInitialized = true;
  }

  function minor() public pure returns (uint256) {
    return 1;
  }

  function doubles(uint256 x) public pure returns (uint256) {
    return x.double();
  }
}
