// netlify/functions/faults-put.js
export async function handler(event){ if(event.httpMethod!=='PUT') return {statusCode:405}; return {statusCode:200, headers:{'content-type':'application/json','access-control-allow-origin':'*'}, body: JSON.stringify({ok:true})}; }
