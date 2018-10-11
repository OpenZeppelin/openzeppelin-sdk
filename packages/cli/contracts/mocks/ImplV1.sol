pragma solidity ^0.4.24;

import "./Libraries.sol";

contract ImplV1 {
  uint256 public value;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function say() public pure returns (string) {
    return "V1";
  }
}

contract AnotherImplV1 is ImplV1 {
  using UintLib for uint256;

  function double(uint256 x) public pure returns (uint256) {
    return x.double();
  }

  function say() public pure returns (string) {
    return "AnotherV1";
  }
}

contract UninitializableImplV1 {
  function say() public pure returns (string) {
    return "UninitializableImplV1";
  }
}
