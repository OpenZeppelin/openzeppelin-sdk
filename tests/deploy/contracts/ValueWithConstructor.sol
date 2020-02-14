pragma solidity ^0.5;

contract ValueWithConstructor {
  uint public value;
  constructor (uint x, uint y) public {
    value = x * y;
  }
}
