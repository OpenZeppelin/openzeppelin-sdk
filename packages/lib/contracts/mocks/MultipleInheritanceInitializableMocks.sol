pragma solidity ^0.4.24;

import '../Initializable.sol';

// Sample contracts showing upgradeability with multiple inheritance.
// Child contract inherits from Father and Mother contracts, and Father extends from Gramps.
// 
//         Human
//       /       \
//      |       Gramps
//      |         |
//    Mother    Father
//      |         |
//      -- Child --

/**
 * Sample base intializable contract that is a human
 */
contract SampleHuman is Initializable {
  bool public isHuman;

  function initialize() isInitializer public {
    isHuman = true;
  }
}

/**
 * Sample base intializable contract that defines a field mother
 */
contract SampleMother is Initializable, SampleHuman {
  uint256 public mother;

  function initialize(uint256 value) isInitializer public {
    SampleHuman.initialize();
    mother = value;
  }
}

/**
 * Sample base intializable contract that defines a field gramps
 */
contract SampleGramps is Initializable, SampleHuman {
  uint256 public gramps;

  function initialize(uint256 value) isInitializer public {
    SampleHuman.initialize();
    gramps = value;
  }
}

/**
 * Sample base intializable contract that defines a field father and extends from gramps
 */
contract SampleFather is Initializable, SampleGramps {
  uint256 public father;

  function initialize(uint256 _gramps, uint256 _father) isInitializer public {
    SampleGramps.initialize(_gramps);
    father = _father;
  }
}

/**
 * Child extends from mother, father (gramps)
 */
contract SampleChild is Initializable, SampleMother, SampleFather {
  uint256 public child;

  function initialize(uint256 _mother, uint256 _gramps, uint256 _father, uint256 _child) isInitializer public {
    SampleMother.initialize(_mother);
    SampleFather.initialize(_gramps, _father);
    child = _child;
  }
}
