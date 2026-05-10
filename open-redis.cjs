require('dotenv').config();
const { Client } = require('ssh2');

const conn = new Client();

console.log("Configuring Redis to allow external connections...");

conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    
    # Update redis.conf to listen on all interfaces
    sed -i 's/^bind 127.0.0.1 -::1/bind 0.0.0.1 -::1/' /etc/redis/redis.conf
    sed -i 's/^bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
    sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf
    
    systemctl restart redis-server
    
    # Open port 6379 in firewall
    ufw allow 6379
    ufw --force enable
    
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
