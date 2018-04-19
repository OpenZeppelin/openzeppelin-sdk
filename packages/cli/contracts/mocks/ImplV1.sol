pragma solidity ^0.4.21;

contract ImplV1 {

  uint256 public value;

  function initialize(uint256 _value) {
    value = _value;
  }

  function say() public pure returns (string) {
    return "V1";
  }
}
