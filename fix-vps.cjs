require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing dependencies on VPS...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    echo "Installing missing dependencies..."
    npm install --include=dev
    
    echo "Rebuilding frontend..."
    npm run build
    
    echo "Starting server via PM2..."
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start ./node_modules/tsx/dist/cli.mjs --name "youtube-clip" -- server.ts
    pm2 save
    
    echo "Verifying server is listening..."
    sleep 5
    ss -tlnp | grep 3000
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Fix complete! Exit code: ' + code);
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
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD'
});
