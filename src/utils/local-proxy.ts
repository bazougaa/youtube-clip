import http from 'http';
import { SocksClient } from 'socks';

export class LocalProxy {
  private server: http.Server;
  public port: number = 0;

  constructor(private socksHost: string, private socksPort: number, private socksUser: string, private socksPass: string) {
    this.server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url!);
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
            host: url.hostname,
            port: parseInt(url.port || '80')
          }
        };

        SocksClient.createConnection(options)
          .then((info) => {
            const proxyReq = http.request({
              createConnection: () => info.socket,
              host: url.hostname,
              port: url.port || 80,
              method: req.method,
              path: url.pathname + url.search,
              headers: req.headers
            }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(res);
            });
            req.pipe(proxyReq);
            proxyReq.on('error', () => { res.end(); });
          })
          .catch((err) => {
            res.writeHead(500);
            res.end('Proxy error');
          });
      } catch (err) {
        res.writeHead(400);
        res.end('Invalid URL');
      }
    });

    this.server.on('connect', (req, clientSocket, head) => {
      try {
        const url = new URL(`http://${req.url}`);
        
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
            host: url.hostname,
            port: parseInt(url.port || '443')
          }
        };

        SocksClient.createConnection(options)
          .then((info) => {
            clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
            info.socket.write(head);
            info.socket.pipe(clientSocket);
            clientSocket.pipe(info.socket);
            
            info.socket.on('error', () => clientSocket.end());
            clientSocket.on('error', () => info.socket.end());
          })
          .catch((err) => {
            clientSocket.end();
          });
      } catch (err) {
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
