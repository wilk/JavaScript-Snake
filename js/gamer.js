class Gamer {
  constructor() {
    EB.subscribe('start', this.onStart.bind(this))
    EB.subscribe('dead', this.onDead.bind(this))
    EB.subscribe('set apple position', this.onApplePosition.bind(this))
    EB.subscribe('move', this.onMove.bind(this))
    EB.subscribe('set grid', this.onSetGrid.bind(this))

    this.timeout = null
    this.iteration = 10
    this.generation = []
    this.generations = []
    this.solutions = []
    this.applePosition = null
    this.grid = null
    this.PAUSE_COMMAND = 32
    this.direction = -1
    this.maxRecord = -1
    this.lastGeneration = []
    this.DIRECTIONS_COMMANDS_FROM_COMMAND_MAP = {
      L: ['L', 'R'],
      R: ['L', 'R'],
      D: ['U', 'D'],
      U: ['U', 'D']
    }
    this.OPPOSITE_COMMANDS_MAP = {
      R: 'L',
      L: 'R',
      D: 'U',
      U: 'D',
      N: 'N'
    }
    this.COMMANDS_MAP = {
      D: 40,
      U: 38,
      L: 37,
      R: 39
    }
    // 0: up, 1: left, 2: down, 3: right
    this.DIRECTIONS_MAP_FROM_NUMBER = {
      3: 'R',
      2: 'D',
      1: 'L',
      0: 'U'
    }
    this.DIRECTIONS_MAP_FROM_STRING = {
      'R': 3,
      'D': 2,
      'L': 1,
      'U': 0
    }
  }

  /*play() {
    console.log('*** PLAY *** ')
    const R = 39,
      D = 40,
      U = 38,
      L = 37,
      COMMANDS_MAP = {
        D: 40,
        U: 38,
        L: 37,
        R: 39
      }

    const _PLAY_ = () => {
      clearTimeout(this.timeout)

      const cmd = this.seed()

      console.log('cmd', cmd)

      if (typeof cmd === 'string') {
        EB.publish('keydown', {keyCode: COMMANDS_MAP[cmd]})

        this.generation.push(cmd)
        _PLAY_()
      }
      else {
        // pause until the other command
        this.timeout = setTimeout(() => {
          this.generation.push(cmd)
          _PLAY_()
        }, cmd)
      }
    }

    _PLAY_()
  }*/

  /**
   * generates an individual, starting from the previous one
   * @returns {String|Number}
   */
  /*seed() {
    const lastSeed = this.generation && this.generation.length > 0 ? this.generation[this.generation.length - 1] : null,
      horizontals = ['L','R'],
      verticals = ['D', 'U'],
      pause = Math.abs(Math.ceil(Math.random()*1000)-500) // MAX 500ms

    let commands = []
    if (lastSeed === null) commands = commands.concat(verticals, horizontals)
    else if (typeof lastSeed === 'string') {
      commands.push(pause)
      if (horizontals.includes(lastSeed)) commands = commands.concat(verticals)
      else commands = commands.concat(horizontals)
    }
    else commands = commands.concat(horizontals, verticals)

    let index = 10 - Math.ceil(Math.random()*10)

    if (index >= commands.length) index -= (index - (commands.length - 1))

    return commands[index]
  }*/

  onDead(len) {
    this.maxRecord = len > this.maxRecord ? len : this.maxRecord
    console.log('*** DEAD *** CURRENT SCORE:', len, 'MAX SCORE:', this.maxRecord)

    this.direction = -1
    this.generation = []

    //this.onStart()
    /*this.generations.push({generation: this.generation, fitness: len})
    clearTimeout(this.timeout)

    if (this.generations.length < this.iteration) {
      this.generation = []
      this.play()
    }
    else {
      console.log('*** ITERATIONS FINISHED ***')
      console.log(this.generations.reduce((max, generation) => {
        if (max === -1) max = generation.fitness
        else if (generation.fitness > max) max = generation.fitness

        return max
      }, -1))

      EB.unsubscribe('dead', this.onDead.bind(this))
    }*/
  }

  onApplePosition(position) {
    this.applePosition = position
  }

  onStart(position = {x: 2, y: 2}, direction = -1) {
    // first generation
    this.generation = ['R','N','N','D']
    this.onMove({position, direction})
  }

  seed(direction, lastSeed) {
    const horizontals = ['L','R'],
      verticals = ['D', 'U']

    let commands = []
    if (direction !== 'N') commands.push('N')
    if (horizontals.includes(direction)) commands = commands.concat(verticals)
    else commands = commands.concat(horizontals)

    const indexSameCommand = commands.indexOf(direction)
    if (indexSameCommand !== -1) commands.splice(indexSameCommand, 1)

    if (lastSeed) {
      const indexSameCommand = commands.indexOf(lastSeed)
      if (indexSameCommand !== -1) commands.splice(indexSameCommand, 1)
    }

    let index = Math.floor(Math.random() * commands.length)
    //let index = 10 - Math.ceil(Math.random()*10)
    //if (index >= commands.length) index -= (index - (commands.length - 1))

    return commands[index]
  }

  generate(direction) {
    const generation = []

    let nextDirection = this.DIRECTIONS_MAP_FROM_NUMBER[direction]
    // 5 steps generation
    for (let i = 0; i < 5; i++) {
      const lastSeed = generation[generation.length - 1],
        currentSeed = this.seed(nextDirection, lastSeed)
      generation.push(currentSeed)
      if (currentSeed !== 'N' && currentSeed !== nextDirection) nextDirection = currentSeed
    }

    return generation
  }

  populate(direction) {
    const dir = this.DIRECTIONS_MAP_FROM_NUMBER[direction !== -1 ? direction : 3]
    //console.log('POPULATE', dir, direction)
    const generations = []
    for (let i = 0; i < 3; i++) {
      generations.push(this.generate(direction))
    }
    //generations.forEach(g => console.log('POPULATE', dir, '---', g.join(',')))
    return generations
  }

  /*sailor({currentPosition, nextPosition, applePosition}) {
    const currentDistance = Math.abs(currentPosition.x - applePosition.x) + Math.abs(currentPosition.y - applePosition.y),
      nextDistance = Math.abs(nextPosition.x - applePosition.x) + Math.abs(nextPosition.y - applePosition.y)

    return nextDistance < currentDistance ? 5 : 0
  }

  tutor({nextPosition, grid}) {
    return grid[nextPosition.x][nextPosition.y] > 0 ? -1000 : 1
  }

  eater({nextPosition, applePosition}) {
    return nextPosition.x === applePosition.x && nextPosition.y === applePosition.y ? 100 : 0
  }*/

  fitness({generation, position, direction, grid, applePosition}) {
    //console.log('CALLING FITNESS')
    if (generation.length === 0) return 0

    let fitness = 0

    if (generation.length === 5) fitness += 200

    let command = generation.shift(),
      nextPosition = Object.assign({}, position),
      nextDirection = this.DIRECTIONS_MAP_FROM_STRING[command]

    // include 'N' commands inside the simulation
    if (command === 'N') {
      command = this.DIRECTIONS_MAP_FROM_NUMBER[direction]
      nextDirection = direction
    }

    switch (command) {
      case 'U':
        nextPosition.x = position.x - 1
        break
      case 'D':
        nextPosition.x = position.x + 1
        break
      case 'L':
        nextPosition.y = position.y - 1
        break
      case 'R':
        nextPosition.y = position.y + 1
        break
    }

    //fitness += this.tutor({nextPosition, grid})
    const gridPoint = grid[nextPosition.x][nextPosition.y]
    fitness += gridPoint === 1 ? -1000 :
               gridPoint === 0 ? 1 :
               gridPoint === -1 ? 100 : 0

    if (fitness < 0) return fitness

    //fitness += this.sailor({currentPosition: position, nextPosition, applePosition})
    const currentDistance = Math.abs(position.x - applePosition.x) + Math.abs(position.y - applePosition.y),
      nextDistance = Math.abs(nextPosition.x - applePosition.x) + Math.abs(nextPosition.y - applePosition.y)
    fitness += nextDistance < currentDistance ? 5 : -1
    //fitness += grid[nextPosition.x][nextPosition.y] === -1 ? 100 : 0
    //fitness += nextPosition.x === applePosition.x && nextPosition.y === applePosition.y ? 100 : 0
    //fitness += this.eater({nextPosition, applePosition})

    return fitness + this.fitness({generation, position: nextPosition, direction: nextDirection, grid, applePosition})
  }

  // single point crossover
  crossover(father, mother) {
    const generation = []

    for (let i = 0; i < 3; i++) generation.push(father[i])
    for (let i = 3; i < 5; i++) generation.push(mother[i])

    return generation
  }

  mutation(generation, direction) {
    let mutation = generation.slice()

    // randomly choose a command to mutate inside the generation
    const index = Math.floor(Math.random() * mutation.length),
      horizontals = ['L','R'],
      verticals = ['D', 'U']

    let mutationSet = ['N']

    // if direction is defined, add only the allowed commands (verticals or horizontals)
    let currentDirection = this.DIRECTIONS_MAP_FROM_NUMBER[direction]
    mutationSet = horizontals.includes(currentDirection) ? mutationSet.concat(verticals) : mutationSet.concat(horizontals)

    // remove the current command that will be replaced by the new one
    const cmdIndex = mutationSet.indexOf(mutation[index])
    if (cmdIndex !== -1) mutationSet.splice(cmdIndex, 1)

    // randomly choose a new command
    const commandIndex = Math.floor(Math.random() * mutationSet.length),
      command = mutationSet[commandIndex]

    //console.log('CHOSEN COMMAND ->', command, currentDirection)

    // separate the two halves of the mutation to change
    let firstHalf = mutation.slice(0, index),
      secondHalf = mutation.slice(index + 1, mutation.length)

    /*const _ADJUST_COMMAND_ = cmd => {
      let changed = cmd

      if (cmd !== 'N') {
        let changingSet = []
        // if the previous command is the same of the current one
        // or they belong to the same direction (verticals|horizontals)
        // use the opposite set of the current command
        if (cmd === currentDirection || this.OPPOSITE_COMMANDS_MAP[currentDirection] === cmd) {
          changingSet = horizontals.includes(cmd) ? verticals : horizontals
        }
        // otherwise use the opposite set of the previous command
        else {
          changingSet = horizontals.includes(currentDirection) ? verticals : horizontals
        }

        const index = Math.floor(Math.random() * changingSet.length)

        changed = changingSet[index]
      }

      if (changed !== 'N') currentDirection = changed

      return changed
    }*/

    //currentDirection = command
    let prevCmd = command,
      removedDirectionCollision = false
    for (let i = 0; i < firstHalf.length; i++) {
      const cmd = firstHalf[i]
      let changed = cmd

      if (cmd !== 'N') {
        let changingSet = ['N']
        // if the previous command is the same of the current one
        // or they belong to the same direction (verticals|horizontals)
        // use the opposite set of the current command
        if (cmd === prevCmd || this.OPPOSITE_COMMANDS_MAP[prevCmd] === cmd) {
          changingSet = horizontals.includes(cmd) ? changingSet.concat(verticals) : changingSet.concat(horizontals)
        }
        // otherwise use the opposite set of the previous command
        else {
          changingSet = horizontals.includes(prevCmd) ? changingSet.concat(verticals) : changingSet.concat(horizontals)
        }

        if (i === 0 || !removedDirectionCollision) {
          const directionCommands = this.DIRECTIONS_COMMANDS_FROM_COMMAND_MAP[currentDirection]
          for (let j = 0; j < directionCommands.length; j++) {
            const dcIndex = changingSet.indexOf(directionCommands[j])
            if (dcIndex !== -1) changingSet.splice(dcIndex, 1)
          }
          removedDirectionCollision = true
        }

        const index = Math.floor(Math.random() * changingSet.length)

        changed = changingSet[index]
      }

      if (changed !== 'N') prevCmd = changed

      firstHalf[i] = changed
    }
    //firstHalf = firstHalf.map(_ADJUST_COMMAND_)

    //currentDirection = command
    prevCmd = command
    removedDirectionCollision = false
    for (let i = 0; i < secondHalf.length; i++) {
      const cmd = secondHalf[i]
      let changed = cmd

      if (cmd !== 'N') {
        let changingSet = ['N']
        // if the previous command is the same of the current one
        // or they belong to the same direction (verticals|horizontals)
        // use the opposite set of the current command
        if (cmd === prevCmd || this.OPPOSITE_COMMANDS_MAP[prevCmd] === cmd) {
          changingSet = horizontals.includes(cmd) ? changingSet.concat(verticals) : changingSet.concat(horizontals)
        }
        // otherwise use the opposite set of the previous command
        else {
          changingSet = horizontals.includes(prevCmd) ? changingSet.concat(verticals) : changingSet.concat(horizontals)
        }

        if (i === 0 || !removedDirectionCollision) {
          const directionCommands = this.DIRECTIONS_COMMANDS_FROM_COMMAND_MAP[currentDirection]
          for (let j = 0; j < directionCommands.length; j++) {
            const dcIndex = changingSet.indexOf(directionCommands[j])
            if (dcIndex !== -1) changingSet.splice(dcIndex, 1)
          }
          removedDirectionCollision = true
        }

        const index = Math.floor(Math.random() * changingSet.length)

        changed = changingSet[index]
      }

      if (changed !== 'N') prevCmd = changed

      secondHalf[i] = changed
    }
    //secondHalf = secondHalf.map(_ADJUST_COMMAND_)

    //console.log('GENERATION ->', mutation, this.DIRECTIONS_MAP_FROM_NUMBER[direction])
    mutation = firstHalf.concat(command).concat(secondHalf)
    //console.log('MUTATION ->', mutation, this.DIRECTIONS_MAP_FROM_NUMBER[direction])
    return mutation
  }

  evolve({position, direction, generations, grid, applePosition}) {
    let generation = null,
      fitnesses = generations.map((g, index) => {
        const fitness = this.fitness({generation: g.slice(), position, direction, grid, applePosition})
        console.log(fitness)
        return {
          fitness,
          index
        }
      })

    for (let i = 0; i < fitnesses.length; i++) {
      if (fitnesses[i].fitness >= 210) {
        generation = generations[fitnesses[i].index]
        break
      }
    }

    if (generation !== null) return generation

    //console.log('MUTATION')

    fitnesses.sort((a, b) => a.fitness > b.fitness)
    // discard the worst one
    fitnesses.shift()

    const father = generations[fitnesses[1].index],
      mother = generations[fitnesses[0].index],
      child = this.crossover(father, mother)
    generations = [child]
    generations = generations.map(g => this.mutation(g.slice(), direction))
    generations.push(father, mother)

    return this.evolve({position, direction, generations, grid, applePosition})
  }

  onMove({position, direction}) {
    //console.log('LAST POSITION', position.x, position.y, this.grid[position.x][position.y], this.DIRECTIONS_MAP_FROM_NUMBER[direction])
    if (this.generation.length === 0) {
      //EB.publish('keydown', {keyCode: this.PAUSE_COMMAND})

      //console.log('CURRENT DIRECTION:', this.DIRECTIONS_MAP_FROM_NUMBER[this.direction])
      const generations = this.populate(this.direction)
      this.generation = this.evolve({position, direction: this.direction, generations, grid: this.grid, applePosition: this.applePosition})

      //console.log('DIFF NEW GEN AND LAST GEN ->', this.lastGeneration[this.lastGeneration.length - 1], this.generation[0])
      this.lastGeneration = this.generation.slice()

      //EB.publish('keydown', {keyCode: this.PAUSE_COMMAND})

      //console.log('CHOOSEN GENERATION:', this.generation.join(','))
    }

    const cmd = this.generation.shift()
    //console.log('LAST COMMAND:', cmd, 'CURRENT DIRECTION:', this.DIRECTIONS_MAP_FROM_NUMBER[direction])
    if (cmd !== 'N') {
      EB.publish('keydown', {keyCode: this.COMMANDS_MAP[cmd]})
      this.direction = this.DIRECTIONS_MAP_FROM_STRING[cmd]
    }
  }

  onSetGrid(grid) {
    this.grid = grid
  }
}

const gamer = new Gamer()