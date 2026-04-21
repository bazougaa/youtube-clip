const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing via TSX...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    echo "Installing tsx globally..."
    npm install -g tsx
    
    echo "Installing all dependencies (ignoring NODE_ENV)..."
    NODE_ENV=development npm install
    
    echo "Building frontend..."
    npm run build
    
    echo "Starting PM2 with tsx..."
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start tsx --name "youtube-clip" -- server.ts
    pm2 save
    
    echo "Checking logs..."
    sleep 3
    pm2 logs youtube-clip --lines 20 --nostream
    ss -tlnp | grep 3000
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done! Code: ' + code);
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error("SSH Connection Error:", err);
  process.exit(1);
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
  readyTimeout: 20000
});
