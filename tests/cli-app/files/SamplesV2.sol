pragma solidity ^0.4.24;

contract Foo {
  function say() pure returns(string) {
    return "FooV2";
  }
}

contract Bar {
  function say() pure returns(string) {
    return "BarV2";
  }
}

contract Baz {
  function say() pure returns(string) {
    return "BazV2";
  }
}
