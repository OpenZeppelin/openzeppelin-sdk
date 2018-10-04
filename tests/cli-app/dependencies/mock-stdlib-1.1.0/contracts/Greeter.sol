pragma solidity ^0.4.24;

contract Greeter {
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
}
