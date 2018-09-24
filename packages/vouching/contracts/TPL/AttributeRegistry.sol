pragma solidity ^0.4.24;

/**
 * @title Attribute Registry interface
 */
interface AttributeRegistry {
  /**
   * @notice Check if an attribute has been assigned to a given address.
   * @param _who The address to check.
   * @param _attribute The ID of the attribute to check for.
   * @return True if the attribute has been assigned, false otherwise.
   */
  function hasAttribute(
  	address _who,
  	uint256 _attribute
  ) external view returns (bool);

  /**
   * @notice Retrieve the value of an attribute at a given address.
   * @param _who The address to check.
   * @param _attribute The ID of the attribute to check for.
   * @return The attribute value if an attribute is assigned, 0 otherwise.
   */
  function getAttribute(
  	address _who,
  	uint256 _attribute
  ) external view returns (uint256);

  /**
   * @notice Retrieve all attributes defined on the registry, designated by ID.
   * @return A dynamic array of attribute IDs.
   */
  function getAvailableAttributes() external view returns (uint256[]);

}