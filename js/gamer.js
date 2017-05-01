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
    this.paused = true
    this.PAUSE_COMMAND = 32
    this.COMMANDS_MAP = {
      D: 40,
      U: 38,
      L: 37,
      R: 39
    }
    this.DIRECTIONS_MAP_FROM_NUMBER = {
      1: 'R',
      2: 'D',
      3: 'L',
      4: 'U'
    }
    this.DIRECTIONS_MAP_FROM_STRING = {
      'R': 1,
      'D': 2,
      'L': 3,
      'U': 4
    }
  }

  play() {
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
  }

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
    console.log('*** DEAD ***', len, this.generation, this.generations.length, this.iteration)
    this.generations.push({generation: this.generation, fitness: len})
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
    }
  }

  onApplePosition(position) {
    this.applePosition = position
  }

  onStart(position = {x: 2, y: 2}, direction = -1) {
    this.onMove({position, direction})
  }

  seed(generation) {
    const lastSeed = generation && generation.length > 0 ? generation[generation.length - 1] : null,
      horizontals = ['L','R'],
      verticals = ['D', 'U']

    let commands = ['N']
    if (lastSeed === null) commands = commands.concat(verticals, horizontals)
    else if (horizontals.includes(lastSeed)) commands = commands.concat(verticals)
    else commands = commands.concat(horizontals)

    const indexSameCommand = commands.indexOf(lastSeed)
    if (indexSameCommand !== -1) commands.splice(indexSameCommand, 1)

    let index = 10 - Math.ceil(Math.random()*10)
    if (index >= commands.length) index -= (index - (commands.length - 1))

    return commands[index]
  }

  generate() {
    const generation = []

    // 5 steps generation
    for (let i = 0; i < 5; i++) {
      generation.push(this.seed(generation))
    }

    return generation
  }

  populate() {
    const generations = []
    for (let i = 0; i < 3; i++) {
      generations.push(this.generate())
    }
    return generations
  }

  sailor({currentPosition, nextPosition, applePosition}) {
    const currentDistance = Math.abs(currentPosition.x - applePosition.x) + Math.abs(currentPosition.y - applePosition.y),
      nextDistance = Math.abs(nextPosition.x - applePosition.x) + Math.abs(nextPosition.y - applePosition.y)

    return nextDistance < currentDistance ? 1 : 0
  }

  tutor({nextPosition, grid}) {
    return grid[nextPosition.x][nextPosition.y] > 0 ? -1000 : 1
  }

  eater({nextPosition, applePosition}) {
    return nextPosition.x === applePosition.x && nextPosition.y === applePosition.y ? 100 : 0
  }

  fitness({generation, position, direction, grid, applePosition}) {
    if (generation.length === 0) return 0

    let fitness = 0

    if (generation.length === 5) fitness += 200

    const command = generation.shift()
    let nextPosition = Object.assign({}, position),
      nextDirection = this.DIRECTIONS_MAP_FROM_STRING[command]
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
      case 'N':
        nextDirection = direction
        break
    }

    fitness += this.sailor({currentPosition: position, nextPosition, applePosition})
    fitness += this.tutor({nextPosition, grid})
    fitness += this.eater({nextPosition, applePosition})

    return fitness + this.fitness({generation, position: nextPosition, direction: nextDirection, grid, applePosition})
  }

  crossover(father, mother) {
    const generation = []

    for (let i = 0; i < 3; i++) generation.push(father[i])
    for (let i = 3; i < 5; i++) generation.push(mother[i])

    return generation
  }

  mutation(generation) {
    const mutation = generation.splice(0, 3)

    mutation.push(this.seed(mutation))
    mutation.push(this.seed(mutation))

    return mutation
  }

  cloneGeneration(generation) {
    const clone = []

    for (let i = 0; i < generation.length; i++) clone.push(generation[i])

    return clone
  }

  evolve({position, direction, generations, grid, applePosition}) {
    let generation = null,
      fitnesses = generations.map(g => this.fitness({generation: this.cloneGeneration(g), position, direction, grid, applePosition}))

    for (let i = 0; i < fitnesses.length; i++) {
      if (fitnesses[i] >= 8) {
        generation = generations[i]
        break
      }
    }

    if (generation !== null) return generation

    fitnesses.sort()
    // discard the worst one
    fitnesses.shift()

    generations = this.crossover(generations[fitnesses[1]], generations[fitnesses[0]])
      .map(g => this.mutation(this.cloneGeneration(g)))

    return this.evolve({position, direction, generations, grid, applePosition})
  }

  onMove({position, direction}) {
    if (this.generation.length === 0) {
      if (direction !== -1) EB.publish('keydown', {keyCode: this.PAUSE_COMMAND})
      const generations = this.populate()
      this.generation = this.evolve({position, direction, generations, grid: this.grid, applePosition: this.applePosition})
      if (direction !== -1) EB.publish('keydown', {keyCode: this.PAUSE_COMMAND})
    }

    const cmd = this.generation.shift()
    if (cmd !== 'N') EB.publish('keydown', {keyCode: this.COMMANDS_MAP[cmd]})
  }

  onSetGrid(grid) {
    this.grid = grid
  }
}

const gamer = new Gamer()