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
// Status messages: actaro-map:stage:<name>, actaro-map:ready, actaro-map:error:<reason>.
// Stages and reasons identify where an embedded renderer failed without exposing route data.
export function runMapDocument(initial: RunMapPayload, accent: string, dark: boolean) {
  const casing = dark ? '#0c0d0c' : '#ffffff';
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob: https://unpkg.com; style-src 'unsafe-inline' https://unpkg.com; connect-src https://tiles.openfreemap.org https://unpkg.com; worker-src blob:; child-src blob:; img-src data: blob: https://tiles.openfreemap.org; font-src data: https://tiles.openfreemap.org;">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.css">
<style>html,body,#map{margin:0;width:100%;height:100%;background:${dark ? '#171a18' : '#e7e9e3'}}
button{position:absolute;right:12px;border:0;border-radius:18px;padding:10px 14px;background:#fff;color:#171a18;box-shadow:0 2px 6px #0003;font:600 13px system-ui;z-index:2;cursor:pointer}#follow{top:12px}#fit{top:54px}.maplibregl-ctrl-attrib{font-size:10px}.maplibregl-ctrl-attrib a{color:#171a18}
.dot{width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 4px #0006}.start{background:#21a359}.finish{background:#111311}.here{width:16px;height:16px;background:${accent};box-shadow:0 0 0 7px ${accent}40,0 1px 4px #0006}</style></head>
<body><div id="map" role="img" aria-label="Street map and recorded running route"></div>
<button id="follow" type="button">Recenter</button><button id="fit" type="button">Fit route</button>
<script>let latest=${mapJson(initial)},renderMap=null,ready=false;
window.updateActaroMap=function(value){latest=value;if(renderMap)renderMap()};
window.addEventListener('message',function(event){if(event.source===parent&&event.data?.channel==='actaro-run-map')window.updateActaroMap(event.data.payload)});
function reportMap(status){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(status);else parent.postMessage(status,'*')}
function failMap(reason){if(!ready)reportMap('actaro-map:error:'+String(reason&&reason.message||reason||'unknown').slice(0,160))}
window.addEventListener('error',function(event){failMap(event.message)});
window.addEventListener('unhandledrejection',function(event){failMap(event.reason)});
reportMap('actaro-map:stage:page');
</script><script type="module">
try {
reportMap('actaro-map:stage:library');
const lib=await import('https://unpkg.com/maplibre-gl@6.15.0/dist/maplibre-gl.mjs');
reportMap('actaro-map:stage:style');
const map=new lib.Map({container:'map',style:'https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'positron'}',center:latest.position,zoom:16,attributionControl:{compact:false}});
let following=latest.live,loaded=false;
function marker(kind){const element=document.createElement('div');element.className='dot '+kind;return new lib.Marker({element})}
const start=marker('start').setLngLat(latest.lines[0]?.[0]||latest.position).addTo(map);
const current=marker('here'),finish=marker('finish');
function fit(){const all=latest.lines.flat();if(all.length<2){map.easeTo({center:latest.position,zoom:16});return}const bounds=new lib.LngLatBounds();all.forEach(p=>bounds.extend(p));map.fitBounds(bounds,{padding:45,maxZoom:17,duration:400})}
renderMap=function(){if(!loaded)return;map.getSource('run').setData({type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:latest.lines.filter(line=>line.length>1)}});start.setLngLat(latest.lines[0]?.[0]||latest.position);(latest.live?current:finish).setLngLat(latest.position).addTo(map);(latest.live?finish:current).remove();if(following&&latest.live)map.easeTo({center:latest.position,duration:400})};
map.on('dragstart',()=>{following=false});
document.getElementById('follow').onclick=()=>{following=true;map.easeTo({center:latest.position,zoom:Math.max(15,map.getZoom()),duration:400})};
document.getElementById('fit').onclick=()=>{following=false;fit()};
map.on('style.load',()=>reportMap('actaro-map:stage:tiles'));
map.on('load',()=>{map.addSource('run',{type:'geojson',data:{type:'FeatureCollection',features:[]}});map.addLayer({id:'run-casing',type:'line',source:'run',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':${mapJson(casing)},'line-width':9}});map.addLayer({id:'run-line',type:'line',source:'run',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':${mapJson(accent)},'line-width':5}});loaded=true;renderMap();if(!latest.live)fit();map.once('idle',()=>{ready=true;reportMap('actaro-map:ready')})});
map.on('error',(event)=>{if(!loaded)failMap(event.error)});
}catch(error){failMap(error)}
</script></body></html>`;
}
