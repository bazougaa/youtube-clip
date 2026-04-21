const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking VPS Status...");

conn.on('ready', () => {
  conn.exec(`
    echo "=== PM2 STATUS ==="
    pm2 status
    echo "=== PM2 LOGS ==="
    pm2 logs youtube-clip --lines 30 --nostream
    echo "=== DIRECTORY CHECK ==="
    ls -la /opt/youtube-clip/node_modules/tsx/dist/ || echo "tsx missing!"
    echo "=== PORT CHECK ==="
    ss -tlnp | grep 3000 || echo "Port 3000 not listening!"
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
  console.error("SSH Connection Error:", err);
  process.exit(1);
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA'
});
