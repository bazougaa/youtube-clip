const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing Python and Install...");

conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    apt-get install -y python-is-python3
    which python
    python --version
    
    cd /opt/youtube-clip
    npm install
    npm run build
    
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start server.js --name "youtube-clip"
    pm2 save
    
    pm2 logs youtube-clip --lines 20 --nostream
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done installing: ' + code);
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA'
});
