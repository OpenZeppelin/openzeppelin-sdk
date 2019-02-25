pragma experimental ABIEncoderV2;

contract WithStructInConstructor {

  struct Data {
    string foo;
    string bar;
    uint256 buz;
  }

  Data public localData;
  address public sender;

  constructor(Data _data) public {
    localData.foo = _data.foo;
    localData.bar = _data.bar;
    localData.buz = _data.buz;
    sender = msg.sender;
  }

  function foo() public returns (string) {
    return localData.foo;
  }

  function bar() public returns (string) {
    return localData.bar;
  }

  function buz() public returns (uint256) {
    return localData.buz;
  }
}
