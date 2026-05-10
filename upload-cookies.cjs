require('dotenv').config();
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const cookiesPath = path.join(__dirname, 'cookies.txt');

if (!fs.existsSync(cookiesPath)) {
  console.error("❌ ERROR: cookies.txt not found!");
  console.log("Please create a 'cookies.txt' file in this folder first.");
  process.exit(1);
}

const conn = new Client();

console.log("Uploading cookies.txt to the VPS...");

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    const remotePath = '/opt/youtube-clip/cookies.txt';
    
    sftp.fastPut(cookiesPath, remotePath, (err) => {
      if (err) throw err;
      console.log("✅ cookies.txt uploaded successfully!");
      
      console.log("Restarting the backend server to load the new cookies...");
      conn.exec('pm2 restart youtube-clip', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
          console.log("✅ Server restarted! yt-dlp is now using your cookies.");
          conn.end();
          process.exit(0);
        }).on('data', (data) => {
          process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
          process.stderr.write(data.toString());
        });
      });
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
