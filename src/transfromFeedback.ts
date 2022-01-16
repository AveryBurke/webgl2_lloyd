// // const vs = `#version 300 es
// // in float a;
// // in float b;

// // out float sum;
// // out float diff;
// // out float prod;

// // void main() {
// //  sum = a + b;
// //  diff = a - b;
// //  prod = a * b;
// // }
// // `
// // const fs = `#version 300 es
// // precision highp float;
// // void main () {

// // }`

// const updatePositionVS = `#version 300 es
// in vec2 oldPosition;
// in vec2 velocity;
 
// uniform float deltaTime;
// uniform vec2 canvasDimensions;
 
// out vec2 newPosition;
 
// vec2 euclideanModulo(vec2 n, vec2 m) {
//     return mod(mod(n, m) + m, m);
// }
 
// void main() {
//   newPosition = euclideanModulo(
//       oldPosition + velocity * deltaTime,
//       canvasDimensions);
// }`

// const drawParticlesVS = `#version 300 es
// in vec4 position;
// uniform mat4 matrix;
 
// void main() {
//   // do the common matrix math
//   gl_Position = matrix * position;
//   gl_PointSize = 10.0;
// }`


// const updatePositionFS = `#version 300 es
// precision highp float;
// void main() {
// }
// `

// const drawParticlesFS = `#version 300 es
//   precision highp float;
//   out vec4 outColor;
//   void main() {
//       outColor = vec4(1,0,0,1);
//   }
//   `
// //set up web gl context//
// const canvas = document.createElement('canvas');
// const gl = canvas.getContext('webgl2');
// // create random positions and velocities.
// const rand = (min, max) => {
//     if (max === undefined) {
//       max = min;
//       min = 0;
//     }
//     return Math.random() * (max - min) + min;
//   };

// //some data
// const numParticles = 200;
// const createPoints = (num, ranges) =>
// //@ts-ignore
//     new Array(num).fill(0).map(_ => ranges.map(range => rand(...range))).flat();
// const positions = new Float32Array(createPoints(numParticles, [[canvas.width], [canvas.height]]));
// const velocities = new Float32Array(createPoints(numParticles, [[-300, 300], [-300, 300]]));

// const updatePositionProgram = createProgram(
//     gl, [updatePositionVS, updatePositionFS], ['newPosition']);
// const drawParticlesProgram = createProgram(
//     gl, [drawParticlesVS, drawParticlesFS]);

// //set up buffers
// const updatePositionPrgLocs = {
//     oldPosition: gl.getAttribLocation(updatePositionProgram,'oldPosition'),
//     velocity: gl.getAttribLocation(updatePositionProgram,'velocity'),
//     deltaTime: gl.getUniformLocation(updatePositionProgram,'deltaTime'),
//     canvasDimensions: gl.getUniformLocation(updatePositionProgram,'canvasDimensions')
// }

// const drawParticlesProgLocs = {
//     position: gl.getAttribLocation(drawParticlesProgram,'position'),
//     matrix: gl.getUniformLocation(drawParticlesProgram, 'matrix')
// }

// const position1Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW)//<-- notice dynamic draw, becasue we will overwrite data
// const position2Buffer = makeBuffer(gl, positions, gl.DYNAMIC_DRAW)
// const velocityBuffer = makeBuffer(gl, velocities, gl.STATIC_DRAW)

// const updatePositionVA1 = makeVertexArray(gl, [
//     [position1Buffer, updatePositionPrgLocs.oldPosition],
//     [velocityBuffer, updatePositionPrgLocs.velocity],
//   ]);
//   const updatePositionVA2 = makeVertexArray(gl, [
//     [position2Buffer, updatePositionPrgLocs.oldPosition],
//     [velocityBuffer, updatePositionPrgLocs.velocity],
//   ]);
   
// const drawVA1 = makeVertexArray(
//     gl, [[position1Buffer, drawParticlesProgLocs.position]]);
// const drawVA2 = makeVertexArray(
//     gl, [[position2Buffer, drawParticlesProgLocs.position]]);

// const tf1 = makeTransformFeedback(gl,position1Buffer)
// const tf2 = makeTransformFeedback(gl,position2Buffer)

// let current = {
//     updateVA: updatePositionVA1,  // read from position1
//     tf: tf2,                      // write to position2
//     drawVA: drawVA2,              // draw with position2
//   }

// let next = {
//     updateVA: updatePositionVA2,  // read from position2
//     tf: tf1,                      // write to position1
//     drawVA: drawVA1,              // draw with position1
// }

