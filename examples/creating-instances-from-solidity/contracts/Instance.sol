pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract Instance is Initializable {
  
  uint256 public value;

  function initialize(uint256 _value) public initializer {
    value = _value;
  }
}
