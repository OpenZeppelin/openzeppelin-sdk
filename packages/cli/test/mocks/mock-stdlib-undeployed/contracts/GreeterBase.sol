pragma solidity ^0.4.24;

contract GreeterBase {
  event Greeting(string greeting);

  uint256 public value;

  function initialize(uint256 _value) public {
    value = _value;
  } 

  function clashingInitialize(uint256 _value) public {
    value = _value;
  } 
}
