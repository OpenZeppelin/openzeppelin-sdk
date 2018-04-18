import shelljs from 'shelljs'

function run() {
  let node = 'npx babel-node'
  let script = `./scripts/${process.argv[2]}.js`
  let args = process.argv.slice(3).join(' ')
  let command = `${node} ${script} ${args}`

  console.log(command)
  shelljs.exec(command)
}

run()