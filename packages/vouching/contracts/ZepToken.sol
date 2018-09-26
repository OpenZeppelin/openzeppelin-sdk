pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is StandardToken, PausableToken {

  string public constant name = "Zep Token";
  string public constant symbol = "ZEP";
  uint8 public constant decimals = 18;

  uint256 public constant TOTAL_SUPPLY = 1e8 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens, and sets it as the owner
   */
  constructor() public {
    totalSupply_ = TOTAL_SUPPLY;
    balances[msg.sender] = TOTAL_SUPPLY;
    emit Transfer(address(0), msg.sender, TOTAL_SUPPLY);
  }


}
