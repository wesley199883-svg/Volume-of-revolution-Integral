// 将 three.module.js + OrbitControls.js 合并为无模块语法的经典脚本 bundle.js
// 目的：摆脱 CDN 依赖与 ES module 的 file:// CORS 限制，双击即可离线运行
const fs = require('fs');
const path = require('path');
const dir = __dirname;

let three = fs.readFileSync(path.join(dir, 'libs/three.module.js'), 'utf8');
let oc = fs.readFileSync(path.join(dir, 'libs/OrbitControls.js'), 'utf8');

// 1) 摘出 three.module.js 末尾的 export 块，收集全部导出名
const idx = three.lastIndexOf('export {');
if (idx < 0) throw new Error('three.module.js 中未找到 export 块');
const exportBlock = three.slice(idx);
three = three.slice(0, idx);
const m = exportBlock.match(/export\s*\{([\s\S]*?)\};/);
if (!m) throw new Error('export 块解析失败');
const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
const alias = names.map(n => {
  const mm = n.match(/^(\S+)\s+as\s+(\S+)$/);
  return mm ? JSON.stringify(mm[2]) + ': ' + mm[1] : JSON.stringify(n) + ': ' + n;
}).join(',\n');

// 2) 去掉 OrbitControls 的 import 块与 export 行
oc = oc.replace(/^import\s*\{[\s\S]*?\}\s*from\s*'three';\s*/, '');
oc = oc.replace(/export\s*\{\s*OrbitControls\s*\};?/, '');

// 3) 合并：严格模式 + three + OrbitControls(包进 IIFE 避免顶层命名冲突) + THREE 命名空间别名
const bundle =
  "'use strict';\n" +
  "/* Three.js r160 + OrbitControls 本地合并包（自动生成，勿手改；来源 build-bundle.js）*/\n" +
  three + '\n' +
  'const OrbitControls = (function () {\n' +
  oc + '\n' +
  'return OrbitControls;\n' +
  '})();\n' +
  'const THREE = {\n' + alias + '\n};\n';

fs.writeFileSync(path.join(dir, 'bundle.js'), bundle);
console.log('bundle.js 写入成功, 大小 =', bundle.length, '字节, 导出名 =', names.length, '个');
