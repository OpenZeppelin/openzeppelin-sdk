pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

contract MyContract_v1 is Initializable {
  uint256 public value;
  
  function initialize(uint256 _value) initializer public {
    value = _value;
  }

  function version() public pure returns (string memory) {
    return "v1";
  }

  function add(uint256 _value) public {
    value = value + _value;
  }
}

