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

contract ChildImplV1 is ImplV1 {
  function say() public pure returns (string) {
    return "ChildV1";
  }
}

contract WithLibraryImplV1 is ImplV1 {
  using UintLib for uint256;
  using Uint32Lib for uint32;

  function double(uint256 x) public pure returns (uint256) {
    return x.double();
  }

  function triple(uint32 x) public pure returns (uint32) {
    return x.triple();
  }

  function say() public pure returns (string) {
    return "WithLibraryV1";
  }
}

contract UninitializableImplV1 {
  function say() public pure returns (string) {
    return "UninitializableImplV1";
  }
}
