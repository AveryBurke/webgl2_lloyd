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

void main() {
	v_texCoord = a_texCoord.xy;
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

function createShader(gl, type, source) {
    let shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
}

function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    return program
}

function createEmptyTexture(gl, targetTextureWidth, targetTextureHeight, mipLevel) {
    let texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, mipLevel, gl.RGB,
        targetTextureWidth, targetTextureHeight, 0,
        gl.RGB, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    return texture
}

function main() {
    // const canvas = document.querySelector("canvas"),
    // gl = canvas.getContext("webgl2")
    //     if (!gl) {
    //     return
    // }
    const vertexShader1 = createShader(gl, gl.VERTEX_SHADER, vs1),
        fragmentShader1 = createShader(gl, gl.FRAGMENT_SHADER, fs1),

        vertexShader2 = createShader(gl, gl.VERTEX_SHADER, vs2),
        fragmentShader2 = createShader(gl, gl.FRAGMENT_SHADER, fs2),

        program1 = createProgram(gl, vertexShader1, fragmentShader1),
        program2 = createProgram(gl, vertexShader2, fragmentShader2),

        positionAttributeLocation = gl.getAttribLocation(program1, "a_position"),
        texturePositionAttributeLocation = gl.getAttribLocation(program2, "a_texCoord"),

        positionBuffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, .5, 0, 0, 1, .5]), gl.STATIC_DRAW)

    const vao1 = gl.createVertexArray()

    gl.bindVertexArray(vao1)
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    const mipLevel = 0

    // program1 draws to fbo1 backed by intermediateTexture at color attachment 0

    gl.useProgram(program1)
    gl.bindVertexArray(vao1)

    const fbo1 = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1)
    const intermediateTexture = createEmptyTexture(gl, gl.canvas.width, gl.canvas.height, mipLevel)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, intermediateTexture, mipLevel)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null) // Is this the problem?

    // program2 is supposed to draw to fbo2 backed by new texture at color attachment 0

    gl.useProgram(program2)

    const vao2 = gl.createVertexArray()
    gl.bindVertexArray(vao2)
    gl.enableVertexAttribArray(texturePositionAttributeLocation)
    gl.vertexAttribPointer(texturePositionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(vao2)

    const quad = [-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    const fbo2 = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
    const targetTexture = createEmptyTexture(gl, gl.canvas.width, gl.canvas.height, mipLevel)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, mipLevel)

    gl.bindTexture(gl.TEXTURE_2D, intermediateTexture)

    gl.drawArrays(gl.TRIANGLES, 0, 6) // error: glDrawArrays: Source and destination textures of the draw are the same
}

main();
