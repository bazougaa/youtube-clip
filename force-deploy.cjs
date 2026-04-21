const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing merge conflict and deploying...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    
    echo "1. Stashing local package-lock changes..."
    git stash
    
    echo "2. Pulling latest code from GitHub..."
    git pull origin main
    
    echo "3. Installing dependencies..."
    npm install
    
    echo "4. Building React Frontend..."
    npm run build
    
    echo "5. Compiling TypeScript Backend..."
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    
    echo "6. Restarting PM2 Server..."
    pm2 restart youtube-clip
    
    echo "7. Saving PM2 State..."
    pm2 save
    
    echo "8. Deployment Complete! Checking status..."
    pm2 status
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('SSH session closed with code: ' + code);
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
  readyTimeout: 60000,
  keepaliveInterval: 10000
});
