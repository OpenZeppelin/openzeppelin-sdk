pragma solidity ^0.4.24;

contract EthBox {
  address owner;

  function withdraw() public {
    require(msg.sender == owner);
    owner.transfer(address(this).balance);
  }

  function deposit(address beneficiary) payable public {
    require(owner == address(0) || beneficiary == owner);
    if (owner != beneficiary) owner = beneficiary;
  }

  function () payable public{
    deposit(msg.sender);
  }
}

