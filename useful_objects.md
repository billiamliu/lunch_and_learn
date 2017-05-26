
# Useful Objects
Based on the work of Scott Bellware, see [The Doctrine of Useful Objects](https://github.com/sbellware/useful-objects)


## Why the interest?
Logging & Testing as first class citizens, not an after thought (I'm still guilty of not logging enough)
- Single responsibility
- Open for Extension, closed for Modification
- Liskov Substitution Principle (more to do with inheritance)
- Interface Segregation (many specific interfaces are better than one general)
- Dependend on Abstractions, not Concretions

## Motivation
I've been using Scott's _Useful Objects_ pattern in its native Ruby OOP environment with good success.
Since we are using JavaScript `ES2016 Class` syntax, and running into similar problems this pattern solves...
The goal is to learn by teaching.
Another goal is to solicit comments, see alternate approaches to the problems. This pattern is not be all end all.
Another goal is to do a code review for my PR, of the SDK built using this pattern.
Finally, free lunch, amirite??

## Disclaimer
I'm shoving OOP ideas into JS, JS is not meant to be used this way.
I do _not_ have answers to writing idiomatic JS... yet. Although Closures can create private members for example, rather than "classes".

## Let's Begin
[JSFiddle](https://jsfiddle.net/billiam/L5tzL715/)
Each section below references the respective jsfiddle segment.
Please open dev console while running jsFiddle.

Our fictitious example is a http getter that makes a `GET` request.
As told from a junior developer's dicovery process in building a SDK, including some monologue.

### How do we test `Getter1`?
Can't really rest it, because `Getter1` has an opaque, primary dependency on `#httpGet` existing in the execution context.


### How do we test `Getter2`?
Let's see about using Dependency Injection to make the dependency transparent.

In testing, we'd likely see mocks being used to assert commands.
By passing in a mock(test fixture with expectations), we can assert that `Getter` calls its dependency with the correct arguments.
```JavaScript
const stubUrl = '0.0.0.0'
const mock = sinon.mock().once().withExactArgs(stubUrl).returns(Promise.resolve('cat'))
const getter = new Getter(mock)

getter.get(stubUrl)
  .then(res => {
    assert(res === 'cat')
    assert(mock.verify())
  })
  .then(() => done())
```

### How do we log `Getter3`?
By putting in `console.log` everywhere, of course!
```
class Getter {
  constructor(getRequest) {
    console.log('initialising getter')
    this.getRequest = getRequest
  }

  get(url) {
    console.log(`getting ${url}`)
    return this.getRequest(url)
  }
}
```

> Let that sink in for a second. What are the side effects of `printf()` debugging?

- How will we hook in a custom logger in production? `console.log = winston.logger.debug`?
- How do we disable logging for individual objects in the system?
- How do we isolate signal from noise?
`¯\_(ツ)_/¯` (to be continued)


In order to get better logging than `console.log`, we'd have to open up `Getter` and implement a logger.

How do we go about testing `Getter` now?
```JavaScript
const stubUrl = '0.0.0.0'
// add a stub (test fixture without expectations)
const stubLogger = msg => console.log(msg)
const mock = sinon.mock().once().withExactArgs(stubUrl).returns(Promise.resolve('cat'))
const getter = new Getter(mock, stubLogger)

getter.get(stubUrl)
  .then(res => {
    assert(res === 'cat')
    assert(mock.verify())
  })
  .then(() => done())
```

### How do we build `Getter4`?
Business has switched to a different partner, and all incoming transmissions has been encrypted.
`Getter` seems like a fitting place to handle the decryption, since the rest of the application doesn't care.

Let's do a bit of TDD before "coding" `Getter4`
```JavaScript
const stubUrl = '0.0.0.0'
const stubLogger = msg => console.log(msg)
// add another stub
const stubDecrypt = encrypted => 'decrypted'

const mock = sinon.mock().once().withExactArgs(stubUrl).returns(Promise.resolve('cat'))
const getter = new Getter(mock, stubLogger, stubDecrypt)

getter.get(stubUrl)
  .then(res => {
    assert(res === 'decrypted')
    assert(mock.verify())
  })
  .then(() => done())
```
By now your spidey senses may be tingling, `Getter` is starting to have many dependencies.
But it's not a nuisance yet, `get`, `log`, `decrypt`, only three things to hold in memory while working on this code.


## Surprise! Requirement change!
Business has switched to yet another partner, as such all incoming transmissions have been encoded by avro, proto buffer, or what have you.
Thanks to DI, we can simply swap `decrypt` for a `decode` middleware.
`new Getter(httpGet, makeLogger(), decode)`


Two days later, we realise that some of data come from the _encrypted_ partner, some from the _encoded_ partner, and some had to fall back to the initial partner who just sent _plain JSON_.

![Jacky Chan WTF meme](http://cdn.memegenerator.es/imagenes/memes/full/1/39/1396838.jpg)


Our code has been ok so far, how will we go about building this next requirement?
IMO this is a natural progression of a piece of code.

_(take 5 minutes, group brainstorm)_


## Enter Useful Objects
What the pattern can help improve on:
- **SOLID::Single Responsibility**: `Getter` should only do a http get, and we only test for that one purpose
- **SOLID::Open/Closed**: logging and transformating data isn't `Getter`s responsibility, but `Getter` is also a good place to do it. We can extend its capabilities without having to pry open a black box
- **Testing::Substitution**: if it looks like a duck, quacks like a duck, but uses batteries.... you may have the wrong abstraction, but for my context it's still a duck
- **Tell, Don't Ask**

### Rebuild `Getter5`

Holy Sugar Batman! That's a lot of boilerplate!!

_running out of prep time_

But let's play with the manual testing, and see how convenient the boilerplate is.

Yes, there's a lot of boilerplate, but wihtout it, we may end up with way too much procedural code, ill-abstracted classes, weird interdependencies, etc
