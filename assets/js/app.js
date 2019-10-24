import Promise from 'promise-polyfill';

if (window.Promise === undefined) {
  window.Promise = Promise;
}

console.log('app');
