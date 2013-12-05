// actionHero Config File
// I will be loded into api.config

var fs = require('fs');
var cluster = require('cluster');

var config = {};

/////////////////////////
// General Information //
/////////////////////////

config.general = {
  apiVersion: "0.0.1",
  serverName: "actionHero API",
  // id: "myActionHeroServer",                                    // id can be set here, or it will be generated dynamically.  Be sure that every server you run has a unique ID (which will happen when genrated dynamically)
  serverToken: "change-me",                                       // A unique token to your application that servers will use to authenticate to each other
  welcomeMessage : "Hello! Welcome to the actionHero api",        // The welcome message seen by TCP and webSocket clients upon connection
  flatFileNotFoundMessage: "Sorry, that file is not found :(",    // The body message to accompany 404 (file not found) errors regading flat files
  serverErrorMessage: "The server experienced an internal error", // The message to accompany 500 errors (internal server errors)
  defaultLimit: 100,                                              // defaultLimit & defaultOffset are useful for limiting the length of response lists. 
  defaultOffset: 0,
  developmentMode: true,                                          // Watch for changes in actions and tasks, and reload/restart them on the fly
  simultaneousActions: 5,                                         // How many pending actions can a single connection be working on 
  paths: {                                                        // configuration for your actionHero project structure
    "action":      __dirname + "/../actions",
    "task":        __dirname + "/../tasks",
    "public":      __dirname + "/../public",
    "pid":         __dirname + "/../pids",
    "log":         __dirname + "/../log",
    "server":      __dirname + "/../servers",
    "initializer": __dirname + "/../initializers",
  },
  startingChatRooms: {                                            // hash containaing chat rooms you wish to be created at server boot 
    'defaultRoom': {},                                            // format is {roomName: {authKey, authValue}}
    // 'secureRoom': {authorized: true},
  }
};

/////////////
// logging //
/////////////

config.logger = {
  transports: []
};

// console logger
if(cluster.isMaster){
  config.logger.transports.push(function(api, winston){
    return new (winston.transports.Console)({
      colorize: true,
      level: "debug",
      timestamp: api.utils.sqlDateTime
    });
  });
}

// file logger
try{
  fs.mkdirSync("./log");
} catch(e) {
  if(e.code != "EEXIST"){ console.log(e); process.exit(); }
}
config.logger.transports.push(function(api, winston) {
  return new (winston.transports.File)({
    filename: config.general.paths.log + "/" + api.pids.title + '.log',
    level: "info",
    timestamp: true
  });
});

///////////
// Stats //
///////////

config.stats = {
  writeFrequency: 1000, // how often should the server write its stats to redis?
  keys: [              // what redis key(s) [hash] should be used to store stats? provide no key if you do not want to store stats
    'actionHero:stats',
  ], 
}

///////////
// Redis //
///////////

config.redis = {
  fake: true,
  host: "127.0.0.1",
  port: 6379,
  password: null,
  options: null,
  database: 0,
};

//////////
// FAYE //
//////////

config.faye = {
  mount: "/faye",          // faye's URL mountpoint.  Be sure to not overlap with an action or route
  timeout: 45,             // idle timeout for clients
  ping: null,              // should clients ping the server?
  redis: config.redis, // What redis server should we connet to for faye?
  namespace: "faye:"       // redis prefix for faye keys
};

///////////
// TASKS //
///////////

config.tasks = {
  // see https://github.com/taskrabbit/node-resque for more information / options
  scheduler: false,       // Should this node run a scheduler to promote delayed tasks?
  queues: [],             // what queues should the workers work and how many to spawn? "['*']" is one worker working the * queue; "['high,low']" is one worker woring 2 queues
  timeout: 5000,          // how long to sleep between jobs / scheduler checks
  redis: config.redis // What redis server should we connet to for tasks / delayed jobs?
}

/////////////
// SERVERS //
/////////////

// uncomment the section to enable the server

config.servers = {
  "web" : {
    secure: false,                       // HTTP or HTTPS?
    serverOptions: {},                   // Passed to https.createServer if secure=ture. Should contain SSL certificates
    port: 8080,                          // Port or Socket
    bindIP: "0.0.0.0",                   // Which IP to listen on (use 0.0.0.0 for all)
    httpHeaders : {                      // Any additional headers you want actionHero to respond with
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': 'HEAD, GET, POST, PUT, DELETE, OPTIONS, TRACE',
      'Access-Control-Allow-Headers': 'Content-Type'
    },    
    urlPathForActions : "api",           // Route that actions will be served from; secondary route against this route will be treated as actions, IE: /api/?action=test == /api/test/
    urlPathForFiles : "public",          // Route that static files will be served from; path (relitive to your project root) to server static content from
    rootEndpointType : "file",           // When visiting the root URL, should visitors see "api" or "file"? Visitors can always visit /api and /public as normal
    directoryFileType : "index.html",    // The default filetype to server when a user requests a directory
    flatFileCacheDuration : 60,          // The header which will be returned for all flat file served from /public; defined in seconds
    fingerprintOptions : {               // Settings for determining the id of an http(s) requset (browser-fingerprint)
      cookieKey: "sessionID",
      toSetCookie: true,
      onlyStaticElements: false
    },
    formOptions: {                       // Options to be applied to incomming file uplaods. More options and details at https://github.com/felixge/node-formidable
      uploadDir: "/tmp",
      keepExtensions: false,
      maxFieldsSize: 1024 * 1024 * 100
    },
    metadataOptions: {                   // Options to configure metadata in responses
      serverInformation: true,
      requestorInformation: true
    },
    returnErrorCodes: false              // When true, returnErrorCodes will modify the response header for http(s) clients if connection.error is not null. You can also set connection.rawConnection.responseHttpCode to specify a code per request.
  },
  "websocket" : {
  },
  // "socket" : {
  //   secure: false,                        // TCP or TLS?
  //   serverOptions: {},                    // passed to tls.createServer if secure=ture. Should contain SSL certificates
  //   port: 5000,                           // Port or Socket
  //   bindIP: "0.0.0.0",                    // which IP to listen on (use 0.0.0.0 for all)
  // },
};

//////////////////////////////////

exports.config = config;