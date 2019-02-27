pragma solidity ^0.5.0;

contract Boolean {
  bool public value;

  function initialize(bool _value) public {
    value = _value;
  }
}
