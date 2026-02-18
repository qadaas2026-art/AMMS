// netlify/functions/faults-get.js
export async function handler(event){ const ym=(event.queryStringParameters&&event.queryStringParameters.ym)||''; return {statusCode:200, headers:{'content-type':'application/json','access-control-allow-origin':'*'}, body: JSON.stringify({rows: JSON.parse(globalThis.localStorage?.getItem?.('faults-'+ym)||'[]')})}; }
