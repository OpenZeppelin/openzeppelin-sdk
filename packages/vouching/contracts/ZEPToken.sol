pragma solidity ^0.4.24;


import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Pausable.sol";
import "tpl-contracts-eth/contracts/token/TPLRestrictedReceiverToken.sol";

/**
 * @title ZEPToken
 * @dev ZEP token contract, a detailed ERC20 including pausable functionality.
 * The TPLToken integration causes tokens to only be transferrable to addresses
 * which have the validRecipient attribute in the jurisdiction.
 */
contract ZEPToken is Initializable, TPLRestrictedReceiverToken, ERC20Detailed, ERC20Pausable {

  function initialize(
    address _sender,
    AttributeRegistryInterface _jurisdictionAddress,
    uint256 _validRecipientAttributeId
  )
    initializer
    public
  {
    uint8 decimals = 18;
    uint256 totalSupply = 1e8 * (10 ** uint256(decimals));

    ERC20Pausable.initialize(_sender);
    ERC20Detailed.initialize("ZEP Token", "ZEP", decimals);
    TPLRestrictedReceiverToken.initialize(_jurisdictionAddress, _validRecipientAttributeId);
    _mint(_sender, totalSupply);
  }

}
