pragma solidity ^0.5.0;

import "./Libraries.sol";
import "mock-stdlib/contracts/GreeterImpl.sol";

contract ImplV1 {
  uint256 public value;
  uint256[] public numbers;

  event InitializeEvent(uint256 value);

  function initialize(uint256 _value) public {
    value = _value;
  }

  function initializeWithEvent(uint256 _value) public {
    value = _value;
    emit InitializeEvent(value);
  }

  function initializeNumbers(uint256[] memory _numbers) public {
    numbers = _numbers;
  }

  function say() public pure returns (string memory) {
    return "V1";
  }

  function sayMore() public pure returns (string memory, uint256) {
    return ("V1", 1);
  }

  function sayNumbers() public view returns (uint256[] memory) {
    return numbers;
  }

  function doesNotReturn() public pure {
    uint256 num = 42;
    num = num + 41;
  }
}

contract ChildImplV1 is ImplV1 {
  function say() public pure returns (string memory) {
    return "ChildV1";
  }
}

contract WithExternalContractImplV1 is ImplV1, GreeterImpl {
  function say(string memory phrase) public pure returns(string memory) {
    return phrase.wrap();
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

  function say() public pure returns (string memory) {
    return "WithLibraryV1";
  }
}

contract UninitializableImplV1 {
  function say() public pure returns (string memory) {
    return "UninitializableImplV1";
  }
}
