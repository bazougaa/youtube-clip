const { Client } = require('ssh2');

const conn = new Client();

console.log("Running background install...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    echo "Running build process..." > deploy.log
    (
      npm install --include=dev
      npm run build
      pm2 delete youtube-clip || true
      pm2 start npx --name "youtube-clip" -- tsx server.ts
      pm2 save
    ) >> deploy.log 2>&1 &
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Background process started!');
      conn.end();
      process.exit(0);
    });
  });
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA'
});
