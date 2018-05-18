contract WithConstructor {
  uint256 public value;

  function WithConstructor() {
    value = 42;
  }

  function say() pure returns (string) {
    return "WithConstructor";
  }
}
