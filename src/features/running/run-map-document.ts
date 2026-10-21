import type { RunPoint } from './run-model';

export function runMapPayload(points: readonly RunPoint[], live: boolean) {
  const lines: number[][][] = [];
  const stride = Math.max(1, Math.ceil(points.length / 1000));
  const origin = points[0]?.longitude ?? 0;
  for (let index = 0; index < points.length; index++) {
    const point = points[index],
      previous = points[index - 1],
      next = points[index + 1];
    if (!previous || previous.segment !== point.segment) lines.push([]);
    if (index % stride && previous?.segment === point.segment && next?.segment === point.segment)
      continue;
    lines[lines.length - 1].push([
      origin + ((point.longitude - origin + 540) % 360) - 180,
      point.latitude,
    ]);
  }
  return { lines, live, position: lines.at(-1)?.at(-1) ?? [0, 0] };
}
export type RunMapPayload = ReturnType<typeof runMapPayload>;
export function mapJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
export function runMapDocument(initial: RunMapPayload, accent: string, dark: boolean) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; connect-src https://tiles.openfreemap.org https://unpkg.com; worker-src blob:; img-src data: blob: https://tiles.openfreemap.org; font-src data: https://tiles.openfreemap.org;">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css">
<style>html,body,#map{margin:0;width:100%;height:100%;background:${dark ? '#171a18' : '#e7e9e3'}}
button{position:absolute;right:12px;border:0;border-radius:18px;padding:10px 14px;background:#fff;color:#171a18;box-shadow:0 2px 6px #0003;font:600 13px system-ui;z-index:2;cursor:pointer}#follow{top:12px}#fit{top:54px}.maplibregl-ctrl-attrib{font-size:10px}.maplibregl-ctrl-attrib a{color:#171a18}</style></head>
<body><div id="map" role="img" aria-label="Street map and recorded running route"></div>
<button id="follow" type="button">Recenter</button><button id="fit" type="button">Fit route</button>
<script>let latest=${mapJson(initial)},renderMap=null;
window.updateActaroMap=function(value){latest=value;if(renderMap)renderMap()};
window.addEventListener('message',function(event){if(event.source===parent&&event.data?.channel==='actaro-run-map')window.updateActaroMap(event.data.payload)});
function reportMap(status){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(status);else parent.postMessage(status,'*')}
</script><script type="module">
try {
const lib=await import('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs');
const map=new lib.Map({container:'map',style:'https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'liberty'}',center:latest.position,zoom:16,attributionControl:{compact:false}});
let following=latest.live,loaded=false;
const current=new lib.Marker({color:${mapJson(accent)}}).setLngLat(latest.position).addTo(map);
const start=new lib.Marker({color:'#506559',scale:0.65}).setLngLat(latest.lines[0]?.[0]||latest.position).addTo(map);
function fit(){const all=latest.lines.flat();if(all.length<2){map.easeTo({center:latest.position,zoom:16});return}const bounds=new lib.LngLatBounds();all.forEach(p=>bounds.extend(p));map.fitBounds(bounds,{padding:45,maxZoom:17,duration:400})}
renderMap=function(){if(!loaded)return;map.getSource('run').setData({type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:latest.lines.filter(line=>line.length>1)}});current.setLngLat(latest.position);if(following&&latest.live)map.easeTo({center:latest.position,duration:400})};
map.on('dragstart',()=>{following=false});
document.getElementById('follow').onclick=()=>{following=true;map.easeTo({center:latest.position,zoom:Math.max(15,map.getZoom()),duration:400})};
document.getElementById('fit').onclick=()=>{following=false;fit()};
map.on('load',()=>{map.addSource('run',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'run-line',type:'line',source:'run',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':${mapJson(accent)},'line-width':5}});loaded=true;renderMap();if(!latest.live)fit();map.once('idle',()=>reportMap('actaro-map:ready'))});
map.on('error',()=>{if(!loaded)reportMap('actaro-map:error')});
}catch{reportMap('actaro-map:error')}
</script></body></html>`;
}
