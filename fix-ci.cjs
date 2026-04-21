const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking what's installed...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    npm ci
    npm run build
    pm2 delete youtube-clip || true
    pm2 start npx --name "youtube-clip" -- tsx server.ts
    sleep 3
    pm2 logs youtube-clip --lines 20 --nostream
    ss -tlnp | grep 3000
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done! Code: ' + code);
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
  readyTimeout: 20000
});
