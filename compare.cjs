const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      fileList = getFiles(path.join(dir, file), fileList);
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const mirrorDir = path.join(__dirname, 'mirror-app', 'src');
const mainDir = path.join(__dirname, 'src');

const mirrorFiles = getFiles(mirrorDir).map(f => f.replace(mirrorDir, '').replace(/\\/g, '/'));
const mainFiles = getFiles(mainDir).map(f => f.replace(mainDir, '').replace(/\\/g, '/'));

const newInMirror = mirrorFiles.filter(x => !mainFiles.includes(x));
const modifiedInMirror = mirrorFiles.filter(x => mainFiles.includes(x));

console.log('--- NEW FILES IN MIRROR ---');
console.log(newInMirror.join('\n'));

console.log('\n--- MODIFIED FILES IN MIRROR (Potential Conflicts) ---');
console.log(modifiedInMirror.join('\n'));
