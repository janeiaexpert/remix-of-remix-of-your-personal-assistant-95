const { exec } = require('child_process');
const path = require('path');

console.log('Iniciando renderização do Reel de IA...');

const build = exec('npm run build', { cwd: __dirname });

build.stdout.on('data', (data) => console.log(`stdout: ${data}`));
build.stderr.on('data', (data) => console.error(`stderr: ${data}`));

build.on('close', (code) => {
  if (code === 0) {
    console.log('Renderização concluída com sucesso!');
  } else {
    console.error(`O processo terminou com código de erro ${code}`);
  }
});
