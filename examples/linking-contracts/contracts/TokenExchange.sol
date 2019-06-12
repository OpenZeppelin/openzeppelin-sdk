pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";

contract TokenExchange is Initializable {
  using SafeMath for uint256;

  uint256 public rate;
  IERC20 public token;

  function initialize(uint256 _rate, IERC20 _token) public initializer {
    rate = _rate;
    token = _token;
  }

  function() external payable {
    uint256 tokens = msg.value.mul(rate);
    token.transfer(msg.sender, tokens);
  }
} 
