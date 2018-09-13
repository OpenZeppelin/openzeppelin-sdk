pragma solidity ^0.4.21;

import "zos-lib/contracts/Initializable.sol";

contract MyContract_v0 is Initializable {
  uint256 public value;
  
  function initialize(uint256 _value) initializer public {
    value = _value;
  }
}

