const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = 'relay';
const PROJECT_ID = 'prj_w1LAjflW53GP7vnHJdhUostzkKbs';
const TEAM_ID = 'team_yAc50kblJMtpwpczBOHirWHO';

async function getLatestDeployment() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v6/deployments?projectId=${PROJECT_ID}&target=production&limit=1`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.deployments[0]);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function redeploy(deploymentId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ 
      name: PROJECT_NAME, 
      deploymentId,
      target: 'production' 
    });
    
    const options = {
      hostname: 'api.vercel.com',
      path: '/v6/deployments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Getting latest deployment...`);
  
  try {
    const latest = await getLatestDeployment();
    console.log(`[${timestamp}] Redeploying ${latest.uid}...`);
    const result = await redeploy(latest.uid);
    console.log(`[${timestamp}] Done! New deployment: ${result.url}`);
  } catch (error) {
    console.error(`[${timestamp}] Error:`, error.message);
  }
}

// Run immediately
main();

// Then every 1 minute
setInterval(main, 60 * 1000);