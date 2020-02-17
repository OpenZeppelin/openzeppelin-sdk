pragma solidity ^0.5.0;

contract SIA {
    uint256 public foo;
    event log(string);
    constructor() public {
        emit log("SIA");
    }
}

contract SIB is SIA {
    uint256 public val = 123;
}

contract SIC is SIB {
    string public bar = "hello";
    constructor() public {
        bar = "changed";
        emit log("SIC");
    }
}