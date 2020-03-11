pragma solidity ^0.5.0;

contract SimpleUpgradeable {
  bool initialized;
  uint public answer;

  function initialize() public {
    require(!initialized);
    initialized = true;

    answer = 42;
  }
}
