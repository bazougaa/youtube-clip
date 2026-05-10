require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking logs...");

conn.on('ready', () => {
  conn.exec(`
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
}).connect({
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
});
