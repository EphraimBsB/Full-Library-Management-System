const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'ISBAT LMS Backend',
  script: path.join(__dirname, 'dist', 'src', 'main.js')
});

svc.on('uninstall', function() {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

console.log('Uninstalling service...');
svc.uninstall();
