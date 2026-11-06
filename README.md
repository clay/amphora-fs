# Amphora FS

[![CI](https://github.com/clay/amphora-fs/actions/workflows/ci.yml/badge.svg)](https://github.com/clay/amphora-fs/actions/workflows/ci.yml)


Utility functions for working with the file system in Clay. This module will assume that the process which is running will be triggered from a directory that contains a `package.json` file and `/components` directory.

# Installation

Node 26.12.1 or later.

```
npm install --save amphora-fs
```

---

# Methods

* **fileExists** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/fileExists) - test if a file exists
* **getComponentModule** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getComponentModule) - get a component's `model.js`
* **getComponentName** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getComponentName) - get a component's name, validating that it exists in your Clay instance
* **getComponentPackage** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getComponentPackage) - get a npm component's `package.json`
* **getComponentPath** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getComponentPath) - get a component's filepath
* **getComponents** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getComponents) - get a list of all components in your Clay instance
* **getFiles** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getFiles) - get files (that aren't test or documentation) in a directory
* **getFolders** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getFolders) - get folders in a directory
* **getIndices** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getIndices) - get all component references in an object
* **getLayoutModule** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getLayoutModule) - get a layout's `model.js`
* **getLayoutName** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getLayoutName) - get a layout's name, validating that it exists in your Clay instance
* **getLayoutPath** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getLayoutPath) - get a layout's filepath
* **getLayouts** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getLayouts) - get a list of all layouts in your Clay instance
* **getSchemaPath** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getSchemaPath) - get the path for a layout's / component's schema
* **getYaml** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/getYaml) - get and parse yaml files, including env variables (for `config.yml` and `local.yml`)
* **isDirectory** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/isDirectory) - determine if a path is a directory
* **readFilePromise** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/readFilePromise) - `fs.readFile` that returns a promise
* **tryRequire** [(code|tests|docs)](https://github.com/clay/amphora-fs/tree/master/lib/tryRequire) - attempt to `require()` a file, with graceful fallback

# Good to know

* The lists and files are read once. `getComponents`, `getLayouts`, `getFiles`, `getFolders`, `isDirectory`, `getYaml`, `tryRequire`, `getComponentModule` and `getComponentPackage` remember what they found for each argument, including that something was not found, so a file added later is not seen. Each one has a `cache` (a `Map`) that can be cleared.
* `getYaml(path)` reads `path.yaml`, or `path.yml` if there is no `.yaml` or it is empty. It is `null` if there is no file (`undefined` for a missing `config` or `local`), and throws, naming the file, if the yaml is not valid.
* In `config` and `local` files, `${NAME}` is replaced by the environment variable `NAME`, which must be set and not empty.
* Yaml is read with js-yaml 3 (`safeLoad`): numbers by YAML 1.1 rules (`0777` is 511, `12:30` is 750, `yes` is a string), merge keys, timestamps, no js types.

# Development

```
npm test
```

runs ESLint and the tests (`node --test`), and checks that every function still gives what amphora-fs 2.0.0 gave on a project that looks like a Clay site (`test/golden.test.js`).

