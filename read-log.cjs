const { Client } = require('ssh2');

const conn = new Client();

console.log("Reading log...");

conn.on('ready', () => {
  conn.exec('tail -n 50 /opt/youtube-clip/deploy.log', (err, stream) => {
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
  password: '7548693120.aA'
});
