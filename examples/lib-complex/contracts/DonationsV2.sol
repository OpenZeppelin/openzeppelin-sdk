pragma solidity ^0.4.21;

import "./DonationsV1.sol";
import "openzeppelin-zos/contracts/token/ERC721/ERC721Mintable.sol";

contract DonationsV2 is DonationsV1 {
  using SafeMath for uint256;

  // ERC721 non-fungible tokens to be emitted on donations.
  ERC721Mintable public token;
  uint256 public numEmittedTokens;

  function setToken(ERC721Mintable _token) external {
    require(_token != address(0));
    require(token == address(0));
    token = _token;
  }

  function donate() payable public {
    super.donate();

    // Emit a token.
    token.mint(msg.sender, numEmittedTokens);
    numEmittedTokens = numEmittedTokens.add(1);
  }
}
