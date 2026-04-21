const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking server.ts...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git pull
    npx tsc server.ts --target ESNext --module NodeNext --moduleResolution NodeNext --esModuleInterop
    pm2 restart youtube-clip
    sleep 2
    pm2 logs youtube-clip --lines 10 --nostream
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
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
});
