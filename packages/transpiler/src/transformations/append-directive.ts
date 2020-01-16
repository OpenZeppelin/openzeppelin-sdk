import { getImportDirectives, getPragmaDirectives, getSourceIndices } from '../solc/ast-utils';
import { Node } from '../solc/ast-node';
import { Transformation } from '../transformation';

export function appendDirective(fileNode: Node, directive: string): Transformation {
  const retVal = {
    start: 0,
    end: 0,
    text: directive,
  };
  const importsAndPragmas = [...getPragmaDirectives(fileNode), ...getImportDirectives(fileNode)];
  if (importsAndPragmas.length) {
    const [last] = importsAndPragmas.slice(-1);
    const [start, len] = getSourceIndices(last);
    retVal.start = start + len;
    retVal.end = start + len;
  }

  return retVal;
}
