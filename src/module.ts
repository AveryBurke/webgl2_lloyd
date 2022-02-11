import * as twgl from "twgl.js";
type UpdateHandler = () => void
type Subscriber = (data:any) => void

function vornoiModual():typeof mod {
    let  nuclei:number[],
        boarder:number[],
        //for best preformance the voroni texture should be a perfect square
        textureWidth = 342,
        textureHeight = 342,
        numberOfCycles = 100,
        subscribers:Subscriber[] = [],

        render:UpdateHandler,
        updateNuclei:UpdateHandler,
        updateBoarder:UpdateHandler,
        updateTextureWidth:UpdateHandler,
        updateTextureHeight:UpdateHandler

    function mod() {
        //shader source
        const voroni_vertex_shader_source = `#version 300 es

            in vec2 a_position;
            in vec3 a_instance;
            flat out int v_ID;
            void main() {
                v_ID = gl_InstanceID;
                gl_Position = vec4(a_instance.xy + a_position.xy * 2.0 - 1.0, a_instance.z, 1);
            }`,

        voroni_fragment_shader_srouce = `#version 300 es

            precision highp float;

            flat in int v_ID; 
            out ivec4 outColor;

            void main() {
                outColor.r = v_ID;   
            }`,

        sum_vertex_shader_source = `#version 300 es

            in vec2 a_texCoord;

            void main() {
                gl_Position = vec4(a_texCoord, 1, 1);
            }`,

        sum_fragment_shader_source = `#version 300 es
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
            }`,

        feedback_source = `#version 300 es

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
            }`,

        feedback_fragment_shader = `#version 300 es
            precision highp float;

            void main() {
            discard;
            }`,

        gl = document.createElement('canvas').getContext('webgl2'),
            quad = new Float32Array([-
            1,-1, 1,-1, -1,1,
            1,-1, 1,1, -1,1
        ])

        if (!gl.getExtension("EXT_color_buffer_float")){
            alert('no extention!!!')
        }

        let numberOfSites = nuclei.length/2,

        //buffer arrays
        voroniBufferArrays = {
            a_position:{
                numComponents:2,
                divisor: 1,
                data: [...nuclei,...boarder],
                drawType:gl.DYNAMIC_DRAW
            },
            a_instance:{
                numComponents:3,
                data:createCone(36)
            }
        },
        
        sumBufferArrays = {
            a_texCoord:{
                numComponents:2,
                data: quad,
            }
        },
        //keep the origins in a seperate buffer,
        //if the sum shader wasn't able to find a site,
        //then the feedback source program will pull the origin point from this buffer
        //and re-insert the missing site back at its origin point
        originsArray = {
            a_origins:{
                numComponents:2,
                data: new Float32Array([...nuclei]),
            }
        },
       
        //inilize the gl state machine
        voroniProgramInfo = twgl.createProgramInfo(gl, [voroni_vertex_shader_source,voroni_fragment_shader_srouce]),
        summationProgramInfo = twgl.createProgramInfo(gl, [sum_vertex_shader_source,sum_fragment_shader_source]),
        feedbackProgramInfo = twgl.createProgramInfo(gl, [feedback_source,feedback_fragment_shader], {transformFeedbackVaryings:["a_position"]}),
        voroniBufferInfo = twgl.createBufferInfoFromArrays(gl, voroniBufferArrays),
        sumBufferInfo = twgl.createBufferInfoFromArrays(gl, sumBufferArrays),
        originsBufferInfor = twgl.createBufferInfoFromArrays(gl,originsArray),

        vaoInfo = twgl.createVertexArrayInfo(gl,feedbackProgramInfo,originsBufferInfor),

        voroniFrameBuffer = twgl.createFramebufferInfo(gl,[
            //store only integer and only on the values on the red channel
            {internalFormat: gl.R32I, format: gl.RED_INTEGER, type:gl.INT, minMag: gl.NEAREST,},
            {attachmentPoint:gl.DEPTH_ATTACHMENT, internalFormat:gl.DEPTH_COMPONENT24,format:gl.DEPTH_COMPONENT},
        ], textureWidth, textureHeight),

        sumFrameBufferInfo = twgl.createFramebufferInfo(gl,[
            //store floating point vec4 values
            {
                internalFormat:gl.RGBA32F,
                format:gl.RGBA,
                type:gl.FLOAT,
                minMag:gl.NEAREST}],numberOfSites, textureHeight),

        tf = gl.createTransformFeedback()
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf)
        //bind hte voroni buffer to the transfrom feedback object
        //the feedback program will write to this buffer
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, voroniBufferInfo.attribs.a_position.buffer)
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        //update hanlders
        updateNuclei = function(){
            console.log('updating nuclei')
            //note: I might need to create new buffer info
            //but I'm not sure. If something doesn't right, it might be this
            voroniBufferArrays.a_position.data = [...nuclei,...boarder]
            originsArray.a_origins.data = new Float32Array([...nuclei])
            numberOfSites = nuclei.length/2
            if (nuclei.length !== numberOfSites){
                //this must take some overhead, right?
                gl.deleteTexture(sumFrameBufferInfo.attachments[0])
                gl.deleteFramebuffer(sumFrameBufferInfo.framebuffer)

                sumFrameBufferInfo = twgl.createFramebufferInfo(gl,[
                    //store floating point vec4 values
                    {
                        internalFormat:gl.RGBA32F,
                        format:gl.RGBA,
                        type:gl.FLOAT,
                        minMag:gl.NEAREST}],numberOfSites, textureHeight)
                
                
            }
        }

        updateBoarder = function() {
            voroniBufferArrays.a_position.data = [...nuclei,...boarder]
        }

        updateTextureWidth = function () {
            console.log('new textrue width: ', textureWidth)
        }
        updateTextureHeight = function () {
            console.log('new texture height: ', textureHeight)
        }

        render = function () {
            for (let i= 0; i < numberOfCycles; i++) {
                renderCycle()
            }
            updateSubscribers()
        }

        //helper funcitons
        function renderCycle() {
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
            twgl.resizeCanvasToDisplaySize(gl.canvas)
            gl.viewport(0, 0, numberOfSites, textureHeight)
            gl.bindFramebuffer(gl.FRAMEBUFFER, sumFrameBufferInfo.framebuffer)
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sumFrameBufferInfo.attachments[0], 0)
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
            gl.bindTexture(gl.TEXTURE_2D, sumFrameBufferInfo.attachments[0])
            gl.drawArrays(gl.POINTS, 0, numberOfSites)
            gl.endTransformFeedback();
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
            gl.bindVertexArray(null)
            //turn on using fragment shaders again
            gl.disable(gl.RASTERIZER_DISCARD)
            gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null)
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
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

        function updateSubscribers() {
            const results = new Float32Array(numberOfSites * 2);
            gl.bindBuffer(gl.ARRAY_BUFFER, voroniBufferInfo.attribs.a_position.buffer,);
            gl.getBufferSubData(
                gl.ARRAY_BUFFER,
                0,    // byte offset into GPU buffer,
                results,
            )
            subscribers.forEach(subscriber => subscriber(results))
            gl.bindBuffer(gl.ARRAY_BUFFER,null)
        }

    }

    mod.numberOfCycles = function (value:number) {
        numberOfCycles = value
        return mod
    }

    mod.nuclei = function (value:number[]):typeof mod {
        nuclei = value
        if (typeof updateNuclei === 'function') updateNuclei()
        return mod
    }
    mod.boarder = function (value:number[]):typeof mod {
        boarder = value
        if (typeof updateBoarder === 'function') updateBoarder()
        return mod
    }
    mod.textureWidth = function (value:number):typeof mod {
        textureWidth = value
        if (typeof updateTextureWidth === 'function') updateTextureWidth()
        return mod
    }
    mod.textureHeight = function (value:number):typeof mod {
        textureHeight = value
        if (typeof updateTextureHeight === 'function') updateTextureHeight()
        return mod
    }
    mod.render = function ():typeof mod {
        if (typeof render === 'function') render()
        return mod
    }

    mod.subscribe = function (value:Subscriber) {
        subscribers = [...subscribers,value]
        return mod
    }

    return mod
}

export default vornoiModual