require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Starting SSH connection...");

conn.on('ready', () => {
  console.log('Connected to VPS! Executing setup commands...');
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    echo "=== SYSTEM PREP ==="
    apt-get update -y
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs git ffmpeg redis-server ufw
    
    npm install -g pm2
    
    echo "=== REDIS ==="
    systemctl enable redis-server
    systemctl start redis-server
    
    echo "=== REPO CLONE ==="
    rm -rf /opt/youtube-clip
    git clone https://github.com/bazougaa/youtube-clip.git /opt/youtube-clip
    cd /opt/youtube-clip
    
    echo "=== INSTALL & BUILD ==="
    npm install
    npm run build
    
    echo "=== START SERVER ==="
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start ./node_modules/tsx/dist/cli.mjs --name "youtube-clip" -- server.ts
    pm2 save
    
    echo "=== FIREWALL ==="
    ufw allow 3000
    ufw allow OpenSSH
    ufw --force enable
    
    echo "=== DONE ==="
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Remote execution closed with code: ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error("SSH Connection Error:", err);
}).connect({
  host: process.env.VPS_HOST,
  port: 22,
  username: process.env.VPS_USERNAME || 'root',
  password: process.env.VPS_PASSWORD
});
