'use strict';

const { execFileSync } = require('child_process'),
  path = require('path'),
  { buildProject } = require('./project'),
  { makeTmpDir } = require('./tmp');

/**
 * Build the project in a temporary directory, and run the scenario on an amphora-fs in it
 * (in a process of its own, as it works on the current directory and remembers what it reads)
 *
 * @param {string} afsPath
 * @returns {array}
 */
function runProject(afsPath) {
  const tmp = makeTmpDir();

  try {
    buildProject(tmp.dir);

    return JSON.parse(execFileSync(process.execPath, [path.join(__dirname, 'run-scenario.js'), path.resolve(afsPath)], {
      cwd: tmp.dir,
      env: Object.assign({}, process.env, { FIXTURE_HOST: 'example.test', FIXTURE_PORT: '3001', FIXTURE_DB: 'postgres://u@h:5432', FIXTURE_EMPTY: '' }),
      maxBuffer: 1 << 28
    }, 'utf8').toString());
  } finally {
    tmp.remove();
  }
}

module.exports.runProject = runProject;
