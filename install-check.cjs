const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking install logs...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    npm install > install.log 2>&1
    cat install.log
    ls -la node_modules/express || echo "EXPRESS MISSING"
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
