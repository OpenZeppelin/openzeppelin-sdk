pragma solidity ^0.4.24;

contract Boolean {
  bool public value;

  function initialize(bool _value) public {
    value = _value;
  }
}