// // unbind left over stuff
// gl.bindBuffer(gl.ARRAY_BUFFER, null);
// gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

// const vao = gl.createVertexArray();
// gl.bindVertexArray(vao);

// const a = [1, 2, 3, 4, 5, 6];
// const b = [3, 6, 9, 12, 15, 18];
 
// // put data in buffers
// // const aBuffer = makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
// // const bBuffer = makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);

// // Create and fill out a transform feedback
// const tf = gl.createTransformFeedback();
// gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
 
// // make buffers for output
// // const sumBuffer = makeBuffer(gl, a.length * 4);
// // const differenceBuffer = makeBuffer(gl, a.length * 4);
// // const productBuffer = makeBuffer(gl, a.length * 4);
 
// // bind the buffers to the transform feedback
// // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
// // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
// // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);
 
// gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
 
// // buffer's we are writing to can not be bound else where
// gl.bindBuffer(gl.ARRAY_BUFFER, null);  // productBuffer was still bound to ARRAY_BUFFER so unbind it

// // gl.useProgram(program);
 
// // bind our input attribute state for the a and b buffers
// gl.bindVertexArray(vao);
 
// // no need to call the fragment shader
// gl.enable(gl.RASTERIZER_DISCARD);
 
// gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
// gl.beginTransformFeedback(gl.POINTS);
// gl.drawArrays(gl.POINTS, 0, a.length);
// gl.endTransformFeedback();
// gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
 
// // turn on using fragment shaders again
// gl.disable(gl.RASTERIZER_DISCARD);
 
// // logResults(gl, sumBuffer, 'sums');
// // logResults(gl, differenceBuffer, 'differences');
// // logResults(gl, productBuffer, 'products');
 

// ////////helpers//////////////////////////////////
// function createShader(gl, type, src) {
//     const shader = gl.createShader(type);   
//     gl.shaderSource(shader, src);
//     gl.compileShader(shader);
//     if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
//       throw new Error(gl.getShaderInfoLog(shader));
//     }
//     return shader;
//   }

//   function makeBuffer(gl:WebGL2RenderingContext, sizeOrData, useage:number) {
//     const buf = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, buf);
//     gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, useage);
//     return buf;
//   }
   
//   function makeBufferAndSetAttribute(gl, data, loc, useage) {
//     const buf = makeBuffer(gl, data, useage);
//     // setup our attributes to tell WebGL how to pull
//     // the data from the buffer above to the attribute
//     gl.enableVertexAttribArray(loc);
//     gl.vertexAttribPointer(
//         loc,
//         1,         // size (num components)
//         gl.FLOAT,  // type of data in buffer
//         false,     // normalize
//         0,         // stride (0 = auto)
//         0,         // offset
//     );
//   }

//   function logResults(gl:WebGL2RenderingContext, buffer, label) {
//     const results = new Float32Array(a.length);
//     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//     gl.getBufferSubData(
//         gl.ARRAY_BUFFER,
//         0,    // byte offset into GPU buffer,
//         results,
//     );
//     // print the results
//     console.log(`${label}: ${results}`);
//   }

//   function makeTransformFeedback(gl, buffer) {
//     const tf = gl.createTransformFeedback();
//     gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
//     gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer);
//     return tf;
//   }

//   function makeVertexArray(gl, bufLocPairs) {
//     const va = gl.createVertexArray();
//     gl.bindVertexArray(va);
//     for (const [buffer, loc] of bufLocPairs) {
//       gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//       gl.enableVertexAttribArray(loc);
//       gl.vertexAttribPointer(
//           loc,      // attribute location
//           2,        // number of elements
//           gl.FLOAT, // type of data
//           false,    // normalize
//           0,        // stride (0 = auto)
//           0,        // offset
//       );
//     }
//     return va;
//   }

//   function createProgram(gl:WebGL2RenderingContext, shaderSources:string[], transformFeedbackVaryings?:string[]) {
//     const program = gl.createProgram();
//     [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
//       const shader = createShader(gl, type, shaderSources[ndx]);
//       gl.attachShader(program, shader);
//     });
//     if (transformFeedbackVaryings) {
//       gl.transformFeedbackVaryings(
//           program,
//           transformFeedbackVaryings,
//           gl.SEPARATE_ATTRIBS,
//       );
//     }
//     gl.linkProgram(program);
//     if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
//       throw new Error(gl.getProgramParameter(program,0));
//     }
//     return program;
//   }