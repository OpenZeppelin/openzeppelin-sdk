pragma solidity ^0.4.24;

import "../application/App.sol";
import "../Initializable.sol";

contract ProxyCreator is Initializable {

  address public created;

  function initialize(App app, string packageName, string contractName, bytes data) public initializer {
    created = app.create(packageName, contractName, data);
  }

  function name() public pure returns (string) {
    return "ProxyCreator";
  }

}
