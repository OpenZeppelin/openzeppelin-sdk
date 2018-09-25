pragma solidity ^0.4.24;

import './TPL/TPLToken.sol';

/**
 * @title ZepToken
 * @dev ZEP token contract including mintable, pausable and burnable functionalities
 */
contract ZepToken is TPLToken {

  function zepInitialize(
    AttributeRegistry _jurisdictionAddress, 
    uint256 _validRecipientAttributeId
  ) 
    isInitializer("ZEPToken", "1.0.0")
    public
  {
    uint8 decimals = 18;
    uint256 TOTAL_SUPPLY = 1e8 * (10 ** uint256(decimals));
    TPLToken.initialize(
      msg.sender, 
      "Zep Token", 
      "ZEP",
      decimals,
      TOTAL_SUPPLY,
      _jurisdictionAddress,
      _validRecipientAttributeId
    );

    emit Transfer(address(0), msg.sender, TOTAL_SUPPLY);
  }

}
