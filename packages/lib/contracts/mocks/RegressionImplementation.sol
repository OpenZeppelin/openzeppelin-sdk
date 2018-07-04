pragma solidity ^0.4.24;

import "../migrations/Initializable.sol";

contract Implementation1 is Initializable {
  uint value;

  function initialize() isInitializer() public {
  }

  function setValue(uint _number) public {
    value = _number;
  }
}

contract Implementation2 is Initializable {
  uint value;

  function initialize() isInitializer() public {
  }

  function setValue(uint _number) public {
    value = _number;
  }

  function getValue() public view returns (uint) {
    return value;
  }
}

contract Implementation3 is Initializable {
  uint value;

  function initialize() isInitializer() public {
  }

  function setValue(uint _number) public {
    value = _number;
  }

  function getValue(uint _number) public view returns (uint) {
    return value + _number;
  }
}

contract Implementation4 is Initializable {
  uint value;

  function initialize() isInitializer() public {
  }

  function setValue(uint _number) public {
    value = _number;
  }

  function getValue() public view returns (uint) {
    return value;
  }

  function() public {
    value = 1;
  }
}
