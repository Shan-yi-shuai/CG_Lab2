# CG_Lab2
# 1 项目目录

- lib
- config.js
- pj2.html
- pj2.js
# 2 开发及运行环境
Chrome

# 3 运行及使用方法
点击pj2.html文件即可

# 4 项目中的亮点

1. 实现了在动画暂停阶段对图形的编辑（7.1.4）
2. 将所有的初始化操作都抽取出来，保证只执行一遍，从而加快渲染速度

# 5 开发过程中遇到的问题（以及你的解决办法）
问题：示例中的边框在任何情况下都会显示，不会被三角形遮挡（7.1.3）
解决方案：先把所有的三角形画完，然后再画所有的边框

# 6 项目仍然或者可能存在的缺陷（以及你的思考）
因为我把三角形和边框分开画了（7.1.3），导致渲染速度变慢，在拖动的时候有一点点卡顿。当关闭边框显示的时候，拖动非常的丝滑。

# 7 具体功能实现
## 1.1四边形网格绘制及颜色填充
根据config中的配置，将每个四边形分为两个三角形
因为点的顺序为顺时针，所以需要手动调整点的顺序
```
for (let i = 0; i < polygon.length; i++) {
        const vertices1 = getVertices(all_vertices, polygon, i)
        drawTriangle(gl, vertices1, borderFlag)

        const vertices2 = vertices1;
        vertices2[1] = vertices2[3]
        drawTriangle(gl, vertices2, borderFlag)
    }
```

绘制三角形使用
`gl.drawArrays(gl.TRIANGLES, 0, 3);`

## 1.2颜色渐变
学习_**ColoredTriangle.js**_中的代码，需要修改initVertexBuffers中的内容和传入initVertexBuffers的参数结构
```
// 参数结构
var verticesColors = new Float32Array([
    // Vertex coordinates and color
     0.0,  0.5,  1.0,  0.0,  0.0, 
    -0.5, -0.5,  0.0,  1.0,  0.0, 
     0.5, -0.5,  0.0,  0.0,  1.0, 
  ]);
// initVertexBuffers内容修改
var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object
```
## 1.4边框绘制
采取和三角形分开画的策略，目的是为了让边框处于图层的最上面，以保证不会被三角形遮挡
```
var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
        if (a_Color < 0) {
            console.log('Failed to get the storage location of a_Color');
            return -1;
        }
        gl.disableVertexAttribArray(a_Color);
        gl.vertexAttrib4f(a_Color, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.LINE_LOOP, 0, 3);
        gl.enableVertexAttribArray(a_Color);
```
键盘事件代码如下
```
 case 'B':
case 'b': // B key
    borderFlag = !borderFlag
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawTriangles(gl, all_vertices, polygon, currentAngle, currentScale, u_ModelMatrix, modelMatrix, borderFlag)
    break;
```

## 1.3拖动顶点位置
基本方式和PJ1的方法相同，但是有一些区别！
**因为四边形的旋转和缩放不会修改原本的坐标，所以如果要使用原本的逻辑，需要把鼠标的位置映射回没有旋转且没有缩放的坐标系中，所以我增加了如下代码，以实现动画暂停的时候的编辑功能**
**步骤如下：**

1. **将鼠标位置从canvas坐标系映射到webgl坐标系**
2. **根据current angle 和 current scale反推原本的坐标**
3. **将webgl坐标重新映射回canvas坐标**
```
// canvas to webgl
const webglCoordinates = canvasToWebglCoordinates(event.offsetX, event.offsetY);
// 根据current angle 和 current scale反推原本的坐标
const originalWebglCoordinates = coordinateMapping(webglCoordinates[0], webglCoordinates[1], currentAngle, currentScale);
// 将原本的webgl坐标映射回canvas
const _event = webglToCanvasCoordinates(originalWebglCoordinates.x, originalWebglCoordinates.y)
```

## 1.5模型变换与简单动画
根据要求编写角度和缩放比例大小的获取函数，我使用一个变量记录动画播放的时长，当动画暂停时则停止增加动画播放时长。根据总的播放时长可以知道当前的角度和缩放比例
```
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
```

通过修改矩阵来控制图形的旋转和缩放
```
// Set the rotation matrix
modelMatrix.setRotate(currentAngle, 0, 0, 1);
modelMatrix.scale(currentScale, currentScale, currentScale);

// Pass the rotation matrix to the vertex shader
gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
```
考虑到动画状态下不能进行编辑，使用mouseEventsEnabled来控制
`if (!mouseEventsEnabled) return;`
## 1.6编辑状态与动画状态的切换
使用如下监听函数来实现编辑状态和动画状态的切换
```
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
```

