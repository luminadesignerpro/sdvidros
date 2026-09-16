const { execSync } = require('child_process');
const fs = require('fs');

['do_patch.js', 'apply_full_tc_fix.js', 'fix_tc_moveis.js'].forEach(f => {
  try { fs.unlinkSync(f); } catch(_) {}
});

console.log('Status:');
console.log(execSync('git status --short').toString());

console.log('Adding files...');
execSync('git add -A', { stdio: 'inherit' });

console.log('Committing...');
execSync('git commit -m "fix(portal): isolamento dinamico de empresa e banner sob medida para Tc moveis e empresas personalizadas"', { stdio: 'inherit' });

console.log('Pushing...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('DEPLOY TO GITHUB & VERCEL COMPLETED!');
