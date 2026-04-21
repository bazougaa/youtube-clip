import { Client } from 'ssh2';
import * as fs from 'fs';

const conn = new Client();

console.log("Starting SSH connection...");

conn.on('ready', () => {
  console.log('Connected to VPS! Executing setup commands...');
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    echo "Installing PM2..."
    npm install -g pm2
    
    echo "Installing Git, FFmpeg, and Redis..."
    apt-get update
    apt-get install -y git ffmpeg redis-server ufw
    
    echo "Starting Redis..."
    systemctl enable redis-server
    systemctl start redis-server
    
    echo "Setting up Application..."
    rm -rf /opt/youtube-clip
    git clone https://github.com/bazougaa/youtube-clip.git /opt/youtube-clip
    cd /opt/youtube-clip
    
    echo "Installing NPM dependencies..."
    npm install
    
    echo "Building frontend..."
    npm run build
    
    echo "Starting PM2..."
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start ./node_modules/tsx/dist/cli.mjs --name "youtube-clip" -- server.ts
    pm2 save
    
    echo "Setting up Firewall..."
    ufw allow 3000
    ufw allow ssh
    ufw --force enable
    
    echo "Done!"
  `, (err, stream) => {
    if (err) {
      console.error("Execution error:", err);
      return conn.end();
    }
    
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
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120aA',
  readyTimeout: 20000
});
