require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Reading verbose output...");

conn.on('ready', () => {
  conn.exec(`
    cat /tmp/ytdlp-v-out.txt
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
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
});
