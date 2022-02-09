import * as twgl from "twgl.js";
import randomPizza from "./randomPizza";


const voroni_vertex_shader_source = `#version 300 es

in vec2 a_position;
in vec3 a_instance;
flat out int v_ID;
void main() {
    v_ID = gl_InstanceID;
    gl_Position = vec4(a_instance.xy + a_position.xy * 2.0 - 1.0, a_instance.z, 1);
}
`

const voroni_fragment_shader_srouce = `#version 300 es

precision highp float;

flat in int v_ID; 
out ivec4 outColor;

void main() {
    outColor.r = v_ID;   
}
`

const sum_vertex_shader_source = `#version 300 es

in vec2 a_texCoord;

void main() {
    gl_Position = vec4(a_texCoord, 1, 1);
}`

const sum_fragment_shader_source = `#version 300 es
precision highp float;

uniform mediump isampler2D voroni;

out vec4 color;

void main() {
    ivec2 tex_size = textureSize(voroni, 0);
    int my_index = int(gl_FragCoord.x);

    float xSum = 0.0;
    int count = 0;
    float yCoord = gl_FragCoord.y;
    for (int x = 0; x < tex_size.x; x++) {
        ivec4 t = texelFetch(voroni, ivec2(x, gl_FragCoord.y), 0);
        if (t.r == my_index) {
            xSum += float(x) + 0.5f;//<--why does this need to be corrected for .5 ?
            count += 1;
        }
    }
    float ySum = float(count) * yCoord;
    color = vec4(xSum / float(tex_size.x), ySum / float(tex_size.y), float(count), 1.0);
}
`

const feedback_source = `#version 300 es

in vec2 a_origins;

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
    //if the sum shader wasn't able to locate the cell,
    //put the seed back into the buffer
    if (count == 0.0){
        a_position = a_origins;
    }
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
    if (c.r == -1.0){
        color = vec4(.01, .9, 0, 1);
    } else {
        color.r = fract((c.r + 1.0) * 1.7777777);
        color.g = fract((c.g + 1.0) * 2.1212121);
        color.b = fract((c.b + 1.0) * 13.987654);
        color.w = 1.0;
    }
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
    color = vec4(.0, .8, 0, 1);
}
`

const textureWidth = 324
const textureHeight = 324

const display:HTMLCanvasElement = document.querySelector('#display')

display.width = textureWidth
display.height = textureHeight

const gl = display.getContext('webgl2')

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


const numberOfSites = 1000

const slices = 'ABCDEFGHIJKLMN'
const rings = 'OPQRSTUVWXYZ'

const pizza = randomPizza(numberOfSites,slices,rings,8,8)
const boarders = pizza.reduce<number[]>((normalizedPoints,arc)=> {
    const {boarder} = arc
    const normalziedBoarder = boarder.reduce<number[]>((norm, pair) => [...norm,(pair[0]/1000) + .5, (pair[1]/1000) + .5],[])
    return [...normalizedPoints,...normalziedBoarder]
},[])

const nucleui = pizza.reduce<number[]>((nucleui,arc) => [...nucleui,...arc.nucleus],[])

function GPUVoroni(gl:WebGL2RenderingContext,nuclei:number[],boarder:[]) {
    
}
const points = [...nucleui,...boarders]

const quad = new Float32Array([-
    1,-1, 1,-1, -1,1,
    1,-1, 1,1, -1,1
]);

const voroniBufferArrays = {
    a_position:{
        numComponents:2,
        divisor: 1,
        data: points,
        drawType:gl.DYNAMIC_DRAW
    },
    a_instance:{
        numComponents:3,
        data:createCone(36)
    }
}

const sumBufferArrays = {
    a_texCoord:{
        numComponents:2,
        data: quad,
    }
}

const originsArray = {
    a_origins:{
        numComponents:2,
        data: new Float32Array([...nucleui]),
    }
}

const boarderBufferArray = {
    a_position:{
        numComponents:2,
        data:points
    }
}

const voroniProgramInfo = twgl.createProgramInfo(gl, [voroni_vertex_shader_source,voroni_fragment_shader_srouce])
const summationProgramInfo = twgl.createProgramInfo(gl, [sum_vertex_shader_source,sum_fragment_shader_source])
const debugProgInfo = twgl.createProgramInfo(gl, [sum_vertex_shader_source,debug_frag_shader])
const drawPoints = twgl.createProgramInfo(gl, [pointVertexShader,pointFragShader])
const feedbackProgramInfo = twgl.createProgramInfo(gl, [feedback_source,feedback_fragment_shader], {transformFeedbackVaryings:["a_position"]})
const voroniBufferInfo = twgl.createBufferInfoFromArrays(gl, voroniBufferArrays)
const sumBufferInfo = twgl.createBufferInfoFromArrays(gl, sumBufferArrays)
const originsBufferInfor = twgl.createBufferInfoFromArrays(gl,originsArray)
const boarderBufferInfo = twgl.createBufferInfoFromArrays(gl,boarderBufferArray)

const vaoInfo = twgl.createVertexArrayInfo(gl,feedbackProgramInfo,originsBufferInfor)

const voroniFrameBuffer = twgl.createFramebufferInfo(gl,[
    //store only integer and only on the values on the red channel
    {internalFormat: gl.R32I, format: gl.RED_INTEGER, type:gl.INT, minMag: gl.NEAREST,},
    {attachmentPoint:gl.DEPTH_ATTACHMENT, internalFormat:gl.DEPTH_COMPONENT24,format:gl.DEPTH_COMPONENT},
  ], textureWidth, textureHeight);

