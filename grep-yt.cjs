const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking ytDlpPath...");

conn.on('ready', () => {
  conn.exec(`
    grep "ytDlpPath" /opt/youtube-clip/server.js
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
