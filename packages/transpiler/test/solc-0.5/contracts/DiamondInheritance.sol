pragma solidity ^0.5.0;

contract DA {
    event Log(string);
    uint256 public foo = 42;
    constructor() public {
        emit Log("DA");
    }
}

contract DB1 is DA {
    string public hello = "hello";
    constructor() public {
        emit Log("DB1");
    }
}

contract DB2 is DA {
    bool public bar = true;
    constructor() public {
        emit Log("DB2");
    }
}

contract DC is DB2, DB1 {
    address public owner = address(0x123);
    constructor() public {
        emit Log("DC");
    }
}