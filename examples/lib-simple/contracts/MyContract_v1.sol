pragma solidity ^0.4.21;


import "zos-lib/contracts/migrations/Initializable.sol";


contract MyContract_v1 is Initializable {
  uint256 public x;
  
  function initialize(uint256 _value) initializer public {
    value = _value;
  }


  function add(uint256 _value) public {
    value = value + _value;
  }
}

