const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking why PM2 fails to start...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    echo "Running PM2 start manually..."
    NODE_ENV=production pm2 start ./node_modules/tsx/dist/cli.mjs --name "youtube-clip" -- server.ts
    pm2 status
    sleep 2
    pm2 logs youtube-clip --lines 50 --nostream
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
