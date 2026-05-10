require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Deploying backend cookie update to VPS...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git pull origin main
    
    echo "Compiling TypeScript Backend..."
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    
    echo "Restarting PM2 Server..."
    pm2 restart youtube-clip
    
    echo "Done!"
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Finished with code: ' + code);
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
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
  readyTimeout: 60000
});
