
/**
 * Handle any potential error codes returned by a shelljs
 * command execution.
 */
function handleErrorCode(commandOutput) {
  if (commandOutput.code !== 0) {
    throw new Error([
      `Command line operation failed with code ${commandOutput.code}.`,
      `Standard error output: ${commandOutput.stderr}`
    ].join('\n'))
  }
}

module.exports = {
  handleErrorCode
}