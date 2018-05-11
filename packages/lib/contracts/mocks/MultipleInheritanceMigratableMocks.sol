pragma solidity ^0.4.21;

import '../migrations/Migratable.sol';

// Sample contracts showing upgradeability and migrations with multiple inheritance
// Child contract inherits from Father and Mother contracts, and Father extends from Gramps
// 
//              Gramps
//                |
//    Mother    Father
//      |         |
//      -- Child --
//

/**
 * Sample base migratable contract that defines a field mother
 */
contract SampleMotherV1 is Migratable {
  uint256 public mother;

  function initialize(uint256 value) isInitializer("Mother", "migration_1") public {
    mother = value;
  }
}

/**
 * V2 for base mother contract
 */
contract SampleMotherV2 is SampleMotherV1 {
  function migrate(uint256 value) isMigration("Mother", "migration_1", "migration_2") public {
    mother = value;
  }
}

/**
 * Sample base migratable contract that defines a field gramps
 */
contract SampleGrampsV1 is Migratable {
  uint256 public gramps;

  function initialize(uint256 value) isInitializer("Gramps", "migration_1") public {
    gramps = value;
  }
}

/**
 * V2 for base gramps contract
 */
contract SampleGrampsV2 is SampleGrampsV1 {
  function migrate(uint256 value) isMigration("Gramps", "migration_1", "migration_2") public {
    gramps = value;
  }
}

/**
 * Sample base migratable contract that defines a field father and extends from gramps
 */
contract SampleFatherV1 is SampleGrampsV1 {
  uint256 public father;

  function initialize(uint256 _gramps, uint256 _father) isInitializer("Father", "migration_1") public {
    SampleGrampsV1.initialize(_gramps);
    father = _father;
  }
}

/**
 * V2 for base father contract, which extends from grampsV2
 */
contract SampleFatherV2 is SampleFatherV1, SampleGrampsV2 {
  function migrate(uint256 _gramps, uint256 _father) isMigration("Father", "migration_1", "migration_2") public {
    SampleGrampsV2.migrate(_gramps);
    father = _father;
  }
}

/**
 * ChildV1 extends from motherV1, fatherV1 (grampsV1)
 */
contract SampleChildV1 is Migratable, SampleMotherV1, SampleFatherV1 {
  uint256 public child;

  function initialize(uint256 _mother, uint256 _gramps, uint256 _father, uint256 _child) isInitializer("Child", "migration_1") public {
    SampleMotherV1.initialize(_mother);
    SampleFatherV1.initialize(_gramps, _father);
    child = _child;
  }
}

/**
 * ChildV2 extends from motherV1, fatherV1 (grampsV1)
 */
contract SampleChildV2 is SampleChildV1 {
  function migrate(uint256 _child) isMigration("Child", "migration_1", "migration_2") public {
    child = _child;
  }
}

/**
 * ChildV3 extends from motherV2, fatherV1 (grampsV1)
 */
contract SampleChildV3 is SampleChildV2, SampleMotherV2  {
  function migrate(uint256 _mother, uint256 _child) isMigration("Child", "migration_2", "migration_3") public {
    SampleMotherV2.migrate(_mother);
    child = _child;
  }
}

/**
 * ChildV4 extends from motherV2, fatherV2 (grampsV2)
 */
contract SampleChildV4 is SampleChildV3, SampleFatherV2  {
  function migrate(uint256 _gramps, uint256 _father, uint256 _child) isMigration("Child", "migration_3", "migration_4") public {
    SampleFatherV2.migrate(_gramps, _father);
    child = _child;
  }
}

/**
 * ChildV5 extends from motherV2, fatherV2 (grampsV2), has the same signature in migrate than V1, and allows to be initialized directly as well or from V3
 */
contract SampleChildV5 is SampleChildV4 {
  function initialize(uint256 _mother, uint256 _gramps, uint256 _father, uint256 _child) isInitializer("Child", "migration_5") public {
    SampleMotherV1.initialize(_mother);
    SampleMotherV2.migrate(_mother);
    SampleFatherV1.initialize(_gramps, _father);
    SampleFatherV2.migrate(_gramps, _father);
    child = _child;
  }

  function migrateFromV3(uint256 _gramps, uint256 _father, uint256 _child) isMigration("Child", "migration_3", "migration_5") public {
    SampleChildV4.migrate(_gramps, _father, _child);
  }

  function migrate(uint256 _child) isMigration("Child", "migration_4", "migration_5") public {
    child = _child;
  }
}
