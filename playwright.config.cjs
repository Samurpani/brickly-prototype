const { defineConfig } = require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests',testMatch:'**/*.spec.cjs',timeout:30000,fullyParallel:true,workers:3,
  use:{baseURL:'http://127.0.0.1:4197',viewport:{width:1440,height:900},reducedMotion:'reduce',trace:'retain-on-failure'},
  webServer:{command:'node tests/prototype-server.cjs',url:'http://127.0.0.1:4197/prototypes/Bricly_OS_Prototype_v2.html',reuseExistingServer:!process.env.CI},
});