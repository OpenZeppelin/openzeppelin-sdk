pragma solidity ^0.5.0;

contract SIA {
    uint256 public foo;
    event log(string);
    constructor() public {
        emit log("SIA");
    }
}

contract SIB is SIA {
    string public bar = "hello";
    constructor(string memory input) public {
        bar = input;
        emit log("SIB");
    }
}