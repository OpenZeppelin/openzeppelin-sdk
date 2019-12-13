pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "./ImplV1.sol";

contract ImplV2 is ImplV1 {
  function migrate(uint256 newVal) public {
    value = newVal;
  }

  function say() public pure returns (string memory) {
    return "V2";
  }
}

contract ChildImplV2 is ImplV2 {
  function say() public pure returns (string memory) {
    return "ChildV1";
  }
}

contract WithExternalContractImplV2 is ImplV2, GreeterImpl {
  function say(string memory phrase) public pure returns(string memory) {
    return phrase.wrap();
  }
}

contract WithLibraryImplV2 is ImplV2 {
  using UintLib for uint256;

  function double(uint256 x) public pure returns (uint256) {
    return x.double();
  }

  function say() public pure returns (string memory) {
    return "WithLibraryV2";
  }
}

contract UnmigratableImplV2 is ImplV2 {
  function migrate(uint256) public {
    assert(false);
  }

  function say() public pure returns (string memory) {
    return "UnmigratableImplV2";
  }
}
