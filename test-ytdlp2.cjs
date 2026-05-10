require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking yt-dlp test on VPS...");

conn.on('ready', () => {
  conn.exec(`
    /usr/local/bin/yt-dlp --dump-single-json https://www.youtube.com/watch?v=hax3B6mzJYk > /tmp/ytdlp-out.txt 2> /tmp/ytdlp-err.txt
    cat /tmp/ytdlp-err.txt
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
