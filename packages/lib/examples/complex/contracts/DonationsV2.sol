pragma solidity ^0.4.21;

import "./DonationsV1.sol";
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

contract DonationsV2 is DonationsV1 {

  // Keeps track of the highest donation.
  uint256 public highestDonation;

  // ERC721 non-fungible tokens to be emitted on donations.
  MintableERC721Token public token;
  uint256 public numEmittedTokens;

  function setToken(MintableERC721Token _token) external onlyOwner {
    require(_token != address(0));
    token = _token;
  }

  function donate() payable public {
    super.donate();

    // Is this the highest donation?
    if(msg.value > highestDonation) {

      // Emit a token.
      token.mint(msg.sender, numEmittedTokens);
      numEmittedTokens++;

      highestDonation = msg.value;
    }
  }
}
