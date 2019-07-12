pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/upgrades/contracts/application/App.sol";

contract Factory is Initializable {

  App public app;
  
  function initialize(address _appContractAddress) public initializer {
    app = App(_appContractAddress);
  }

  function createInstance(bytes memory _data) public returns (address proxy) {
    string memory packageName = "creating-instances-from-solidity";
    string memory contractName = "Instance";
    address admin = msg.sender;
    return address(app.create(packageName, contractName, admin, _data));
  }
}
