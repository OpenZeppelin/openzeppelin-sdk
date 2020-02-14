pragma solidity ^0.5;

contract ValueWithInitializer {
  uint public value;
  function initialize(uint x, uint y) public {
    value = x * y;
  }
}
