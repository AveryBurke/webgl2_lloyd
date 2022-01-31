import * as twgl from "twgl.js";
const numberOfSites = 100
const canvas = document.querySelector("canvas"),
gl = canvas.getContext("webgl2")
////////////////for debugg////////////////////
const pointVertexShader = `#version 300 es

in vec3 a_vertex;
in vec2 a_position;

void main() {  
    gl_Position = vec4(a_vertex.xy + 2.0f * a_position.xy - 1.0f, a_vertex.z, 1);
    gl_PointSize = 3.0;
}
`

const pointFragShader = `#version 300 es

precision highp float;

out vec4 color;

void main() {
    color = vec4(0, 21, .2, 1);
}
` 
/////////////////////////////////////////////////////////

const vs_srouce1 = `#version 300 es

in vec3 a_vertex;
//keep the positions in texture space -- 0 to 1//
in vec2 a_position;
out vec3 color;

void main() {
    gl_Position = vec4(a_vertex.xy + 2.0f * a_position.xy - 1.0f, a_vertex.z, 1);
    color.r = float(gl_InstanceID % 256) / 255.0;
    color.g = float((gl_InstanceID / 256) % 256) / 255.0;
    color.b = float((gl_InstanceID / 65536) % 256) / 255.0;   
}
`
const fs_source1 = `#version 300 es

precision highp float;

in vec3 color;
out vec4 outColor;
void main() {
  outColor = vec4(color.rgb, 1);
}`

/////////////////////////////////////////////////////////////

const vs2 = `#version 300 es

in vec2 a_texCoord;

void main() {
    gl_Position = vec4(a_texCoord, 1.0, 1.0);
}`

const sum_frag = `#version 300 es
precision highp float;

out vec4 color;

uniform sampler2D voronoi;

void main()
{
    color = vec4(0.0, 0.0, 0.0, 1.0);
    int my_index = int(gl_FragCoord.x);
    ivec2 tex_size = textureSize(voronoi, 0);
    float count = 0.0f;
    for (int x=0; x < tex_size.x; x++)
    {
      ivec2 coord = ivec2(x, gl_FragCoord.y);
      vec4 t = texelFetch(voronoi, coord, 0);

      // Unpack RGB value into a Voronoi cell index
      int i = int(255.0f * (t.r + (t.g * 256.0f) + (t.b * 65536.0f)));
      if (i == my_index)
      {
          color.xy += vec2(coord).xy;
          color.z += 1.0;
      }
    }

    // Normalize to the 0 - 1 range
    color.xy = color.xy / vec2(tex_size.xy);
}`

const feedback_source = `#version 300 es

out vec2 v_position;

uniform sampler2D summed;

void main()
{
    ivec2 tex_size = textureSize(summed, 0);
    v_position = vec2(0.0f, 0.0f);
    float count = 0.0f;
    for (int y=0; y < tex_size.y; ++y)
    {
        vec4 t = texelFetch(summed, ivec2(gl_VertexID, y), 0); 
        v_position.xy += t.xy;
        count += t.z;
    }
    v_position.xy /= count;
}`

//debug

const debug_vertex = `#version 300 es

in vec2 a_texCoord;

void main() {
    gl_Position = vec4(a_texCoord, 1.0, 1.0);
}`

const dubge_frag = `#version 300 es
precision highp float;

out vec4 color;

void main() {
  color = vec4(50.0, 168.0, 82.0, 1.0);
}
`

