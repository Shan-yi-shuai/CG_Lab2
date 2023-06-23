// HelloQuad.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform vec4 u_BorderColor;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_Position = u_ModelMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_BorderColor;\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

// Rotation angle (degrees/second)
var ANGLE_STEP = 45.0;
var SCALE_STEP = 0.2;
var minScale = 0.2;
var maxScale = 1.0;


function initVertexBuffers(gl, vertices) {
    // var vertices = new Float32Array([-0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5]);
    var n = 3; // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var FSIZE = vertices.BYTES_PER_ELEMENT;

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position); // Enable the assignment of the buffer object

    // Get the storage location of a_Position, assign buffer and enable
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }

    // Assign the buffer object to a_Position variable
    // gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

// 根据vertex_pos, vertex_color, polygon获得vertices
function getAllVertices(vertex_pos, vertex_color) {
    const vertices = []
    for (let i = 0; i < vertex_pos.length; i++) {
        vertices.push({
            x: vertex_pos[i][0],
            y: vertex_pos[i][1],
            z: vertex_pos[i][2],
            color: [vertex_color[i][0] / 256, vertex_color[i][1] / 256, vertex_color[i][2] / 256]
        })
    }
    return vertices
}

function canvasToWebglCoordinates(x, y) {
    var canvasWidth = canvasSize.maxX
    var canvasHeight = canvasSize.maxY
        // Convert x, y to range -1 to 1
    var webglX = (x - canvasWidth / 2) / (canvasWidth / 2);
    var webglY = (canvasHeight / 2 - y) / (canvasHeight / 2);

    // Return WebGL coordinates as a 2-element array
    return [webglX, webglY];
}

function webglToCanvasCoordinates(webglX, webglY) {
    var canvasWidth = canvasSize.maxX
    var canvasHeight = canvasSize.maxY
    const webglWidth = 2;
    const webglHeight = 2;

    const scaleX = canvasWidth / webglWidth;
    const scaleY = canvasHeight / webglHeight;

    const x = webglX + webglWidth / 2;
    const y = -webglY + webglHeight / 2;

    const canvasScaledX = x * scaleX;
    const canvasScaledY = y * scaleY;
    return { x: canvasScaledX, y: canvasScaledY };
}

function drawTriangle(gl, vertices) {
    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl, new Float32Array(vertices.flat()));
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    // Draw the triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

}

function drawBorder(gl, vertices) {
    // Write the positions of vertices to a vertex shader
    var n = initVertexBuffers(gl, new Float32Array(vertices.flat()));
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.disableVertexAttribArray(a_Color);
    gl.vertexAttrib4f(a_Color, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.LINE_LOOP, 0, 3);
    gl.enableVertexAttribArray(a_Color);

}

function drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag) {
    // Set the rotation matrix
    modelMatrix.setRotate(currentAngle, 0, 0, 1);
    modelMatrix.scale(currentScale, currentScale, currentScale);

    // Pass the rotation matrix to the vertex shader
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // const triangle_vertices = []

    for (let i = 0; i < polygon.length; i++) {
        const vertices1 = getVertices(all_vertices, polygon, i)
        drawTriangle(gl, vertices1)

        const vertices2 = vertices1;
        vertices2[1] = vertices2[3]
        drawTriangle(gl, vertices2)

        // triangle_vertices.push(vertices1)
        // triangle_vertices.push(vertices2)
    }

    // for (let i = 0; i < triangle_vertices.length; i++) {
    //     drawBorder(gl, triangle_vertices[i], borderFlag)
    // }
    if (borderFlag) {
        for (let i = 0; i < polygon.length; i++) {
            const vertices1 = getVertices(all_vertices, polygon, i)
            drawBorder(gl, vertices1, borderFlag)

            const vertices2 = vertices1;
            vertices2[1] = vertices2[3]
            drawBorder(gl, vertices2, borderFlag)
        }
    }

    // 根据vertex_pos, vertex_color, polygon, index获得vertices
    function getVertices(all_vertices, polygon, index) {
        const vertices = []
        for (let i = 0; i < polygon[index].length; i++) {
            const j = polygon[index][i]
            const webglArray = canvasToWebglCoordinates(all_vertices[j].x, all_vertices[j].y)
            vertices.push([...webglArray, ...all_vertices[j].color])
        }
        return vertices
    }
}

