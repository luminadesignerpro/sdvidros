const { execSync } = require('child_process');

console.log('Status:');
console.log(execSync('git status --short').toString());

console.log('Adding files...');
execSync('git add -A', { stdio: 'inherit' });

console.log('Committing...');
execSync('git commit -m "fix: vincula manifest-moveis.json, id exclusivo e icones no head sincrono para instalacao correta de SD Moveis Projetados"', { stdio: 'inherit' });

console.log('Pushing...');
execSync('git push origin main', { stdio: 'inherit' });

console.log('ALL DONE SUCCESSFULLY!');
