// const vs1 = `#version 300 es

// in vec3 a_vertex;
// in vec2 a_position;
// out vec3 color;

// void main() {
//     color.r = float(gl_InstanceID % 256) / 255.0;
//     color.g = float((gl_InstanceID / 256) % 256) / 255.0;
//     color.b = float((gl_InstanceID / 65536) % 256) / 255.0;   
//     gl_Position = vec4(a_vertex.xy + a_position.xy, a_vertex.z, 1);
// }
// `

// const fs1 = `#version 300 es

// precision highp float;

// in vec3 color;
// out vec4 outColor;
// void main() {
//   outColor = vec4(color.rgb, 1);
// }`


// const vs2 = `#version 300 es

// in vec3 a_texCoord;
// out vec2 v_texCoord;

// uniform mat3 u_matrix;

// void main() {
//     // v_texCoord = a_texCoord.xy;
//     v_texCoord = vec3(u_matrix * vec3(a_texCoord.xy,1)).xy;
//     gl_Position = vec4(a_texCoord, 1.0);
// }`

// const fs2 = `#version 300 es

// precision highp float;

// uniform sampler2D tex;
// in vec2 v_texCoord;
// out vec4 color;

// void main() {
//     color = texture(tex,v_texCoord);
// }
// `

// function createCone(edges:number){
//       const vertices = new Array();
//       vertices[0] = 0;
//       vertices[1] = 0;
//       vertices[2] = -1;
//       for (let i = 0; i <= edges; i++) {
//           const angle = 2 * Math.PI * i / edges;
//           vertices[i*3 + 3] = Math.cos(angle);
//           vertices[i*3 + 4] = Math.sin(angle);
//           vertices[i*3 + 5] = 1;
//       }
//       return vertices;
//   }
  
//   function rand(min:number, max:number) {
//       if (max === undefined) {
//         max = min;
//         min = 0;
//       }
//       return min + Math.random() * (max - min);
//     }
  
//   const numberOfSites = 1000
//   const positionData = [...new Array(2 * numberOfSites)].map((_,i) => rand(-1,1))
//   const vertextData = createCone(36)

// function createShader(gl, type, source) {
//     let shader = gl.createShader(type)
//     gl.shaderSource(shader, source)
//     gl.compileShader(shader)
//     return shader
// }

// function createProgram(gl, vertexShader, fragmentShader) {
//     let program = gl.createProgram()
//     gl.attachShader(program, vertexShader)
//     gl.attachShader(program, fragmentShader)
//     gl.linkProgram(program)
//     return program
// }

// function createEmptyTexture(gl, targetTextureWidth, targetTextureHeight, mipLevel) {
//     let texture = gl.createTexture()
//     gl.bindTexture(gl.TEXTURE_2D, texture)
//     gl.texImage2D(gl.TEXTURE_2D, mipLevel, gl.RGB,
//         targetTextureWidth, targetTextureHeight, 0,
//         gl.RGB, gl.UNSIGNED_BYTE, null)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
//     return texture
// }



// function main() {
//   const canvas = document.querySelector("canvas");
//   const gl = canvas.getContext("webgl2");
//     if (!gl) {
//       return;
//     }
//     const vertexShader1 = createShader(gl, gl.VERTEX_SHADER, vs1),
//         fragmentShader1 = createShader(gl, gl.FRAGMENT_SHADER, fs1),

//         vertexShader2 = createShader(gl, gl.VERTEX_SHADER, vs2),
//         fragmentShader2 = createShader(gl, gl.FRAGMENT_SHADER, fs2),

//         program1 = createProgram(gl, vertexShader1, fragmentShader1),
//         program2 = createProgram(gl, vertexShader2, fragmentShader2),

//         positionAttributeLocation = gl.getAttribLocation(program1, "a_position"),
//         vertexAttributeLocation  = gl.getAttribLocation(program1, "a_vertex"),
//         texturePositionAttributeLocation = gl.getAttribLocation(program2, "a_texCoord"),

//         positionBuffer = gl.createBuffer(),
//         vertexBuffer = gl.createBuffer()

//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionData), gl.STATIC_DRAW)
//     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertextData), gl.STATIC_DRAW)

//     const vao0 = gl.createVertexArray()

//     gl.bindVertexArray(vao0)
//     gl.enableVertexAttribArray(positionAttributeLocation)
//     gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

//     const vao1 = gl.createVertexArray()

//     gl.bindVertexArray(vao1)
//     gl.enableVertexAttribArray(vertexAttributeLocation)
//     gl.vertexAttribPointer(vertexAttributeLocation, 3, gl.FLOAT, false, 0, 0)

//     const mipLevel = 0

//     // program1 draws to fbo1 backed by intermediateTexture at color attachment 0

//     gl.useProgram(program1)
  
//     gl.bindVertexArray(vao0)
//     gl.bindVertexArray(vao1)

//     const fbo1 = gl.createFramebuffer()
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1)
//     createAndAttachDepthTexture(gl,600,600,0)
//     const intermediateTexture = createEmptyTexture(gl, gl.canvas.width, gl.canvas.height, mipLevel)

//     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, intermediateTexture, mipLevel)
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
//     // gl.drawArrays(gl.TRIANGLES, 0, 3)
//     gl.enable(gl.DEPTH_TEST);
//     gl.depthFunc(gl.LEQUAL);
//     gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, vertextData.length/3, positionData.length/2)

//     gl.bindFramebuffer(gl.FRAMEBUFFER, null) // Is this the problem?

//     // program2 is supposed to draw to fbo2 backed by new texture at color attachment 0

//     gl.useProgram(program2)

//     const vao2 = gl.createVertexArray()
//     gl.bindVertexArray(vao2)
//     gl.enableVertexAttribArray(texturePositionAttributeLocation)
//     gl.vertexAttribPointer(texturePositionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
//     gl.bindVertexArray(vao2)

//     const quad = [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW)
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

//     let mat3UniformLoc = gl.getUniformLocation(program2, "u_matrix")
//     let conversionMat = [
//         .5, 0, 0,//<--sx  
//         0, .5, 0,//<--sy I think this is scaling for pixle density?
//         .5, .5, 1//<--tx, ty translate
//     ]
//     gl.uniformMatrix3fv(mat3UniformLoc, false, conversionMat) 

//     const fbo2 = gl.createFramebuffer();
//     gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
//     const targetTexture = createEmptyTexture(gl, gl.canvas.width, gl.canvas.height, mipLevel)
//     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, mipLevel)
//     gl.bindTexture(gl.TEXTURE_2D,intermediateTexture)
//     gl.drawArrays(gl.TRIANGLES, 0, 6)

//     /////
//     gl.bindFramebuffer(gl.FRAMEBUFFER,null)
//     gl.bindTexture(gl.TEXTURE_2D,targetTexture)
//     gl.drawArrays(gl.TRIANGLES, 0, 6)
// }

// main();