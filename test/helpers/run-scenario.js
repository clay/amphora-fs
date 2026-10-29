'use strict';

// node run-scenario.js <path to amphora-fs>, in the directory of a project from project.js
const path = require('path'),
  runScenario = require('./scenario');

runScenario(require(path.resolve(process.argv[2]))).then((out) => {
  process.stdout.write(JSON.stringify(out));
}, (e) => {
  console.error(e);
  process.exit(1);
});
