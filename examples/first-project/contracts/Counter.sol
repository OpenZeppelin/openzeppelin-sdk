pragma solidity ^0.5.0;

contract Counter {
  uint256 public value;
  
  function increase(uint256 amount) public {
    value += amount;
  }
}
