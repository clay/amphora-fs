'use strict';

// Writes test/fixtures/golden.json: what an amphora-fs gives for the project from project.js.
// The golden file in the repository was made with amphora-fs 2.0.0 from npm:
//   mkdir /tmp/old && cd /tmp/old && npm init -y && npm i amphora-fs@2.0.0 --ignore-scripts
//   node test/helpers/make-golden.js /tmp/old/node_modules/amphora-fs
const fs = require('fs'),
  path = require('path'),
  { runProject } = require('./golden');

// one result per line, so a change shows up as a few changed lines
fs.writeFileSync(path.join(__dirname, '..', 'fixtures', 'golden.json'), '[\n' + runProject(process.argv[2]).map((entry) => JSON.stringify(entry)).join(',\n') + '\n]\n');
