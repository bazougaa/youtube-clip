const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing Python dependency...");

conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y python3 python-is-python3
    
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
      console.log('Done installing python and triggering background install');
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
