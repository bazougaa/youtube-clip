const { Client } = require('ssh2');

const conn = new Client();

console.log("Checking yt-dlp verbose...");

conn.on('ready', () => {
  conn.exec(`
    /usr/local/bin/yt-dlp -v https://www.youtube.com/watch?v=hax3B6mzJYk > /tmp/ytdlp-v-out.txt 2>&1
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
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
});
