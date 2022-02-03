import * as twgl from "twgl.js";

const vs1 = `#version 300 es

in vec2 a_position;
in vec3 a_instance;
flat out int v_ID;
void main() {
    v_ID = gl_InstanceID;
    gl_Position = vec4(a_instance.xy + a_position.xy, a_instance.z, 1);
}
`

const fs1 = `#version 300 es

precision highp float;

flat in int v_ID; 
out ivec4 outColor;

void main() {
    // if (v_ID == 0){
    //     outColor.r = 800;
    // } else {
        outColor.r = v_ID;
    // }
    
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

out vec2 a_position;

uniform sampler2D summed;

void main() {
    ivec2 tex_size = textureSize(summed, 0);
    float count = 0.0;
    for (int y = 0; y < tex_size.y; y++){
        vec3 t = texelFetch(summed, ivec2(gl_VertexID, y), 0).xyz; 
        a_position += t.xy;
        count += t.z;
    }
    a_position /= count;
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

in vec2 a_position;

void main() {  
    gl_Position = vec4(a_position * 2.0 - 1.0, 1, 1);
    gl_PointSize = 3.0;
}
`

const pointFragShader = `#version 300 es

precision highp float;

out vec4 color;

void main() {
    color = vec4(1, 1, 0, 1);
}
`
const canvas = document.querySelector('canvas')
const gl = canvas.getContext('webgl2')
if (!gl.getExtension("EXT_color_buffer_float")){
    alert('no extention!!!')
} 
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

const numberOfSites = 1000
const positionData = [...new Array(2 * numberOfSites)].map((_,i) => rand(-1,1))

const quad = new Float32Array([-
    1,-1, 1,-1, -1,1,
    1,-1, 1,1, -1,1
]);

const bufferArrays1 = {
    a_position:{
        numComponents:2,
        divisor: 1,
        data: positionData,
        drawType:gl.DYNAMIC_DRAW
    },
    a_instance:{
        numComponents:3,
        data:createCone(36)
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
        numComponents:1,
        data: [...new Float32Array(numberOfSites).keys()]
    }
}



const progarmInfo1 = twgl.createProgramInfo(gl, [vs1,fs1])
const progarmInfo2 = twgl.createProgramInfo(gl, [vs2,fs2])
const debugProgInfo = twgl.createProgramInfo(gl, [vs2,debug_frag_shader])
const drawPoints = twgl.createProgramInfo(gl, [pointVertexShader,pointFragShader])
const programInfo3 = twgl.createProgramInfo(gl, [feedback_source,feedback_fragment_shader], {transformFeedbackVaryings:["a_position"]})
const bufferInfo1 = twgl.createBufferInfoFromArrays(gl, bufferArrays1)
const bufferInfo2 = twgl.createBufferInfoFromArrays(gl, bufferArrays2)
const feedbackBuferInfo = twgl.createBufferInfoFromArrays(gl, feedbackArray)

const fbi = twgl.createFramebufferInfo(gl,[
    //store only integer and only on the values on the red channel
    {internalFormat: gl.R32I, format: gl.RED_INTEGER, type:gl.INT, minMag: gl.NEAREST,},
    {attachmentPoint:gl.DEPTH_ATTACHMENT, internalFormat:gl.DEPTH_COMPONENT24,format:gl.DEPTH_COMPONENT},
  ], 4096, 4096);

const sumBffer = twgl.createFramebufferInfo(gl,[
    //store floating point vec4 values
    {
        internalFormat:gl.RGBA32F,
        format:gl.RGBA,
        type:gl.FLOAT,
        minMag:gl.NEAREST}],numberOfSites, 4096)

const tf = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, bufferInfo1.attribs.a_position.buffer)
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
gl.bindBuffer(gl.ARRAY_BUFFER, null)

function main() {

    console.time('time')

    //program 1, write to intermediateTexture
    gl.useProgram(progarmInfo1.program)
    twgl.setBuffersAndAttributes(gl,progarmInfo1,bufferInfo1)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbi.framebuffer)
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TE, fbi.attachments[0], 0)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbi.attachments[0], 0)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    //set the background 'color' to -1//
    gl.clearBufferiv(gl.COLOR, 0, new Int32Array([-1,0,0,0]))
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, bufferArrays1.a_instance.data.length/3, bufferArrays1.a_position.data.length/2)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.disable(gl.DEPTH_TEST)

    //for debug 
    // gl.useProgram(debugProgInfo.program)
    // twgl.setBuffersAndAttributes(gl,debugProgInfo,bufferInfo2)
    // twgl.resizeCanvasToDisplaySize(gl.canvas)
    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    // gl.bindTexture(gl.TEXTURE_2D,fbi.attachments[0])
    // gl.drawArrays(gl.TRIANGLES, 0, 6)
    
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
    const va = gl.createVertexArray()
    gl.bindVertexArray(va)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0,1,gl.FLOAT,false,0,0)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(numberOfSites), gl.STATIC_DRAW)

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf); 
    gl.beginTransformFeedback(gl.POINTS)

    gl.bindTexture(gl.TEXTURE_2D, sumBffer.attachments[0])
    gl.drawArrays(gl.POINTS, 0, numberOfSites)

    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    
    // // // turn on using fragment shaders again
    gl.disable(gl.RASTERIZER_DISCARD)
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)


    // gl.useProgram(drawPoints.program)
    // twgl.setBuffersAndAttributes(gl,drawPoints,bufferInfo1)
    // gl.drawArrays(gl.POINTS,0,numberOfSites)
    // gl.drawArraysInstanced(gl.POINTS,0,numberOfSites,numberOfSites)



    // printResults(gl, bufferInfo1.attribs.a_position.buffer, 'v_position')

    // function printResults(gl, buffer, label) {
    //     const results = new Float32Array(numberOfSites * 2);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    //     gl.getBufferSubData(
    //         gl.ARRAY_BUFFER,
    //         0,    // byte offset into GPU buffer,
    //         results,
    //     );

    //     console.log(`${label}: ${results}`);
    // }

console.timeEnd('time')

}


main();
main()
// main()
// main()
// main()

printResults(gl, bufferInfo1.attribs.a_position.buffer, 'v_position')

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



