pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "zos-lib/contracts/application/App.sol";

contract Factory is Initializable {

  App public app;
  
  function initialize(address _appContractAddress) public initializer {
    app = App(_appContractAddress);
  }

  function createInstance(bytes _data) public returns (address proxy) {
    return address(app.create("dynamic-instance", "Instance", msg.sender, _data));
  }
}
