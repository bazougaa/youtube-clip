const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking deployment...");

conn.on('ready', () => {
  conn.exec(`
    echo "=== PM2 STATUS ==="
    pm2 status
    echo "=== PORT 3000 ==="
    ss -tlnp | grep 3000 || echo "Not listening"
    echo "=== PM2 LOGS ==="
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