//just enough to compile
const feedback_fragment_shader = `#version 300 es
precision highp float;

void main() {
  discard;
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




// const positionData = [.5,.5]
const positionData = [...new Array(2 * numberOfSites)].map((_,i) => rand(0,1))
console.log('original position: ', positionData)
const arrays = {
  a_position: {
    numComponents: 2,
    divisor: 1,
    data: positionData,
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

const range = [...new Float32Array(gl.canvas.width)]

const array3 = {
  index:{
    numComponents: 1,
    data: range
  }
}

const arrays4 = {
  a_position: {
    numComponents: 2,
    divisor: 1,
    data: new Float32Array(numberOfSites * 2),
  },
  a_vertex: {
    numComponents: 3,
    data:createCone(36)
}}

const debugArrays = {
  a_texCoord:{
    numComponents: 2,
    data: [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]
  }
}


const progarmInfo1 = twgl.createProgramInfo(gl,[vs_srouce1,fs_source1])
const progarmInfo2 = twgl.createProgramInfo(gl,[vs2,sum_frag])
const programInfo3 = twgl.createProgramInfo(gl, [feedback_source,feedback_fragment_shader], {transformFeedbackVaryings:["v_position"]})
const drawPoints = twgl.createProgramInfo(gl,[pointVertexShader,pointFragShader])
const debug = twgl.createProgramInfo(gl, [debug_vertex,dubge_frag])
const targetTexture = twgl.createTexture(gl,{target:gl.TEXTURE_2D,level:0,width:numberOfSites,height:gl.canvas.height,min:gl.LINEAR,mag:gl.LINEAR,wrap:gl.CLAMP_TO_EDGE})
const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, arrays)
const bufferInfo2 = twgl.createBufferInfoFromArrays(gl,arrays2)
const bufferInfo3 = twgl.createBufferInfoFromArrays(gl, array3)
const bufferInfo4 = twgl.createBufferInfoFromArrays(gl,arrays4)
const debugBuffer = twgl.createBufferInfoFromArrays(gl,debugArrays)

const fbo1 = gl.createFramebuffer()
const fbo2 = gl.createFramebuffer()

const tf = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)

gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufferInfo4.attribs.a_position.buffer)
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
gl.bindBuffer(gl.ARRAY_BUFFER, null)


function main() {
  console.time('time')
  //program 1
 
  gl.useProgram(debug.program)
  twgl.setBuffersAndAttributes(gl,debug,debugBuffer)
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.drawArrays(gl.TRIANGLES, 0, 6)
  // gl.useProgram(progarmInfo1.program)
  // twgl.setBuffersAndAttributes(gl,progarmInfo1,bufferInfo1)  

  //draw to farmebuffer backed by intermediate texture
  // gl.enable(gl.DEPTH_TEST);
  // gl.depthFunc(gl.LEQUAL);
  // gl.bindFramebuffer(gl.FRAMEBUFFER,fbo1)

  // createDepthTexture(gl,600,600,0)  
  // const intermediateTexture = createEmptyTexture(gl,600,600,0)
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, intermediateTexture, 0);
  // gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, arrays.a_vertex.data.length/3, arrays.a_position.data.length/2)
  // gl.disable(gl.DEPTH_TEST)

  // // //program 2
  // gl.bindFramebuffer(gl.FRAMEBUFFER,null)
  // twgl.resizeCanvasToDisplaySize(gl.canvas)
  // gl.viewport(0, 0, numberOfSites, gl.canvas.height)
  // gl.useProgram(progarmInfo2.program)
  // twgl.setBuffersAndAttributes(gl,progarmInfo2,bufferInfo2)
  // gl.bindFramebuffer(gl.FRAMEBUFFER,fbo2)
  // // draw from intermediate textrue to fbo2 backed by target textrue
  // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0)
  // gl.bindTexture(gl.TEXTURE_2D,intermediateTexture)
  // gl.drawArrays(gl.TRIANGLES, 0, 6)
  // gl.bindFramebuffer(gl.FRAMEBUFFER,null) 
  // gl.bindTexture(gl.TEXTURE_2D,null)
  // gl.bindBuffer(gl.ARRAY_BUFFER,null)

  // // // //program 3
  // gl.useProgram(programInfo3.program)
  // gl.enable(gl.RASTERIZER_DISCARD);
  // twgl.setBuffersAndAttributes(gl, programInfo3, bufferInfo3)
  
  // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf); 
  // gl.beginTransformFeedback(gl.POINTS)
  // twgl.resizeCanvasToDisplaySize(gl.canvas)
  // gl.viewport(0, 0, numberOfSites, gl.canvas.height)
  // gl.bindTexture(gl.TEXTURE_2D, targetTexture)
  // gl.drawArrays(gl.POINTS, 0, numberOfSites)

  // gl.endTransformFeedback();
  // gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
 
  // // // turn on using fragment shaders again
  // gl.disable(gl.RASTERIZER_DISCARD);

  // //   //////////debug code///////
  // gl.bindBuffer(gl.ARRAY_BUFFER,null)
  // twgl.resizeCanvasToDisplaySize(gl.canvas)
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  // gl.useProgram(progarmInfo1.program)


  // twgl.setBuffersAndAttributes(gl,progarmInfo1,bufferInfo1)
  // gl.enable(gl.DEPTH_TEST);
  // gl.depthFunc(gl.LEQUAL);
  // gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, arrays.a_vertex.data.length/3, arrays.a_position.data.length/2)

  // gl.useProgram(drawPoints.program)
  // twgl.setBuffersAndAttributes(gl,drawPoints,bufferInfo4)  

  // twgl.resizeCanvasToDisplaySize(gl.canvas)
  // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  // gl.drawArraysInstanced(gl.POINTS, 0, arrays4.a_vertex.data.length/3, arrays4.a_position.data.length/2)


  console.timeEnd('time')

  printResults(gl, bufferInfo4.attribs.a_position.buffer, 'v_position')

  function printResults(gl, buffer, label) {
    const results = new Float32Array(numberOfSites * 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(
        gl.ARRAY_BUFFER,
        0,    // byte offset into GPU buffer,
        results,
    );

    console.log(`${label}: ${results}`);
  }
}

main();