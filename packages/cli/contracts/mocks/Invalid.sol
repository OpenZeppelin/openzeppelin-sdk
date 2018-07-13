pragma solidity ^0.4.24;

contract WithConstructor {
  uint256 public value;

  constructor() public {
    value = 42;
  }

  function say() public pure returns (string) {
    return "WithConstructor";
  }
}

contract WithFailingConstructor {
  constructor() public {
    assert(false);
  }
}
