import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Script is running!');
console.log('Current directory:', __dirname);
console.log('Data directory:', path.join(__dirname, 'data'));

// Test file reading
const dataDir = path.join(__dirname, 'data');
const authorsFile = path.join(dataDir, 'authors.json');

try {
  const data = await fs.readFile(authorsFile, 'utf8');
  const authors = JSON.parse(data);
  console.log(`Found ${authors.length} authors`);
  console.log('First author:', authors[0]);
} catch (error) {
  console.error('Error reading authors file:', error.message);
}
