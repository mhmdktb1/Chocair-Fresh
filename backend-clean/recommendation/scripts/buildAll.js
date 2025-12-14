/**
 * ==========================================
 * BUILD ALL KNOWLEDGE MAPS
 * ==========================================
 * 
 * Convenience script to build all knowledge maps at once
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building all recommendation knowledge maps...\n');

// Run buildProductAssociations.js
const associationsScript = path.join(__dirname, 'buildProductAssociations.js');
const popularityScript = path.join(__dirname, 'buildProductPopularity.js');

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit'
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

async function buildAll() {
  try {
    console.log('Step 1/2: Building Product Associations...');
    await runScript(associationsScript);
    
    console.log('\nStep 2/2: Building Product Popularity...');
    await runScript(popularityScript);
    
    console.log('\n✅ All knowledge maps built successfully!\n');
    console.log('You can now use the recommendation API.\n');
    
  } catch (error) {
    console.error('\n❌ Error building knowledge maps:', error.message);
    process.exit(1);
  }
}

buildAll();
