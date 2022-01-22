import * as twgl from "twgl.js";

const vs1 = `#version 300 es

in vec4 a_position;

void main() {
    gl_Position = a_position;
}
`

const fs1 = `#version 300 es

precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(1, 0.5, .2, 1);
}
`
const vs2 = `#version 300 es

in vec3 a_texCoord;
out vec2 v_texCoord;

uniform mat3 u_matrix;

void main() {
    v_texCoord = vec3(u_matrix * vec3(a_texCoord.xy,1)).xy;
    // v_texCoord = a_texCoord.xy;
    gl_Position = vec4(a_texCoord, 1.0);
}`

const fs2 = `#version 300 es

precision highp float;

uniform sampler2D tex;
in vec2 v_texCoord;
out vec4 color;

void main() {
    color = texture(tex,v_texCoord);
}
`
const vs_srouce1 = `#version 300 es

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
const fs_source1 = `#version 300 es

precision highp float;

in vec3 color;
out vec4 outColor;
void main() {
  outColor = vec4(color.rgb, 1);
}`

function createCone(edges:number) {
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

  function rand(min:number, max:number) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }

  function createDepthTexture(gl:WebGL2RenderingContext,targetTextureWidth:number,targetTextureHeight:number,mipLevel:number) {
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

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

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
  
const numberOfSites = 1000

const canvas = document.querySelector("canvas"),
gl = canvas.getContext("webgl2")

const arrays = {
  a_position: {
    numComponents: 2,
    divisor: 1,
    data: [...new Array(2 * numberOfSites)].map((_,i) => rand(-1,1)),
  },
  a_vertex: {
    numComponents: 3,
    data:createCone(36)
  }
}
const arrays2 = {
  a_texCoord:{
    numComponents: 2,
    data: [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]
  }
}

const uniforms = {
  u_matrix:[
        .5, 0, 0,
        0, .5, 0,
        .5, .5, 1
      ]
}
const progarmInfo1 = twgl.createProgramInfo(gl,[vs_srouce1,fs_source1])
const progarmInfo2 = twgl.createProgramInfo(gl,[vs2,fs2])
// const intermediateTexture = twgl.createTexture(gl,{
//   target:gl.TEXTURE_2D,
//   level:0,
//   width:600,
//   height:600,
//   min:gl.LINEAR,
//   mag:gl.LINEAR,
//   wrap:gl.CLAMP_TO_EDGE,
//   depth:1
// })
const  intermediateTexture = createEmptyTexture(gl,600,600,0)
// const targetTexture = twgl.createTexture(gl,{target:gl.TEXTURE_2D,level:0,width:600,height:600,min:gl.LINEAR,mag:gl.LINEAR})
const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, arrays)
const bufferInfo2 = twgl.createBufferInfoFromArrays(gl,arrays2)
// const fbo1 = twgl.createFramebufferInfo(gl,[
//   { format: gl.DEPTH_COMPONENT },
// ],600,600)
const fbo1 = gl.createFramebuffer()
// const fbo2 = gl.createFramebuffer()

function main() {
  console.time('time')
  //program 1
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.useProgram(progarmInfo1.program)
  twgl.setBuffersAndAttributes(gl,progarmInfo1,bufferInfo1)  
  //draw to farmebuffer backed by intermediate texture
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo1)
      // attach the depth texture to the framebuffer
  createDepthTexture(gl,600,600,0)
      
  var targetTexture = createEmptyTexture(gl,600,600,0)
  
      //bind frambuffer
   const attachmentPoint = gl.COLOR_ATTACHMENT0;
   gl.framebufferTexture2D(
      gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, 0);
  // createDepthTexture(gl,600,600,0)

  gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, arrays.a_vertex.data.length/3, arrays.a_position.data.length/2)
  // //program 2
  gl.bindFramebuffer(gl.FRAMEBUFFER,null)
  // // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0)
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.useProgram(progarmInfo2.program)
  twgl.setBuffersAndAttributes(gl,progarmInfo2,bufferInfo2) 
  twgl.setUniforms(progarmInfo2,uniforms)
  // // // //draw from intermediate textrue to fbo2 backed by target textrue
  // // // gl.bindTexture(gl.TEXTURE_2D,intermediateTexture)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  // //draw from target textrue to canvas
  // gl.bindFramebuffer(gl.FRAMEBUFFER,null)
  // gl.bindTexture(gl.TEXTURE_2D,targetTexture)
  // gl.drawArrays(gl.TRIANGLES, 0, 6)
  console.timeEnd('time')
}

main();