require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Fixing Redis config...");

conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    
    # Restore valid bind configuration
    sed -i 's/^bind 0.0.0.1 -::1/bind 0.0.0.0/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    systemctl status redis-server --no-pager
    
    echo "Redis configured and restarted."
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
}).on('error', (err) => {
  console.error("SSH Error:", err);
  process.exit(1);
}).connect({
  host: 'process.env.VPS_HOST',
  port: 22,
  username: 'root',
  password: 'process.env.VPS_PASSWORD',
});
