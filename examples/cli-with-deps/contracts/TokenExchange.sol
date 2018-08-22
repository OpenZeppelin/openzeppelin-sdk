pragma solidity ^0.4.24;

import "openzeppelin-zos/contracts/token/ERC20/StandardToken.sol";
import "dep-basic/contracts/EthBox.sol";

contract TokenExchange {
  uint256 constant rate = 10;

  StandardToken public token;
  EthBox public box;
  address public beneficiary;

  function initialize(address _beneficiary, StandardToken _token, EthBox _box) public {
    require(token == address(0));
    token = _token;
    box = _box;
    beneficiary = _beneficiary;
  }
  
  function () public payable {
    require(token.transfer(msg.sender, msg.value * rate));
    box.deposit.value(msg.value)(beneficiary);
  }
}

