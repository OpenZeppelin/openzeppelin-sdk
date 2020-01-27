/**
 * Schema of an Abstract Syntax Tree Node.
 * This schema only describes the properies that are mandatory across all nodes.
 * Additional attrs can exist depending on the entity the Node represents.
 */

// A fully qualified, minimal object for this Schema is:
/*
{
	"nodeType": "Literal",
}
*/

const array = { type: 'array' },
  number = { type: 'number' },
  bool = { type: 'boolean' },
  string = { type: 'string' },
  object = { type: 'object' },
  attrNull = { type: 'null' };

export default {
  type: 'object',

  properties: {
    nodeType: { type: 'string', minLength: 1 },
  },

  patternProperties: {
    '^.+$': {
      oneOf: [array, string, object, number, attrNull, bool],
    },
  },

  required: ['nodeType'],
  additionalProperties: false,
};
