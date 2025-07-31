const https = require('https');
const fs = require('fs');
const path = require('path');

try {
  // Read certificate files
  const cert = fs.readFileSync(path.join(__dirname, 'cert.pem'));
  const key = fs.readFileSync(path.join(__dirname, 'key.pem'));
  
  console.log('Certificate file size:', cert.length);
  console.log('Key file size:', key.length);
  
  // Create HTTPS server options
  const options = {
    key: key,
    cert: cert
  };
  
  // Create a simple HTTPS server
  const server = https.createServer(options, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>HTTPS Test Server Working!</h1><p>Certificate and key files are valid.</p>');
  });
  
  server.listen(3000, '127.0.0.1', () => {
    console.log('✅ HTTPS server running at https://127.0.0.1:3000/');
    console.log('Certificate and key files are valid!');
    server.close();
  });
  
  server.on('error', (err) => {
    console.error('❌ HTTPS server error:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.log('Port 3000 is already in use, but certificate files are likely valid');
    }
  });
  
} catch (error) {
  console.error('❌ Error reading certificate files:', error.message);
  if (error.code === 'ENOENT') {
    console.log('Certificate or key file not found');
  } else if (error.message.includes('PEM')) {
    console.log('Invalid PEM format in certificate or key file');
  }
}
