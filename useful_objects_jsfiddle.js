class Getter1 {
  get(url) {
    return httpGet(url)
  }
}

// new Getter1().get('/echo/json').then(console.log)



class Getter2 {
  constructor(getRequest) {
    this.getRequest = getRequest
  }
  
  get(url) {
    return this.getRequest(url)
  }
}

// new Getter2(httpGet).get('/echo/json').then(console.log)



class Getter3 {
  constructor(getRequest, logger) {
    this.getRequest = getRequest
    this.logger = logger
  }
  
  get(url) {
    this.logger.info(`getting ${url}`)
    return this.getRequest(url)
  }
}

// new Getter3(httpGet, makeLogger()).get('/echo/json').then(console.log)



class Getter4 {
  constructor(getRequest, logger, decrypt) {
    this.getRequest = getRequest
    this.logger = logger
    this.decrypt = decrypt
  }
  
  get(url) {
    this.logger.info(`getting ${url}`)
    return this.getRequest(url).then(res => this.decrypt(res))
  }
}

// new Getter4(httpGet, makeLogger(), decrypt).get('/echo/json').then(console.log)






//////////// DO NOT LOOK AHEAD /////////////////






class Getter5 {
  static build() {
    const instance = new this();
    instance.getRequest = httpGet // for brevity, normally it's GetRequest.configure(instance)
    Logger.configure(instance)
    return instance
  }
  
  static call(url) {
    return this.build().call(url)
  }
  
  constructor(/* no args */) {
    // null(safe) substitutes by default, same interface as hot substitute
    this.getRequest = () => Promise.resolve(null) // primary dependency
    this.logger = null // optional dependency
    this.transformer = null // optional dependency
  }
  
  call(url) {
    return this.get(url)
  }
  
  get(url) {
    this.log(`getting ${url}`)
    return this.getRequest(url)
      .then(res => this.transform(res))
  }
  
  log(msg) {
    if (this.logger) {
      this.logger.call(msg)
    }
  }
  
  transform(data) {
    return this.transformer ? this.transformer.call(data) : data
  }
}

class Logger {
  static build() {
    const instance = new this()
    instance._log = console.warn
    return instance
  }
  
  static configure(receiver) {
    receiver.logger = this.build()
  }
  
  static call(msg) { // this demonstrates SRP, in OOP lang #call may just be #()
    this.build().call(msg)
  }
  
  constructor() {
    this._log = () => {}
  }
  
  call(msg) {
    this._log(msg)
  }
}

// Duck Type: Transformer
class Decrypter {
  static build() {
    const instance = new this()
    instance._decrypt = () => 'Decrypted: winter is over!'
    return instance
  }
  
  static configure(receiver) {
    receiver.transformer = this.build()
  }
  
  static call(data) {
    return this.build().call(data)
  }
  
  constructor() {
    this._decrypt = x => x
  }
  
  call(data) {
    return this._decrypt(data)
  }
}

class Decoder {
  static build() {
    const instance = new this()
    instance._decode = () => 'Decoded: This lunch & learn is le Awesome! Especially the lunch'
    return instance
  }
  
  static configure(receiver) {
    receiver.transformer = this.build()
  }
  
  static call(data) {
    return this.build().call(data)
  }
  
  constructor() {
    this._decode = x => x
  }
  
  call(data) {
    return this._decode(data)
  }
}


// manual testing (because i'm running out of prep time :P)

// const decrypter = new Decrypter()
// console.log(decrypter.call(333))
// console.log(Decrypter.call(333))

// const decoder = new Decoder()
// console.log(decoder.call(555))
// console.log(Decoder.call(555))

// const logger = new Logger()
// logger.call('hej')
// Logger.call('hej')

// new Getter5().get('/echo/json').then(console.log)
// Getter5.call('/echo/json').then(console.log)

// const decodeGetter = new Getter5()
// Decoder.configure(decodeGetter)
// decodeGetter.call('/echo/json').then(console.log)

// const decryptGetter = new Getter5()
// Decrypter.configure(decryptGetter)
// decryptGetter.call('/echo/json').then(console.log)

/////////////// FIXTURES /////////////////////





function decrypt(msg) {
  return {
    message: msg,
    decrypted: 'summer is a-coming!'
  }
}

function makeLogger() {
  return {
    info: console.info,
    debug: console.log,
    warn: console.warn,
    error: console.error
  }
}


/**
 * @author https://stackoverflow.com/questions/247483/http-get-request-in-javascript
 */
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    httpGetAsync(url, resolve)
  })
}





