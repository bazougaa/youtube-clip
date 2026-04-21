const { Client } = require('ssh2');

const conn = new Client();

console.log("Updating and restarting VPS...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git pull
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    pm2 restart youtube-clip
    sleep 3
    pm2 logs youtube-clip --lines 20 --nostream
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
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
