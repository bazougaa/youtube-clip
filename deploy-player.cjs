require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Deploying player fix to VPS...");

conn.on('ready', () => {
  conn.exec(`
    cd /opt/youtube-clip
    git pull origin main
    
    echo "Building React Frontend..."
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
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
  readyTimeout: 60000
});
