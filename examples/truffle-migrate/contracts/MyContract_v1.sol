pragma solidity ^0.4.21;

import "zos-lib/contracts/Initializable.sol";

contract MyContract_v1 is Initializable {
  uint256 public value;
  
  function initialize(uint256 _value) initializer public {
    value = _value;
  }

  function version() public pure returns (string) {
    return "v1";
  }

  function add(uint256 _value) public {
    value = value + _value;
  }
}

