import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected!');
  conn.exec('ls -la /opt/youtube-clip', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).on('error', (err) => {
  console.error('Connection Error:', err);
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120aA',
  readyTimeout: 10000
});