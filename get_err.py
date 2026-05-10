import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('77.237.238.195', port=22, username='root', password='7548693120.aA')

stdin, stdout, stderr = client.exec_command("pm2 logs youtube-clip --lines 200 --nostream")
print(stdout.read().decode())
client.close()