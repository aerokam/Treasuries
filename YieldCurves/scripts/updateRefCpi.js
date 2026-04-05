import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  try {
    console.log("Step 1: Fetching CPI from BLS...");
    execSync(`node "${path.join(__dirname, 'fetchCpiBls.js')}"`, { stdio: 'inherit' });
    
    console.log("\nStep 2: Calculating daily Reference CPI...");
    execSync(`node "${path.join(__dirname, 'calcRefCpi.js')}"`, { stdio: 'inherit' });
    
    console.log("\nStep 3: Refreshing SA/SAO Yields...");
    execSync(`node "${path.join(__dirname, 'updateSaSaoYields.js')}"`, { stdio: 'inherit' });
    
    console.log("\nUpdate complete.");
  } catch (error) {
    console.error("\nUpdate failed:", error.message);
    process.exit(1);
  }
}

main();