const sumFrameBffer = twgl.createFramebufferInfo(gl,[
    //store floating point vec4 values
    {
        internalFormat:gl.RGBA32F,
        format:gl.RGBA,
        type:gl.FLOAT,
        minMag:gl.NEAREST}],numberOfSites, textureHeight)

const tf = gl.createTransformFeedback()
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
//bind hte voroni buffer to the transfrom feedback object
//the feedback program will write to this buffer
gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, voroniBufferInfo.attribs.a_position.buffer)
gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
gl.bindBuffer(gl.ARRAY_BUFFER, null)


function main() {
    //program 1, write to voroni diagram to the integer texeture
    gl.useProgram(voroniProgramInfo.program)
    twgl.setBuffersAndAttributes(gl,voroniProgramInfo,voroniBufferInfo)
    gl.bindFramebuffer(gl.FRAMEBUFFER, voroniFrameBuffer.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, voroniFrameBuffer.attachments[0], 0)
    // twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, textureWidth, textureHeight)
    // console.log('gl canvas: ', gl.canvas.width)
    //set the background 'color' to -1//
    gl.clearBufferiv(gl.COLOR, 0, new Int32Array([-1,0,0,0]))
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1)
    gl.clear(gl.DEPTH_BUFFER_BIT)
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, voroniBufferArrays.a_instance.data.length/3, voroniBufferArrays.a_position.data.length/2)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.disable(gl.DEPTH_TEST)
    
    //progam2, read from the integer textrue and write to the sum texture (floating point textrue)
    gl.useProgram(summationProgramInfo.program)
    twgl.setBuffersAndAttributes(gl,summationProgramInfo,sumBufferInfo)
    // twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, numberOfSites, textureHeight)
    gl.bindFramebuffer(gl.FRAMEBUFFER, sumFrameBffer.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sumFrameBffer.attachments[0], 0)
    gl.bindTexture(gl.TEXTURE_2D, voroniFrameBuffer.attachments[0])
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindFramebuffer(gl.FRAMEBUFFER,null)
    gl.bindBuffer(gl.ARRAY_BUFFER,null)

    //program 3, read from the sum textrue and use transfrom feedback to write to the buffer for the voroni program
    gl.useProgram(feedbackProgramInfo.program)
    twgl.setBuffersAndAttributes(gl,feedbackProgramInfo,vaoInfo)

    gl.enable(gl.RASTERIZER_DISCARD);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf); 
    gl.beginTransformFeedback(gl.POINTS)

    gl.bindTexture(gl.TEXTURE_2D, sumFrameBffer.attachments[0])
    gl.drawArrays(gl.POINTS, 0, numberOfSites)
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindVertexArray(null)
    //turn on using fragment shaders again
    gl.disable(gl.RASTERIZER_DISCARD)
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

}

// console.time('loop')
const numberOfSetps = 100
document.querySelector('button').addEventListener('click',function () {
    for (let i = 0; i < numberOfSetps; i++) {
        main()
    }
    step(gl, voroniBufferInfo.attribs.a_position.buffer, 'v_position')
    let current = +this.innerText
    this.innerText = `${numberOfSetps + current}`
})

function drawBoarder() {
    console.log('drawing points')
    gl.useProgram(drawPoints.program)
    twgl.setBuffersAndAttributes(gl,drawPoints,boarderBufferInfo)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height)
    gl.bindTexture(gl.TEXTURE_2D,null)
    gl.bindFramebuffer(gl.FRAMEBUFFER,null)
    gl.drawArrays(gl.POINTS,0,boarderBufferArray.a_position.data.length/2)
    gl.bindBuffer(gl.ARRAY_BUFFER,null)
}

drawBoarder()    
// console.timeEnd('loop')


function debugRender() {
    gl.useProgram(debugProgInfo.program)
    twgl.setBuffersAndAttributes(gl,debugProgInfo,sumBufferInfo)
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, textureWidth, textureHeight)
    gl.bindTexture(gl.TEXTURE_2D,voroniFrameBuffer.attachments[0])
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    gl.bindBuffer(gl.ARRAY_BUFFER,null)
    gl.bindTexture(gl.TEXTURE_2D,null)

    // gl.useProgram(drawPoints.program)
    // twgl.setBuffersAndAttributes(gl,drawPoints,voroniBufferInfo)
    // gl.bindFramebuffer(gl.FRAMEBUFFER,null)
    // gl.clearDepth(1)
    // gl.clear(gl.DEPTH_BUFFER_BIT)
    // gl.drawArrays(gl.POINTS, 0, numberOfSites)
    // // gl.drawArraysInstanced(gl.POINTS, 0, voroniBufferArrays.a_position.data.length/3, numberOfSites)
    // gl.bindBuffer(gl.ARRAY_BUFFER,null)
}


function printResults(gl:WebGL2RenderingContext, buffer, label) {
    const results = new Float32Array(numberOfSites * 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.getBufferSubData(
        gl.ARRAY_BUFFER,
        0,    // byte offset into GPU buffer,
        results,
    )
    console.log('there are this many results: ', results.length)
    const numberOfNans = results.filter(n => Number.isNaN(n)).length
    console.log("this many nans: ", numberOfNans)
    console.log('and this many missing points: ', numberOfNans/2)
    console.log(`${label}: ${results}`);
    gl.bindBuffer(gl.ARRAY_BUFFER,null)
}

function step(gl:WebGL2RenderingContext, buffer, label) {
    printResults(gl, buffer, label)
    debugRender()
}

