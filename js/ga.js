const genetic = Genetic.create()
genetic.optimize = Genetic.Optimize.Maximize
genetic.select1 = Genetic.Select1.Random
//genetic.select2 = Genetic.Select2.Tournament2

const PAUSE_COMMAND = 32,
  COMMANDS_MAP = {
    D: 40,
    U: 38,
    L: 37,
    R: 39
  }

genetic.seed = function () {
  const generation = [],
    GENERATION_LENGTH = 3,
    COMMANDS_LIST = ['U','D','L','R','N']
  for (let i = 0; i < GENERATION_LENGTH; i++) {
    const index = Math.floor(Math.random() * COMMANDS_LIST.length)
    generation.push(COMMANDS_LIST[index])
  }

  return generation
}

genetic.mutate = function (generation) {
  const COMMANDS_LIST = ['U','D','L','R','N'],
    commands = COMMANDS_LIST.slice(),
    commandTargetIndex = Math.floor(Math.random() * generation.length),
    commandTargetRemoveIndex = COMMANDS_LIST.indexOf(commandTargetIndex)

  commands.splice(commandTargetRemoveIndex, 1)

  const newCommandIndex = Math.floor(Math.random() * commands.length)
  generation[commandTargetIndex] = commands[newCommandIndex]

  return generation
}

/*genetic.crossover = function (mother, father) {

}*/

genetic.fitness = function (generation) {
  let fitness = 200

  // if generation's valid +1, otherwise -1000
  let currentDirection = this.userData.ga.direction,
    currentPosition = Object.assign({}, this.userData.ga.position)
  for (let i = 0; i < generation.length; i++) {
    let currentStep = generation[i],
      currentDistance = Math.abs(currentPosition.x - this.userData.ga.applePosition.x) + Math.abs(currentPosition.y - this.userData.ga.applePosition.y)

    // include 'N' commands inside the simulation
    if (currentStep === 'N') currentStep = currentDirection
    else currentDirection = currentStep

    switch (currentStep) {
      case 'U':
        currentPosition.x--
        break
      case 'D':
        currentPosition.x++
        break
      case 'L':
        currentPosition.y--
        break
      case 'R':
        currentPosition.y++
        break
    }

    if (currentPosition.x < 0 ||
        currentPosition.x >= this.userData.ga.grid.length ||
        currentPosition.y < 0 ||
        currentPosition.y >= this.userData.ga.grid[0].length) {
      fitness -= 1000
    }
    else {
      const gridPoint = this.userData.ga.grid[currentPosition.x][currentPosition.y]
      fitness += gridPoint === 1 ? -1000 :
                 gridPoint === 0 ? 1 :
                 gridPoint === -1 ? 100 : 0

      // calculate tbe distance from the apple
      const nextDistance = Math.abs(currentPosition.x - this.userData.ga.applePosition.x) + Math.abs(currentPosition.y - this.userData.ga.applePosition.y)

      fitness += nextDistance < currentDistance ? 5 : 0
    }
  }

  const DIRECTIONS_VERTICAL = ['U','D'],
    DIRECTIONS_HORIZONTAL = ['L','R'],
    DIRECTIONS_MAP_FROM_STRING = {
      U: DIRECTIONS_VERTICAL,
      D: DIRECTIONS_VERTICAL,
      L: DIRECTIONS_HORIZONTAL,
      R: DIRECTIONS_HORIZONTAL
    }

  // if generation's correct, +1, otherwise -1
  currentDirection = this.userData.ga.direction
  let previousStep = generation[0]
  // the current value cannot be in the same direction of the snake
  if (previousStep !== 'N' && DIRECTIONS_MAP_FROM_STRING[currentDirection].includes(previousStep)) fitness--
  for (let i = 1; i < generation.length; i++) {
    const currentStep = generation[i]

    if (currentStep !== 'N') {
      // the current value cannot be in the same direction of the snake
      if (DIRECTIONS_MAP_FROM_STRING[currentDirection].includes(currentStep)) fitness--
      // nor the same previous command
      if (currentStep === previousStep) fitness--

      currentDirection = currentStep
    }

    previousStep = currentStep
  }

  return fitness
}

genetic.notification = function (pop, generation, stats, isFinished) {
  console.log(`#${generation}`, stats)

  if (isFinished) this.userData.ga.setGeneration(pop[0].entity)
}

class GA {
  constructor() {
    EB.subscribe('start', this.onStart.bind(this))
    EB.subscribe('dead', this.onDead.bind(this))
    EB.subscribe('set apple position', this.onApplePosition.bind(this))
    EB.subscribe('move', this.onMove.bind(this))
    EB.subscribe('set grid', this.onSetGrid.bind(this))

    this.generation = []
    this.grid = null
    this.applePosition = null
    this.direction = 'R'
    this.position = null
    this.config = {
      iterations: 100,
      size: 10,
      crossover: 0.3,
      mutation: 0.3,
      skip: 20
    }
  }

  setGeneration(generation) {
    this.generation = generation
    this.onMove({position: this.position})
    //EB.publish('keydown', {keyCode: PAUSE_COMMAND})
  }

  onStart() {
    this.onMove({position: {x: 2, y: 2}})
  }

  onDead(len) {
    console.log('*** DEAD ***', len, this.generation)
  }

  onApplePosition(position) {
    this.applePosition = position
  }

  onMove({position}) {
    this.position = position

    // @todo: evolve is async, so don't move the snake until the generation is created
    if (this.generation.length === 0) {
      //EB.publish('keydown', {keyCode: PAUSE_COMMAND})
      genetic.evolve(this.config, {ga: this})
    }
    else {
      const cmd = this.generation.shift()
      if (cmd !== 'N') {
        EB.publish('keydown', {keyCode: COMMANDS_MAP[cmd]})
        this.direction = cmd
      }
    }
  }

  onSetGrid(grid) {
    this.grid = grid
  }
}

const ga = new GA()