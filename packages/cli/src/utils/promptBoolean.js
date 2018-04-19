const readline = require('readline')

function promptBoolean(question, onTrue, onFalse = () => {}) {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });

  const recursivePrompt = () => {
    prompt.question(`${question} (Y/n): `, function(answer) {
      const parsedAnswer = answer.toUpperCase();
      if(parsedAnswer === 'Y') {
        prompt.close()
        onTrue()
      }
      else if(parsedAnswer === 'N') {
        prompt.close()
        onFalse()
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
