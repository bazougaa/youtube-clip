const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing logo on VPS...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git pull origin main
    
    # Just rebuild the frontend, backend doesn't need to restart
    npm run build
    
    echo "Done!"
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Finished with code: ' + code);
      conn.end();
      process.exit(0);
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error("SSH Error:", err);
  process.exit(1);
}).connect({
  host: '77.237.238.195',
  port: 22,
  username: 'root',
  password: '7548693120.aA',
  readyTimeout: 60000
});