function main() {
    var canvas = document.getElementById("webgl");
    canvas.width = canvasSize.maxX;
    canvas.height = canvasSize.maxY;
    var gl = getWebGLContext(canvas);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var borderFlag = true
    var rotateFlag = false

    const all_vertices = getAllVertices(vertex_pos, vertex_color)

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get storage location of u_ModelMatrix
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // 动画 ID
    var animationId

    // Current rotation angle
    var currentAngle = 0.0;
    var g_last = Date.now();
    var duration = 0;
    // Current scale
    var currentScale = maxScale; // 当前缩放比例，初始值为最大值
    // Model matrix
    var modelMatrix = new Matrix4();
    modelMatrix.setIdentity();


    drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag)

    // Start drawing
    var tick = function() {
        const current = animate(currentAngle, currentScale); // Update the rotation angle
        currentAngle = current.newAngle
        currentScale = current.newScale
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag) // Draw the triangle
        animationId = requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
    };
    // tick();


    // 定义当前拖动的顶点索引和鼠标偏移量
    let draggingVertexIndex = -1;
    let offsetX = 0;
    let offsetY = 0;

    // 绑定鼠标事件
    var mouseEventsEnabled = true;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    // 添加键盘响应
    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'T':
            case 't': // T key
                rotateFlag = !rotateFlag
                if (rotateFlag) {
                    mouseEventsEnabled = false
                    g_last = Date.now()
                    tick()
                } else {
                    mouseEventsEnabled = true
                    cancelAnimationFrame(animationId);
                    duration += Date.now() - g_last
                        // 直接修改all_vertices中的坐标，并且重置
                }
                break;
            case 'B':
            case 'b': // B key
                borderFlag = !borderFlag
                gl.clear(gl.COLOR_BUFFER_BIT);
                drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag)
                break;
            case 'E':
            case 'e': // E key
                duration = 0;
                if (rotateFlag) {
                    cancelAnimationFrame(animationId);
                }
                rotateFlag = false
                currentAngle = 0
                currentScale = maxScale
                gl.clear(gl.COLOR_BUFFER_BIT);
                drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag)
                break;
            default:
        }
    });

    // 将鼠标的位置映射到没有旋转没有放缩的坐标系中
    function coordinateMapping(x, y, angle, scale) {
        // 反转旋转矩阵和缩放矩阵
        var cosBeta = Math.cos(angle * (Math.PI / 180));
        var sinBeta = Math.sin(angle * (Math.PI / 180));
        // 平移回初始位置
        var _x = x * cosBeta + y * sinBeta;
        var _y = x * -sinBeta + y * cosBeta;
        return { x: _x * 1 / scale, y: _y * 1 / scale }
    }

    // 处理鼠标按下事件
    function handleMouseDown(event) {
        if (!mouseEventsEnabled) return;
        // canvas to webgl
        const webglCoordinates = canvasToWebglCoordinates(event.offsetX, event.offsetY);
        // 根据current angle 和 current scale反推原本的坐标
        const originalWebglCoordinates = coordinateMapping(webglCoordinates[0], webglCoordinates[1], currentAngle, currentScale);
        // 将原本的webgl坐标映射回canvas
        const _event = webglToCanvasCoordinates(originalWebglCoordinates.x, originalWebglCoordinates.y)

        // 遍历顶点，检查鼠标是否在顶点附近
        for (let i = 0; i < all_vertices.length; i++) {
            const vertex = all_vertices[i];
            const distance = Math.sqrt(
                Math.pow(vertex.x - _event.x, 2) + Math.pow(vertex.y - _event.y, 2)
            );
            if (distance < 10) {
                draggingVertexIndex = i;
                offsetX = vertex.x - _event.x;
                offsetY = vertex.y - _event.y;
                break;
            }
        }
    }

    // 处理鼠标移动事件
    function handleMouseMove(event) {
        if (!mouseEventsEnabled) return;
        // canvas to webgl
        const webglCoordinates = canvasToWebglCoordinates(event.offsetX, event.offsetY);
        // 根据current angle 和 current scale反推原本的坐标
        const originalWebglCoordinates = coordinateMapping(webglCoordinates[0], webglCoordinates[1], currentAngle, currentScale);
        // 将原本的webgl坐标映射回canvas
        const _event = webglToCanvasCoordinates(originalWebglCoordinates.x, originalWebglCoordinates.y, gl)

        if (draggingVertexIndex !== -1) {
            all_vertices[draggingVertexIndex].x = _event.x + offsetX;
            all_vertices[draggingVertexIndex].y = _event.y + offsetY;

            gl.clear(gl.COLOR_BUFFER_BIT);

            drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag)
        }
    }

    // 处理鼠标松开事件
    function handleMouseUp(event) {
        if (!mouseEventsEnabled) return;
        draggingVertexIndex = -1;
    }


    function animate(angle, scale) {
        // Calculate the elapsed time
        var now = Date.now();
        var elapsed = now - g_last + duration;
        // g_last = now;
        // Update the current rotation angle (adjusted by the elapsed time)
        var newAngle = ((ANGLE_STEP * elapsed) / 1000.0) % 360;
        var newScale;
        var cycleTime = 2 * (maxScale - minScale) / SCALE_STEP;
        var cycleElapsed = (elapsed / 1000.0) % cycleTime;
        if (cycleElapsed < cycleTime / 2) {
            newScale = 1 - (cycleElapsed / (cycleTime / 2)) * (maxScale - minScale);
        } else {
            newScale = minScale + ((cycleElapsed - cycleTime / 2) / (cycleTime / 2)) * (maxScale - minScale);
        }
        return { newAngle, newScale };
    }
}