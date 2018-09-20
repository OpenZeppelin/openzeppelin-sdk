pragma solidity ^0.4.24;

contract Impl {
  function version() public pure returns (string); 
}

contract DummyImplementation {
  uint256 public value;
  string public text;
  uint256[] public values;

  function initializeNonPayable() public {
    value = 10;
  }

  function initializePayable() payable public {
    value = 100;
  }

  function initializeNonPayable(uint256 _value) public {
    value = _value;
  }

  function initializePayable(uint256 _value) payable public {
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
  function migrate(uint256 newVal) payable public {
    value = newVal;
  }

  function version() public pure returns (string) {
    return "V2";
  }
}
