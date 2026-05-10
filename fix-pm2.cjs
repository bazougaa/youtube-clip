require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing PM2 startup...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    
    echo "Compiling server.ts for production..."
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    
    echo "Starting compiled server.js with PM2..."
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start server.js --name "youtube-clip"
    pm2 save
    
    echo "Checking status..."
    pm2 status
    sleep 3
    ss -tlnp | grep 3000
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done! Exit code: ' + code);
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
