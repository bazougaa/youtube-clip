import http from 'http';
import { SocksClient } from 'socks';
import dns from 'dns';

export class LocalProxy {
  private server: http.Server;
  public port: number = 0;

  constructor(private socksHost: string, private socksPort: number, private socksUser: string, private socksPass: string) {
    this.server = http.createServer((req, res) => {
      res.writeHead(405);
      res.end('Method not allowed');
    });

    this.server.on('connect', (req, clientSocket, head) => {
      try {
        const url = new URL(`http://${req.url}`);
        
        // Force IPv4 resolution locally before passing to SOCKS5 proxy
        dns.lookup(url.hostname, { family: 4 }, (err, address) => {
          if (err || !address) {
            clientSocket.end();
            return;
          }

          const options = {
            proxy: {
              host: this.socksHost,
              port: this.socksPort,
              type: 5 as any,
              userId: this.socksUser,
              password: this.socksPass
            },
            command: 'connect' as any,
            destination: {
              host: address, // Pass IPv4 address instead of hostname
              port: parseInt(url.port || '443')
            }
          };

          SocksClient.createConnection(options)
            .then((info) => {
              clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
              info.socket.write(head);
              info.socket.pipe(clientSocket);
              clientSocket.pipe(info.socket);
              
              info.socket.on('error', (err) => {
                console.error('[LocalProxy] SOCKS5 connection error:', err.message);
                clientSocket.end();
              });
              clientSocket.on('error', (err) => {
                console.error('[LocalProxy] Client socket error:', err.message);
                info.socket.end();
              });
            })
            .catch((err) => {
              console.error('[LocalProxy] Failed to connect to SOCKS5 proxy:', err.message);
              clientSocket.end();
            });
        });
      } catch (err: any) {
        console.error('[LocalProxy] General error handling connect:', err.message);
        clientSocket.end();
      }
    });
  }

  public start(): Promise<number> {
    return new Promise((resolve) => {
      this.server.listen(0, '127.0.0.1', () => {
        const address = this.server.address();
        this.port = typeof address === 'string' ? 0 : address?.port || 0;
        resolve(this.port);
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }
}
