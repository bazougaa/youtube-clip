const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking status and installing requirements...");

conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    
    echo "1. Installing system requirements..."
    apt-get update -y > /dev/null
    apt-get install -y python3 python-is-python3 build-essential ffmpeg redis-server curl git ufw > /dev/null
    
    echo "2. Ensuring Redis is running..."
    systemctl enable redis-server > /dev/null 2>&1
    systemctl start redis-server > /dev/null 2>&1
    
    cd /opt/youtube-clip
    
    echo "3. Cleaning up old files..."
    rm -rf node_modules package-lock.json dist
    
    echo "4. Installing npm dependencies..."
    npm cache clean --force > /dev/null 2>&1
    npm install > /dev/null
    
    echo "5. Building frontend..."
    npm run build > /dev/null
    
    echo "6. Compiling backend..."
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop > /dev/null 2>&1
    
    echo "7. Starting PM2 server..."
    pm2 delete youtube-clip > /dev/null 2>&1 || true
    NODE_ENV=production pm2 start server.js --name "youtube-clip" > /dev/null
    pm2 save > /dev/null
    
    echo "8. Status Check:"
    pm2 status
    sleep 3
    ss -tlnp | grep 3000
    echo "DONE"
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Script finished with code: ' + code);
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error("SSH Error:", err);
  process.exit(1);
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
  readyTimeout: 60000,
  keepaliveInterval: 10000
});
