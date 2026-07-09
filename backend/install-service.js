const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'ISBAT LMS Backend',
  description: 'The Node.js backend for ISBAT LMS',
  script: path.join(__dirname, 'dist', 'src', 'main.js'),
  env: [{
    name: "NODE_ENV",
    value: "production" // or whatever environment you need
  }]
});

svc.on('install', function() {
  console.log('Service installed successfully. Starting it up...');
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.log('This service is already installed.');
});

svc.on('start', function() {
  console.log('Service started successfully. The backend will now run in the background and auto-start on server boot.');
});

console.log('Installing service...');
svc.install();
