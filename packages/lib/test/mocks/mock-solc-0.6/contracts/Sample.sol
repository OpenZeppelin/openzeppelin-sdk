pragma solidity ^0.6.0;

contract Base {
  function basePure() public pure { }
  function basePayable() public payable { }
}

contract Sample is Base {
  uint256 public value;

  function samplePure(uint256 x) public pure returns (uint256) { return x; }
  function sampleView() public view returns (uint256) { return value; }
  function samplePayable() public payable { value = value + 1; }
  function sampleNonpayable(uint256 x) public { value = value + x; }
}
