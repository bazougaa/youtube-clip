const { Client } = require('ssh2');

const conn = new Client();

console.log("Starting SSH connection to port 17790...");

conn.on('ready', () => {
  console.log('Connected successfully!');
  conn.exec('uptime', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Done!');
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write("Server Uptime: " + data.toString());
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
