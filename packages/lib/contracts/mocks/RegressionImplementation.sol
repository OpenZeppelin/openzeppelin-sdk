pragma solidity ^0.5.0;

import "../Initializable.sol";

contract Implementation1 is Initializable {
  uint value;

  function initialize() initializer public {
  }

  function setValue(uint _number) public {
    value = _number;
  }
}

contract Implementation2 is Initializable {
  uint value;

  function initialize() initializer public {
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

  function initialize() initializer public {
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

  function initialize() initializer public {
  }

  function setValue(uint _number) public {
    value = _number;
  }

  function getValue() public view returns (uint) {
    return value;
  }

  function() external {
    value = 1;
  }
}
