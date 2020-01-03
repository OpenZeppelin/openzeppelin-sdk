pragma solidity ^0.5.0;

import "./MyContractV0.sol";

contract MyContractV1 is MyContractV0 {
  function add(uint256 _value) public {
    value = value + _value;
  }
}

