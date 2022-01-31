import * as twgl from "twgl.js";
const vs1 = `#version 300 es

in vec2 a_position;

void main() {
    // gl_Position = vec4(a_position.xy - 1.0f, 1, 1);
    gl_Position = vec4(a_position, 1, 1);
}
`

const fs1 = `#version 300 es

precision highp float;

out ivec4 outColor;

void main() {
    outColor.r = 0;
}
`

const vs2 = `#version 300 es

in vec2 a_texCoord;

void main() {
    // gl_Position = vec4(a_texCoord * 2.0f - 1.0f, 1, 1);
    gl_Position = vec4(a_texCoord, 1, 1);
}`

const fs2 = `#version 300 es
precision highp float;

uniform mediump isampler2D tex;

out vec4 color;

void main() {
    ivec2 tex_size = textureSize(tex, 0);
    //to do: does gl_FragCoord need to be adusted for screen size or canvas size?
    int my_index = int(gl_FragCoord.x);
    for (int x = 0; x < tex_size.x; x++) {
        ivec4 t = texelFetch(tex, ivec2(x, gl_FragCoord.y), 0);
        if (t.r == my_index) {
            color.r += float(x);
            color.g += gl_FragCoord.y - 0.5f;
            color.b += 1.0;
        }
    }
    color.rg /= vec2(tex_size);
}
`

const feedback_source = `#version 300 es

out vec2 v_position;

uniform sampler2D summed;

void main() {
    ivec2 tex_size = textureSize(summed, 0);
    float count = 0.0;
    for (int y = 0; y < tex_size.y; y++){
        vec3 t = texelFetch(summed, ivec2(gl_VertexID, y), 0).xyz; 
        v_position += t.xy;
        count += t.z;
    }
    v_position /= count;
}`

const feedback_fragment_shader = `#version 300 es
precision highp float;

void main() {
  discard;
}`


const debug_frag_shader = `#version 300 es
precision highp float;

uniform mediump isampler2D tex;

out vec4 color;

void main(){
    vec4 c = vec4(texelFetch(tex, ivec2(gl_FragCoord), 0));
    color.r = fract((c.r + 1.0) * 1.7777777);
    color.g = fract((c.g + 1.0) * 2.1212121);
    color.b = fract((c.b + 1.0) * 13.987654);
    color.w = 1.0;
}
`

const pointVertexShader = `#version 300 es

in vec2 v_position;

void main() {  
    gl_Position = vec4(v_position * 2.0 - 1.0, 1, 1);
    gl_PointSize = 5.0;
}
`

const pointFragShader = `#version 300 es

precision highp float;

out vec4 color;

void main() {
    color = vec4(1, 1, 0, 1);
}
` 

const quad = new Float32Array([-
    1,-1, 1,-1, -1,1,
    1,-1, 1,1, -1,1
]);

const bufferArrays1 = {
    a_position:{
        numComponents:2,
        data: new Float32Array([-1, 1, -.5 , -.5, 0, .5])
        // data: quad,
    }
}

const bufferArrays2 = {
    a_texCoord:{
        numComponents:2,
        data: quad,
    }
}

const feedbackArray = {
    v_position:{
        numComponents:2,
        data: new Float32Array(16)
    }
}

const numberOfSites = 1

const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl2')
if (!gl.getExtension("EXT_color_buffer_float")){
    alert('no extention!!!')
}
const progarmInfo1 = twgl.createProgramInfo(gl, [vs1,fs1])
const progarmInfo2 = twgl.createProgramInfo(gl,[vs2,fs2])
const debugProgInfo = twgl.createProgramInfo(gl,[vs2,debug_frag_shader])
const drawPoints = twgl.createProgramInfo(gl,[pointVertexShader,pointFragShader])
const programInfo3 = twgl.createProgramInfo(gl, [feedback_source,feedback_fragment_shader], {transformFeedbackVaryings:["v_position"]})
const bufferInfo1 = twgl.createBufferInfoFromArrays(gl,bufferArrays1)
const bufferInfo2 = twgl.createBufferInfoFromArrays(gl,bufferArrays2)
const feedbackBuferInfo = twgl.createBufferInfoFromArrays(gl,feedbackArray)

const fbi = twgl.createFramebufferInfo(gl,[
    //store only integer and only on the values on the red channel
    {internalFormat: gl.R32I, format: gl.RED_INTEGER, type:gl.INT, minMag: gl.NEAREST,},
  ], canvas.width, canvas.height);

const sumBffer = twgl.createFramebufferInfo(gl,[
    //store floating point vec4 values
    {
        internalFormat:gl.RGBA32F,
        format:gl.RGBA,
        type:gl.FLOAT,
        minMag:gl.NEAREST}],numberOfSites, canvas.height)

const tf = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, feedbackBuferInfo.attribs.v_position.buffer)
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
gl.bindBuffer(gl.ARRAY_BUFFER, null)

function main() {

    //program 1, write to intermediateTexture
    gl.useProgram(progarmInfo1.program)
    twgl.setBuffersAndAttributes(gl,progarmInfo1,bufferInfo1)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbi.attachments[0], 0)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    //set the background 'color' to -1//
    gl.clearBufferiv(gl.COLOR, 0, new Int32Array([-1,0,0,0]))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    //for debug 
    gl.useProgram(debugProgInfo.program)
    twgl.setBuffersAndAttributes(gl,debugProgInfo,bufferInfo2)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.bindTexture(gl.TEXTURE_2D,fbi.attachments[0])
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    
    // // // progam2, read from intermediateTexture, write to screan
    gl.useProgram(progarmInfo2.program)
    twgl.setBuffersAndAttributes(gl,progarmInfo2,bufferInfo2)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)


    gl.bindFramebuffer(gl.FRAMEBUFFER, sumBffer.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sumBffer.attachments[0], 0)
    gl.bindTexture(gl.TEXTURE_2D, fbi.attachments[0])
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindFramebuffer(gl.FRAMEBUFFER,null)

    // // // //   // // // //program 3
    gl.useProgram(programInfo3.program)
    gl.enable(gl.RASTERIZER_DISCARD);
    twgl.setBuffersAndAttributes(gl, programInfo3, feedbackBuferInfo)
    
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf); 
    gl.beginTransformFeedback(gl.POINTS)

    gl.bindTexture(gl.TEXTURE_2D, sumBffer.attachments[0])
    gl.drawArrays(gl.POINTS, 0, 1)

    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    
    // // // turn on using fragment shaders again
    gl.disable(gl.RASTERIZER_DISCARD);


    gl.useProgram(drawPoints.program)
    twgl.setBuffersAndAttributes(gl,drawPoints,feedbackBuferInfo)
    gl.drawArrays(gl.POINTS,0,1)


    printResults(gl, feedbackBuferInfo.attribs.v_position.buffer, 'v_position')

    function printResults(gl, buffer, label) {
        const results = new Float32Array(2);
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