pragma solidity ^0.5.0;

import "./Libraries.sol";
import "mock-stdlib-libdeps/contracts/GreeterLibWithLibImpl.sol";

contract ImplV1b {
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

  function initializeThatFails(uint256 _value) public {
    require(false, "Fail");
    value = _value;
  }

  function say() public view returns (uint256) {
    return 15;
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

contract ChildImplV1b is ImplV1b {
  function say() public view returns (uint256) {
    return 41;
  }
}

contract WithExternalContractImplV1 is ImplV1b, GreeterLibWithLibImpl {
  function say() public view returns(uint256) {
    return state.getNumber();
  }
}

contract WithLibraryImplV1 is ImplV1b {
  using UintLib for uint256;
  using Uint32Lib for uint32;

  function double(uint256 x) public pure returns (uint256) {
    return x.double();
  }

  function triple(uint32 x) public pure returns (uint32) {
    return x.triple();
  }

  function say() public view returns (uint256) {
    return 2;
  }
}

contract UninitializableImplV1 {
  function say() public view returns (uint256) {
    return 4;
  }
}
