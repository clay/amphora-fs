'use strict';

const fs = require('fs'),
  os = require('os'),
  path = require('path');

/**
 * Make an empty temporary directory, and get a function that removes it
 *
 * @returns {{dir: string, remove: Function}}
 */
function makeTmpDir() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'amphora-fs-')));

  return { dir, remove: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Write files (relative path -> contents) under a directory
 *
 * @param {string} root
 * @param {object} files
 */
function writeFiles(root, files) {
  Object.keys(files).forEach((rel) => {
    const file = path.join(root, rel);

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, files[rel]);
  });
}

module.exports.makeTmpDir = makeTmpDir;
module.exports.writeFiles = writeFiles;
