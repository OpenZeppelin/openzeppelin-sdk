pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract Instance is Initializable {
  
  uint256 public value;

  function initialize(uint256 _value) public initializer {
    value = _value;
  }
}
