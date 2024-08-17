import './style.css';
import cellShaderSrc from './cell.wgsl?raw';

const GRID_SIZE = 32;

// -----------------------------------
// ------- Creating the canvas -------
// -----------------------------------
const width = 512;
const height = 512;
const canvas = document.createElement('canvas');

canvas.width = width;
canvas.height = height;
document.body.appendChild(canvas);

// -----------------------------------
// -------- Setting up WebGPU --------
// -----------------------------------
const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;

if (!adapter) throw new Error('No appropriate GPUAdapter found.');

const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();

if (!context) throw new Error('Could not get the WebGPU context.');
context.configure({ device, format });

const vertices = new Float32Array([
  //   X,    Y,
    -0.8, -0.8, // Triangle 1 (Blue)
     0.8, -0.8,
     0.8,  0.8,
  
    -0.8, -0.8, // Triangle 2 (Red)
     0.8,  0.8,
    -0.8,  0.8,
]);

const vertexBuffer = device.createBuffer({
  label: 'Cell vertices',
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(vertexBuffer, 0, vertices);

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [
    {
      format: 'float32x2',
      offset: 0,
      shaderLocation: 0
    }
  ]
};

const cellShaderModule = device.createShaderModule({
  label: 'Cell shader',
  code: cellShaderSrc
});

const cellPipeline = device.createRenderPipeline({
  label: 'Cell pipeline',
  layout: 'auto',
  vertex: {
    module: cellShaderModule,
    entryPoint: 'vertexMain',
    buffers: [vertexBufferLayout]
  },
  fragment: {
    module: cellShaderModule,
    entryPoint: 'fragmentMain',
    targets: [{ format }]
  }
});

const gridSizeUA = new Float32Array([GRID_SIZE, GRID_SIZE]);
const gridSizeUB = device.createBuffer({
  label: 'Grid Uniforms',
  size: gridSizeUA.byteLength,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

device.queue.writeBuffer(gridSizeUB, 0, gridSizeUA);

const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
const cellStateStorage = device.createBuffer({
  label: 'Cell State',
  size: cellStateArray.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
});

for (let i = 0; i < cellStateArray.length; i += 3) {
  cellStateArray[i] = 1;
}

device.queue.writeBuffer(cellStateStorage, 0, cellStateArray);

const bindGroup = device.createBindGroup({
  label: 'Cell renderer bind group',
  layout: cellPipeline.getBindGroupLayout(0),
  entries: [
    {
      binding: 0,
      resource: { buffer: gridSizeUB }
    },
    {
      binding: 1,
      resource: { buffer: cellStateStorage }
    }
  ]
});

const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [
    {
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      storeOp: 'store'
    }
  ]
});

pass.setPipeline(cellPipeline);
pass.setVertexBuffer(0, vertexBuffer);
pass.setBindGroup(0, bindGroup);
pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

pass.end();
device.queue.submit([encoder.finish()]);