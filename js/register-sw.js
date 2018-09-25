// regiter service worker to cache static assets
registerSW = () => {
    if (!navigator.serviceWorker) return;
  
    // using github pages for https - https://davidgailey.github.io/mws-restaurant-stage-1/sw.js
    navigator.serviceWorker.register('/mws-restaurant-stage-1/sw.js').then( reg => {
      
      console.log('register serviceWorker success ', reg.scope);
      
    }).catch( err =>{
      console.error('register serviceWorker failed', err);
    });
  
  }
  
  registerSW();