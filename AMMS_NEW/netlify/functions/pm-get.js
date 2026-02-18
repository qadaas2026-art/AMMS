// netlify/functions/pm-get.js
export async function handler(){ return {statusCode:200, headers:{'content-type':'application/json','access-control-allow-origin':'*'}, body: JSON.stringify({head:[],rows:[]})}; }
