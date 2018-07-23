pragma solidity ^0.4.24;

contract Impl {
  function version() public pure returns (string); 
}

contract DummyImplementation {
  uint256 public value;
  string public text;
  uint256[] public values;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function initialize(uint256 _value, string _text, uint256[] _values) public {
    value = _value;
    text = _text;
    values = _values;
  }

  function get() public pure returns (bool) {
    return true;
  }

  function version() public pure returns (string) {
    return "V1";
  }

  function reverts() public pure {
    require(false);
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
