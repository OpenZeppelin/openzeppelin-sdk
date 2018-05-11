pragma solidity ^0.4.21;

contract DummyImplementation {
  uint256 public value;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function get() public pure returns (bool) {
    return true;
  }

  function version() public pure returns (string) {
    return "V1";
  }
}

contract DummyImplementationV2 is DummyImplementation {
  function migrate(uint256 newVal) public {
    value = newVal;
  }

  function version() public pure returns (string) {
    return "V2";
  }
}
