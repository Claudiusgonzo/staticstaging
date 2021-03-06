/**
 * The support library for running SSC's WebGL output in an interactive
 * browser widget. This is the support structure that "links" with the
 * compiled program to compose a complete scene.
 */

// Declare the `require` function, which will be "implemented" by running
// WebPack to concatenate all the modules. This, of course, means that
// interactions with any of these modules is untyped. To resolve this, change
// a module to use `import name = require('name')` and include a typing
// definition file.
declare function require(name: string): any;

import * as glrt from './glrt';

const mat4 = require('gl-mat4');
const canvasOrbitCamera = require('canvas-orbit-camera');

// A type alias for a GL data structure.
type Mat4 = Float32Array;

/**
 * Evaluate the compiled JavaScript code with `eval` in the context of the
 * runtime library, `glrt`. Also include a `dingus` object containing some
 * dingus-specific matrices.
 */
function shfl_eval(code: string, gl: WebGLRenderingContext, projection: Mat4,
                   view: Mat4)
{
  // Get the runtime functions.
  let rt = glrt.runtime(gl);

  // Add our projection and view matrices.
  let dingus = {
    projection,
    view,
  };

  // Construct variable bindings for everything in `rt`. This is essentially a
  // replacement for JavaScript's deprecated `with` statement.
  let bindings: string[] = [];
  for (let name in rt) {
    bindings.push(`var ${name} = rt.${name};`);
  }
  let bindings_js = bindings.join('\n');

  // Evaluate the code, but wrap it in a function to avoid scope pollution.
  return (function () {
    return eval(bindings_js + code);
  })();
}

/**
 * Compute a projection matrix (placed in the `out` matrix allocation) given
 * the width and height of a viewport.
 */
function projection_matrix(out: Mat4, width: number, height: number) {
  let aspectRatio = width / height;
  let fieldOfView = Math.PI / 4;
  let near = 0.01;
  let far  = 100;

  mat4.perspective(out, fieldOfView, aspectRatio, near, far)
}

/**
 * The type of a callback that handles performance information.
 */
export type PerfHandler =
  (frames: number, ms: number, latencies: number[]) => void;

/**
 * Set up a canvas inside a container element. Return a function that sets the
 * render function (given compiled SHFL code as a string).
 */
export function start_gl(
  container: HTMLElement, perfCbk?: PerfHandler, perfMode?: boolean
) {
  // Create a <canvas> element to do our drawing in. Then set it up to fill
  // the container and resize when the window resizes.
  let canvas = document.createElement('canvas');
  container.appendChild(canvas);
  function fit() {
    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.setAttribute('width', width + 'px');
    canvas.setAttribute('height', height + 'px');
  }
  window.addEventListener('resize', fit);
  fit();

  // Attach a `canvas-orbit-camera` thing, which handles user input for
  // manipulating the view.
  let camera = canvasOrbitCamera(canvas, {});

  // Initialize the OpenGL context with our rendering function.
  let gl = (canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext;

  // Create the transform matrices. Alternatively, these can be created using
  // `new Float32Array(16)`.
  let projection = mat4.create();
  let view = mat4.create();

  // Bookkeeping for calculating framerate.
  let frame_count = 0;
  let last_sample = performance.now();
  let last_frame = performance.now();
  let sample_rate = 1000;  // Measure every second.
  let latencies: number[] = [];

  // Initially, the SHFL function does nothing. The client needs to call us
  // back to fill in the function. Then, we will update this variable.
  let shfl_render: { proc: any, env: any } = null;

  // This function requests to render the next frame. In performance
  // measurement mode, we ask to run as quickly as possible. In ordinary mode,
  // we ask to run in the browser's render loop---i.e., only at a reasonable
  // frame rate like 60fps or whatever the browser likes.
  let nextFrame: () => void;
  if (perfMode) {
    nextFrame = () => setTimeout(render, 0);
  } else {
    nextFrame = () => window.requestAnimationFrame(render);
  }

  // The main render loop.
  function render() {
    // Get the current size of the canvas.
    let width = gl.drawingBufferWidth;
    let height = gl.drawingBufferHeight;

    // Handle user input and update the resulting camera view matrix.
    camera.view(view);
    camera.tick();

    // Update the projection matrix for translating to 2D screen space.
    projection_matrix(projection, width, height);

    // Draw on the whole canvas.
    gl.viewport(0, 0, width, height);

    // Rendering flags.
    gl.enable(gl.DEPTH_TEST);  // Prevent triangle overlap.

    // Invoke the compiled SHFL code.
    if (shfl_render) {
      shfl_render.proc.apply(void 0, shfl_render.env);
    }

    // Framerate tracking.
    if (perfCbk) {
      ++frame_count;
      let now = performance.now();
      let elapsed = now - last_sample;  // Milliseconds.
      latencies.push(now - last_frame);
      last_frame = now;
      if (elapsed > sample_rate) {
        perfCbk(frame_count, elapsed, latencies);
        last_sample = performance.now();
        frame_count = 0;
        latencies = [];
      }
    }

    // Ask to be run again.
    nextFrame();
  };

  // Start the first frame.
  nextFrame();

  // Return a function that lets the client update the render body.
  return function (shfl_code?: string) {
    if (shfl_code) {
      // Execute the compiled SHFL code in context.
      let shfl_program = shfl_eval(shfl_code, gl, projection, view);

      // Invoke the setup stage.
      shfl_render = shfl_program();
    }

    fit();
  };
}
