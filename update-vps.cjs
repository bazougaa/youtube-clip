require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Connecting to update server...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git fetch origin main
    git reset --hard origin/main
    npm install
    npm run build
    npx tsc server.ts
    pm2 restart youtube-clip
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Server updated and restarted!');
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
