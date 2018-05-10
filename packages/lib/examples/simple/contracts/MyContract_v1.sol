pragma solidity ^0.4.21;


import "zos-lib/contracts/migrations/Initializable.sol";


contract MyContract_v1 is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }


  function y() public pure returns (uint256) {
    return 1337;
  }
}

