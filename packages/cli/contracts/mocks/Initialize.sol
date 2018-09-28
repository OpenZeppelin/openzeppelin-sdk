pragma solidity ^0.4.24;

contract WithInitialize {
  uint public value;

  function initialize() public {
    value = 42;
  }
}

contract AnotherWithInitialize {
  uint public anotherValue;

  function initialize() public {
    anotherValue = 42;
  }
}

contract WithoutInitialize {
  function say() public pure returns (string) {
    return "WithoutInitialize";
  }
}

contract WithBaseUninitialized is WithInitialize, AnotherWithInitialize {
  uint public someValue;

  function initialize() public {
    someValue = 42;
  }
}

contract WithBaseInitialized is WithInitialize, AnotherWithInitialize {
  uint public someValue;

  function initialize() public {
    WithInitialize.initialize();
    AnotherWithInitialize.initialize();
    someValue = 42;
  }
}

contract WithSimpleBaseUninitialized is WithoutInitialize {
  uint public someValue;

  function initialize() public {
    someValue = 42;
  }
}
