pragma solidity ^0.4.21;


import "zos-lib/contracts/migrations/Initializable.sol";


contract MyContract_v1 is Initializable {
  bool internal initialized;

  uint256 public x;
  
  function initialize(uint256 _x) public {
    require(!initialized);
    x = _x;
    initialized = true;
  }


  function y() public pure returns (uint256) {
    return 1337;
  }
}

