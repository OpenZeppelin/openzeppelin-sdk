# mock-dependency-to-compile

This project is used to test that the following import styles are supported by the compiler **on a dependency**:

```solidity
// contracts/subfolder/GreeterImpl.sol
import "contracts/subfolder/GreeterLib.sol";
import "./GreeterLib2.sol";
```

This project is here and not in `test/mocks` because otherwise truffle tried to compile it and failed, as it assumed that `import "contracts/subfolder/GreeterLib.sol"` was relative to the main project root, and not to the `mock-project-with-root-imports`.