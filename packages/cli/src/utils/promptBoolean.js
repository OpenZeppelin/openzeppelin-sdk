function promptBoolean(question, onTrue, onFalse = () => {}) {
  const readline = require('readline')
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });

  function recursivePrompt() {
    prompt.question(`${question} (Y/n): `, async function (answer) {
      const parsedAnswer = answer.toUpperCase();
      if(parsedAnswer === 'Y' || parsedAnswer === '') {
        prompt.close()
        await onTrue()
      }
      else if(parsedAnswer === 'N') {
        prompt.close()
        await onFalse()
      }
      else {
        console.log('Please enter a valid answer')
        recursivePrompt()
      }
    })
  }

  recursivePrompt()
}

module.exports = promptBoolean