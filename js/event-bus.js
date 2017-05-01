class EventBus {
  constructor() {
    this.subscribers = {}
  }

  subscribe(eventName, handler) {
    if (typeof this.subscribers[eventName] === 'undefined' || this.subscribers[eventName] === null) this.subscribers[eventName] = []

    this.subscribers[eventName].push(handler)
  }

  unsubscribe(eventName, handler) {
    const subs = this.subscribers[eventName]

    if (typeof subs === 'undefined' || subs === null || subs.length === 0) return

    const index = subs.findIndex(fn => ''+fn === ''+handler)

    if (index !== -1) subs.splice(index, 1)
  }

  publish(eventName, args) {
    console.log('PUBLISH', eventName, args)
    const subs = this.subscribers[eventName]
    if (typeof subs === 'undefined' || subs === null) return
    subs.forEach(fn => fn.call(fn, args))
  }
}

const EB = new EventBus()