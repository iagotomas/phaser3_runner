# Phaser3 Runner game example

This project builds a simple runner game using Phaser3. 
It's written in es6 and uses webpack 3 and babel to generate browseable version of the project. 

For further information visit https://iagotomas.github.io/phaser3_runner/

## Requirements

- Yarn 1.22+
- Node.js v12+
- npm 6+

## Develop

The project provides a development server with webpack which is useful to hot-reload the changes while coding.
SSL certificate is required for the dev server to work. Self-signed certificate is required for local development. 
You can generate a self-signed certificate using the following command:

```bash
mkdir certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/private.key -out certs/certificate.crt
``` 

To execute the dev server simply run at the root of the project:

```bash
yarn run dev
```

The execution of the previous command should spawn a web server listening on port 4000 with https enabled (https://localhost:4000).

## Performance Optimization

A comprehensive review of the codebase was conducted to identify performance bottlenecks. The following optimizations and best practices were verified:

- **Object Pooling**: Implemented in `ShootingSystem` for projectiles and enemy spawning to reduce garbage collection overhead.
- **Rendering Efficiency**: Parallax background updates are optimized to only run when the camera moves.
- **Throttling**: FPS counter updates are throttled to minimize CPU usage.
- **Audio Handling**: Robust audio context management in `ShootingSystem` to prevent errors.

The game maintains a consistent frame rate and efficient memory usage.


### Locally run the game

To locally run the game, you can use the following command:

```bash
./www
```

This will spawn a web server listening on port 8080 (http://localhost:8080) and 8443 (https://localhost:8443).