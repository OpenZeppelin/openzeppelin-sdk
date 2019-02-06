pragma solidity ^0.4.24;

import "./Libraries.sol";
import "mock-stdlib/contracts/GreeterLib.sol";

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

  function double(uint256 x) public pure returns (uint256) {
    return x.double();
  }

  function say() public pure returns (string) {
    return "WithLibraryV1";
  }
}

contract WithDependencyLibraryImplV1 is ImplV1 {
  using GreeterLib for string;
  
  function say() public pure returns (string) {
    string memory str = "WithDependencyLibraryV1";
    return str.wrap();
  }
}

contract UninitializableImplV1 {
  function say() public pure returns (string) {
    return "UninitializableImplV1";
  }
}
