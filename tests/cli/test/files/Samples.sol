pragma solidity ^0.4.24;

import "mock-stdlib/contracts/Parent.sol";

contract Foo is Parent {
  function say() pure returns(string) {
    return "Foo";
  }
}

contract Bar {
  function say() pure returns(string) {
    return "Bar";
  }
}

contract Baz {
  function say() pure returns(string) {
    return "Baz";
  }
}
