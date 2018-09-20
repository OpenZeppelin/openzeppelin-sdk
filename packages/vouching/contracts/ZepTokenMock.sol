pragma solidity ^0.4.24;

import './ZepToken.sol';

contract ZepTokenMock is ZepToken {

  constructor(address owner, uint256 initialBalance) public ZepToken(owner) {
    balances[owner] = initialBalance;
    totalSupply_ = initialBalance;
  }

}

