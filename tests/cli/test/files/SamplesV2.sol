pragma solidity ^0.5.0;

import "mock-stdlib/contracts/Parent.sol";

contract Foo is Parent {
    function say() public pure returns (string memory) {
        return "FooV2";
    }
}

contract Bar {
    function say() public pure returns (string memory) {
        return "BarV2";
    }
}

contract Baz {
    function say() public pure returns (string memory) {
        return "BazV2";
    }
}
