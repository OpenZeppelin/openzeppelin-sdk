import _ from 'lodash';

export function logStorageLayoutDiffs(storageDiff, originalStorageInfo, updatedStorageInfo, log) {
  if (_.isEmpty(storageDiff)) return;

  storageDiff.forEach(({ updated, original, action }) => {
    const updatedSourceCode = updated && fs.exists(updated.path) && fs.read(updated.path)
    const updatedVarType = updated && updatedStorageInfo.types[updated.type];
    const updatedVarSource = updated && [updated.path, _srcToLineNumber(updated.path, updated.src)].join(':');
    const updatedVarDescription = updated && 
      (_tryGetSourceFragment(updatedSourceCode, updatedVarType.src) 
       || [updatedVarType.label, updated.label].join(' '));
    
    const originalVarType = original && originalStorageInfo.types[original.type];
    const originalVarDescription = original && [originalVarType.label, original.label].join(' ');

    switch (action) {
      case 'insert':
        log.error(`- New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource}\n` +
                  `  This pushes all variables after ${updated.label} to a higher position in storage, `+
                  `causing the updated contract to read incorrect initial values. Only add new variables at the `+
                  `end of your contract to prevent this issue.`);
        break;
      case 'delete':
        log.error(`- Variable '${originalVarDescription}' was removed from contract ${original.contract}.\n`+
                  `  This will move all variables after ${original.label} to a lower position in storage, `+
                  `causing the updated contract to read incorrect initial values. Avoid deleting existing ` +
                  `variables to prevent this issue, and rename them to communicate that they are not to be used.`);
        break;
      case 'append':
        log.info(`- New variable '${updatedVarDescription}' was added in contract ${updated.contract} in ${updatedVarSource} `+
                 `at the end of the contract.\n` +
                 `  This does not alter the original storage, and should be a safe change.`)
        break;
      case 'pop':
        log.warn(`- Variable '${originalVarDescription}' was removed from the end of contract ${original.contract}.\n`+
                 `  Though this will not alter the positions in storage of other variables, if a new variable is added ` +
                 `at the end of the contract, it will have the initial value of ${original.label} when upgrading. ` +
                 `Avoid deleting existing variables to prevent this issue, and rename them to communicate that they are not to be used.`);
        break;
      case 'rename':
        log.warn(`- Variable '${originalVarDescription}' in contract ${original.contract} was renamed to ${updated.label} in ${updatedVarSource}.\n` +
                 `  Note that the new variable ${updated.label} will have the value of ${original.label} after upgrading. ` +
                 `If this is not the desired behavior, add a new variable ${updated.label} at the end of your contract instead.`)
        break;
      case 'typechange':
        log.warn(`- Variable '${original.label}' in contract ${original.contract} was changed from ${originalVarType.label} ` +
                 `to ${updatedVarType.label} in ${updatedVarSource}.\n` + 
                 `  If ${updatedVarType.label} is not compatible with ${originalVarType.label}, ` +
                 `then ${updated.label} could be initialized with an invalid value after upgrading. Avoid changing types of existing ` +
                 `variables to prevent this issue, and declare new ones at the end of your contract instead.`)
        break;
      case 'replace':
        log.warn(`- Variable '${originalVarDescription}' in contract ${original.contract} was replaced with '${updatedVarDescription}' ` +
                 `in ${updatedVarSource}.\nThis will cause ${updated.label} to be initialized with the value of ${original.label}. ` +
                 `  If type ${updatedVarType.label} is not compatible with ${originalVarType.label}, then ${updated.label} could be `+
                 `initialized with an invalid value after upgrading. Avoid changing types of existing ` +
                 `variables to prevent this issue, and declare new ones at the end of your contract instead.`)
        break;
      default:
        log.error(`Unexpected layout changeset: ${action}`)
    }
  });

  log.info('Read more at https://docs.zeppelinos.org/docs/advanced.html#preserving-the-storage-structure')
}

function _srcToLineNumber(sourceCode, srcFragment) {
  if (!sourceCode || !srcFragment) return null;
  const [begin] = srcFragment.split(':', 1);
  return sourceCode.substr(0, begin).split('\n').length
}

function _tryGetSourceFragment(sourceCode, src) {
  if (!src || !sourceCode) return null;
  const [begin, count] = src.split(':');
  return sourceCode.substr(begin, count);
}
