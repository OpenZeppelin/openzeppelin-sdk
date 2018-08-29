pragma solidity ^0.4.24;

import "openzeppelin-zos/contracts/token/ERC721/ERC721Token.sol";

contract WithToken {
  ERC721Token public token;

  function initialize(ERC721Token _token) public {
    require(_token != address(0));
    token = _token;
  }

  function say() public view returns (string) {
    return token.symbol();
  }

  function isERC165() public view returns (bool) {
    return false;
  }
}