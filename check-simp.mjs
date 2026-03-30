import fs from 'fs';
import path from 'path';
import * as OpenCC from 'opencc-js';

const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.match(/\.(ts|tsx|js|jsx|json|md)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
let changedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const converted = converter(content);
  if (content !== converted) {
    fs.writeFileSync(file, converted, 'utf8');
    console.log(`Converted: ${file}`);
    changedFiles++;
  }
});

console.log(`Total files changed: ${changedFiles}`);
