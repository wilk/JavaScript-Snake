class EventBus {
  constructor() {
    this.subscribers = {}
  }

  subscribe(eventName, handler) {
    console.log('SUBSCRIBE STARTED', eventName)
    if (typeof this.subscribers[eventName] === 'undefined' || this.subscribers[eventName] === null) this.subscribers[eventName] = []

    this.subscribers[eventName].push(handler)
    console.log('SUBSCRIBE FINISHED', eventName)
  }

  unsubscribe(eventName, handler) {
    console.log('UNSUBSCRIBE STARTED', eventName)
    const subs = this.subscribers[eventName]

    if (typeof subs === 'undefined' || subs === null || subs.length === 0) return

    const index = subs.findIndex(fn => ''+fn === ''+handler)

    if (index !== -1) {
      subs.splice(index, 1)
      console.log('UNSUBSCRIBE FINISHED', eventName)
    }
  }

  publish(eventName, args) {
    console.log('PUBLISH STARTED', eventName, args)
    const subs = this.subscribers[eventName]
    if (typeof subs === 'undefined' || subs === null) return
    subs.forEach(fn => fn.call(fn, args))
    console.log('PUBLISH FINISHED', subs)
  }
}

const EB = new EventBus()