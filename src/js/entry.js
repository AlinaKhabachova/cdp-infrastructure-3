const jsmp = require('jsmp-infra-khabachova');

require('bootstrap');
require('../css/all.css');
require('../less/all.less');
require('../../bower_components/bootstrap/dist/css/bootstrap.css');

function printMe() {
  jsmp.print();
}

// eslint-disable-next-line
document.getElementById('hellobtn').onclick = printMe;
