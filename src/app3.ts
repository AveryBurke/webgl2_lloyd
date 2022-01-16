
const vertexShaderSource = `#version 300 es

in vec3 a_vertex;
in vec2 a_position;
out vec3 color;

void main() {
    color.r = float(gl_InstanceID % 256) / 255.0;
    color.g = float((gl_InstanceID / 256) % 256) / 255.0;
    color.b = float((gl_InstanceID / 65536) % 256) / 255.0;   
    gl_Position = vec4(a_vertex.xy + a_position.xy, a_vertex.z, 1);
}
`

const fragmentShaderSource = `#version 300 es

precision highp float;

in vec3 color;
out vec4 outColor;
void main() {
  outColor = vec4(color.rgb, 1);
}`

const vs2 = `#version 300 es

in vec3 a_texCoord;
out vec2 v_texCoord;
uniform mat3 u_matrix;
void main() {
    v_texCoord = vec3(u_matrix * vec3(a_texCoord.xy,1)).xy;
    gl_Position = vec4(a_texCoord, 1.0);
}`

const fs2 = `#version 300 es
precision highp float;

uniform sampler2D u_tex;
 
in vec2 v_texCoord;
 
out vec4 outColor;
 
void main() {
  outColor = texture(u_tex, v_texCoord);
}`

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

function createAndAttachDepthTexture(gl:WebGL2RenderingContext,targetTextureWidth:number,targetTextureHeight:number,mipLevel:number) {
  // create a depth texture
const depthTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthTexture);
 
  const internalFormat = gl.DEPTH_COMPONENT24 ;
  const border = 0;
  const format = gl.DEPTH_COMPONENT;
  const type = gl.UNSIGNED_INT;
  const data = null;
  gl.texImage2D(gl.TEXTURE_2D, mipLevel, internalFormat,
                targetTextureWidth, targetTextureHeight, border,
                format, type, data);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
  // attach the depth texture to the framebuffer
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, mipLevel);
}

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

function rand(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }
const numberOfSites = 1000
const positionData = [...new Array(2 * numberOfSites)].map((_,i) => rand(-1,1))

const vertextData = createCone(36)

function main() {
  // Get A WebGL context
  console.time('time')
  var canvas = document.querySelector("canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  let vertexShader2 = createShader(gl, gl.VERTEX_SHADER, vs2)
  let fragmentShader2 = createShader(gl, gl.FRAGMENT_SHADER, fs2)

  var program1 = createProgram(gl, vertexShader, fragmentShader)
  let program2 = createProgram(gl, vertexShader2, fragmentShader2)

  const vertexAttributeLocation = gl.getAttribLocation(program1, "a_vertex");
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertextData), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(vertexAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(vertexAttributeLocation, 3, gl.FLOAT, false, 0, 0);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW); 

  const positionAttributeLocation = gl.getAttribLocation(program1, 'a_position')
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(positionAttributeLocation, 1);

  gl.useProgram(program1);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  const mipLevel = 0
  

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    createAndAttachDepthTexture(gl,600,600,0)
    
    var targetTexture = createEmptyTexture(gl,600,600,0)

    //bind frambuffer
 const attachmentPoint = gl.COLOR_ATTACHMENT0;
 gl.framebufferTexture2D(
    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, mipLevel);
    

//render the ouput of program 1 to the farmebugger
gl.viewport(0,0,600,600)
gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, vertextData.length/3, positionData.length/2);




  //render the texture (the output of program1) to the canvas uisng program2

gl.bindFramebuffer(gl.FRAMEBUFFER, null);

let texCoordAttributeLocation = gl.getAttribLocation(program2, "a_texCoord")
var texCoordBuffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // Upper-left triangle
    -1, -1,
    1, -1,
    -1, 1,
    // Lower-right triangle
    1, -1,
    1, 1,
    -1, 1,
]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(texCoordAttributeLocation);
var size = 2;          // 2 components per iteration
var type = gl.FLOAT;   // the data is 32bit floats
var normalize = false; // don't normalize the data
var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
var offset = 0;        // start at the beginning of the buffer
gl.vertexAttribPointer(
    texCoordAttributeLocation, size, type, normalize, stride, offset)

gl.useProgram(program2);
let mat3UniformLoc = gl.getUniformLocation(program2, "u_matrix")
let conversionMat = [
    .5, 0, 0,//<--sx  
    0, .5, 0,//<--sy I think this is scaling for pixle density?
    .5, .5, 1//<--tx, ty translate
]
gl.uniformMatrix3fv(mat3UniformLoc, false, conversionMat) 

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
// gl.enable(gl.DEPTH_TEST);
// gl.depthFunc(gl.LEQUAL);
gl.drawArrays(gl.TRIANGLES, 0, 6);
console.timeEnd('time')
    
}

main();