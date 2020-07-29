# Phaser3 Runner game example

This project builds a simple runner game using Phaser3. 
It's written in es6 and uses webpack 3 and babel to generate browseable version of the project. 

## Requirements

- Yarn 1.22+
- Node.js v12+
- npm 6+

## Develop

The project provides a development server with webpack which is useful to hot-reload the changes while coding.
To execute the dev server simply run at the root of the project:

```bash
yarn run dev
```

The execution of the previous command should spawn a web server listening on port 4000.

## Build

To build a deployable version of the project simply run:

```bash
yarn run build
```

This should produce a browser-friendly version of the project inside a folder called /build at the root of the project.