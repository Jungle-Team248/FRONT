import io from 'socket.io-client';
import { paddr } from '../proxyAddr';

let socket = null;

export default async () => {
    // socket = await io.connect("http://localhost:3000");
    socket = await io.connect(paddr, {
        withCredentials: true,
        extraHeaders: {
          // "access-control-allow-origin": "https://d17xe7xfw04d2o.cloudfront.net", // 진호
          // "access-control-allow-origin": "https://d2bxvfgokknit.cloudfront.net", // 혜린
          // "access-control-allow-origin": "https://d2wm85v592lxtd.cloudfront.net", // 재관
          "access-control-allow-origin": "https://d1cbkw060yb1pg.cloudfront.net", // 해인
          "access-control-allow-credentials": true,
        }
      });
    return socket;
}

export {socket};