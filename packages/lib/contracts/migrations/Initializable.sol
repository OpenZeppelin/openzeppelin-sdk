pragma solidity ^0.4.21;

contract Initializable {
  bool private _initialized;

  modifier isInitializer() {
    require(!_initialized);
    _;
    _initialized = true;
  }
}
