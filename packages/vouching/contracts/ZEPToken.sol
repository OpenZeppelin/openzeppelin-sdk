pragma solidity ^0.4.24;

import "tpl-contracts-zos/contracts/TPLToken.sol";
import "openzeppelin-zos/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-zos/contracts/token/ERC20/ERC20Pausable.sol";


/**
 * @title ZepToken
 * @dev ZEP token contract, a detailed ERC20 including pausable functionality.
 * The TPLToken integration causes tokens to only be transferrable to addresses
 * which have the validRecipient attribute in the jurisdiction.
 */
contract ZEPToken is Initializable, TPLToken, ERC20Detailed, ERC20Pausable {

  function initialize(
    address _sender,
    AttributeRegistry _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  )
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 1e8 * (10 ** uint256(decimals));

    ERC20Pausable.initialize(_sender);
    ERC20Detailed.initialize("ZEP Token", "ZEP", decimals);
    TPLToken.initialize(_jurisdictionAddress, _validRecipientAttributeId);
    _mint(_sender, totalSupply);
  }

}
