require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing Install with KeepAlive...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    echo "Installing..."
    npm install --verbose
    echo "Building..."
    npm run build
    
    echo "Compiling..."
    npm run lint
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    
    echo "Starting PM2..."
    pm2 delete youtube-clip || true
    NODE_ENV=production pm2 start server.js --name "youtube-clip"
    pm2 save
    
    echo "Done!"
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
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
  keepaliveInterval: 10000,
  readyTimeout: 60000
});
