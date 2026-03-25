const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./app', (filePath) => {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix route handlers
  if (filePath.includes('route.ts')) {
    if (content.includes('params: { id: string }')) {
      content = content.replace(/params: \{ id: string \}/g, 'params: Promise<{ id: string }>');
      // We also need to await params.id
      // Replace params.id with (await params).id
      content = content.replace(/params\.id/g, '(await params).id');
      changed = true;
    }
  }

  // Fix page components
  if (filePath.includes('page.tsx')) {
    if (content.includes('params: { id: string }')) {
      content = content.replace(/params: \{ id: string \}/g, 'params: Promise<{ id: string }>');
      
      if (content.includes('"use client"')) {
        // Client component
        if (!content.includes('import { use } from "react"')) {
          if (content.includes('import { useState')) {
            content = content.replace('import { useState', 'import { use, useState');
          } else if (content.includes('import { useEffect')) {
            content = content.replace('import { useEffect', 'import { use, useEffect');
          } else {
            content = 'import { use } from "react";\n' + content;
          }
        }
        
        // Find the component function
        const funcMatch = content.match(/export default function \w+\(\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*id:\s*string\s*\}>\s*\}\)\s*\{/);
        if (funcMatch) {
          const insertIndex = funcMatch.index + funcMatch[0].length;
          content = content.slice(0, insertIndex) + '\n  const resolvedParams = use(params);\n' + content.slice(insertIndex);
          content = content.replace(/params\.id/g, 'resolvedParams.id');
        }
      } else {
        // Server component
        // Just await params
        const funcMatch = content.match(/export default async function \w+\(\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*id:\s*string\s*\}>\s*\}\)\s*\{/);
        if (!funcMatch) {
            // make it async if it's not
            content = content.replace(/export default function/, 'export default async function');
        }
        
        const funcMatch2 = content.match(/export default async function \w+\(\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*id:\s*string\s*\}>\s*\}\)\s*\{/);
        if (funcMatch2) {
            const insertIndex = funcMatch2.index + funcMatch2[0].length;
            content = content.slice(0, insertIndex) + '\n  const resolvedParams = await params;\n' + content.slice(insertIndex);
            content = content.replace(/params\.id/g, 'resolvedParams.id');
        }
      }
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${filePath}`);
  }
});
