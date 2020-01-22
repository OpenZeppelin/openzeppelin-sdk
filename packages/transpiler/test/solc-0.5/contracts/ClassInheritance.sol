pragma solidity ^0.5.0;

contract CIA {
    uint256 public foo;
    event log(string);
    constructor(uint bar) public {
        foo = bar;
        emit log("SIA");
    }
}

contract CIB is CIA(324) {
    uint256 public val = 123;
}