import * as webglUtils from "webgl-utils.js";
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

//data
function createCone(edges){
    const vertices = new Array();
    vertices[0] = 0;
    vertices[1] = 0;
    vertices[2] = -1;
    for (let i = 0; i <= edges; i++) {
        const angle = 2 * Math.PI * i / edges;
        vertices[i*3 + 3] = Math.cos(angle);
        vertices[i*3 + 4] = Math.sin(angle);
        vertices[i*3 + 5] = 1;
    }
    return vertices;
}

if (!gl) {
    throw new Error('WebGL not supported');
}

function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }

const positionData = [...new Array(2000)].map(d => rand(-1,1))
const vertextData = createCone(36)

let conversionMat = [
    .5, 0, 0,//<--sx  
    0, .5, 0,//<--sy I think this is scaling for pixle density?
    .5, .5, 1//<--tx, ty translate 0,0 from texture space (<0,0> to <1,1>) to clip space
]

//shaders
    
let vs1 = `#version 300 es
precision highp float;
in vec3 vertex; // position per vertex
in vec2 position; // offset per instance
out vec3 color;
void main() {
    color.r = float(gl_InstanceID % 256) / 255.0;
    color.g = float((gl_InstanceID / 256) % 256) / 255.0;
    color.b = float((gl_InstanceID / 65536) % 256) / 255.0;
    gl_Position = vec4(vertex.xy + position.xy, vertex.z, 1);
}
`

let fs1 = `#version 300 es
precision highp float;
in vec3 color;
out vec4 outColor;
void main() {
    outColor = vec4(color, 1.0);
}
`

const vs2 = `#version 300 es

in vec2 a_texCoord;
out vec2 v_texCoord;
uniform mat3 u_matrix;
void main() {
    // v_texCoord = vec3(u_matrix * vec3(a_texCoord,1)).xy;
    // v_texCoord = a_texCoord;
    gl_Position = vec4(a_texCoord,1.0,1.0);
}`

const fs2 = `#version 300 es
precision highp float;
 
uniform sampler2D u_tex;
in vec2 v_texCoord;
 
out vec4 outColor;
 
void main() {
   outColor = texture(u_tex, v_texCoord);
outColor = vec4(0.0,0.8,0.0,1.0);
}`

function main () {
  console.time('time')
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertextData), gl.STATIC_DRAW);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW); 

const vertexShader1 = createShader(gl,gl.VERTEX_SHADER,vs1)
const fragShader1 = createShader(gl,gl.FRAGMENT_SHADER,fs1)
const vertexShader2 = createShader(gl, gl.VERTEX_SHADER, vs2)
const fragmentShader2 = createShader(gl, gl.FRAGMENT_SHADER, fs2)

const prog = createProgram(gl, vertexShader1,fragShader1)
// const prog2 = createProgram(gl, vertexShader2, fragmentShader2)

////////prog 1, write to texture///////////////////////////////

const vertexLocation = gl.getAttribLocation(prog, `vertex`);
gl.enableVertexAttribArray(vertexLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.vertexAttribPointer(vertexLocation, 3, gl.FLOAT, false, 0, 0);

const positionLocation = gl.getAttribLocation(prog, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(positionLocation, 1);

gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

gl.useProgram(prog);

// const mipLevel = 0
// var targetTexture = createEmptyTexture(gl,600,600,0)

//   const fb = gl.createFramebuffer();
//   gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

// const attachmentPoint = gl.COLOR_ATTACHMENT0;
// gl.framebufferTexture2D(
// gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, mipLevel);
// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, vertextData.length/3, positionData.length/2);

////////////////////////////////////////////////////
// //////////////prog2, read from textrue, write to screen///////////////////////////////////
// gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// let texCoordAttributeLocation = gl.getAttribLocation(prog2, "a_texCoord")
// var texCoordBuffer = gl.createBuffer();

// gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
//     // Upper-left triangle
//     -1, -1,
//     1, -1,
//     -1, 1,
//     // Lower-right triangle
//     1, -1,
//     1, 1,
//     -1, 1
// ]), gl.STATIC_DRAW);


// gl.enableVertexAttribArray(texCoordAttributeLocation);
// var size = 2;          // 2 components per iteration
// var type = gl.FLOAT;   // the data is 32bit floats
// var normalize = false; // don't normalize the data
// var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
// var offset = 0;        // start at the beginning of the buffer
// gl.vertexAttribPointer(
//     texCoordAttributeLocation, size, type, normalize, stride, offset)

// gl.useProgram(prog2);
// let mat3UniformLoc = gl.getUniformLocation(prog2, "u_matrix")
// gl.uniformMatrix3fv(mat3UniformLoc, false, conversionMat) 

// gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);       

// gl.drawArrays(gl.TRIANGLES, 0, 6);
console.timeEnd('time')
}

main()


//helper functions
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
  
    console.log(gl.getShaderInfoLog(shader));  // eslint-disable-line
    gl.deleteShader(shader);
    return undefined;
  }
  
  
  function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) { 
      return program;
    }
  
    console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
    gl.deleteProgram(program);
    return undefined;
  }
  
  function createEmptyTexture(gl:WebGL2RenderingContext,targetTextureWidth:number,targetTextureHeight:number,mipLevel:number) {
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      
      const internalFormat = gl.RGBA;
      const border = 0;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
      const data = null;
      gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);
      // Set up texture so we can render any size image and so we are
      // working with pixels.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   
      return texture;
  }