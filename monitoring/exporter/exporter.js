// Exportador para Prometheus (puerto 9111) con dos fuentes:
//  1) SONDEO DEL SITIO: cada 5 s hace GET a cada URL objetivo y mide éxito, duración y código.
//  2) RESULTADOS DE JMETER: sigue en vivo el último jmeter/results/*/resultados.jtl y expone
//     muestras, tiempos de respuesta y usuarios activos, para verlos en Grafana mientras corre la prueba.
//
//   npm install && node exporter.js
//   PROBE_TARGETS="web=http://localhost:3002/,api=http://localhost:3000/api/v1/properties" node exporter.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const client = require('prom-client');

const PORT = Number(process.env.PORT || 9111);
const RESULTS_DIR = process.env.JMETER_RESULTS || path.join(__dirname, '..', '..', 'jmeter', 'results');
const TARGETS = (process.env.PROBE_TARGETS || 'web=http://localhost:3002/,api=http://localhost:3000/api/v1/properties')
  .split(',')
  .map((t) => t.split(/=(.+)/))
  .map(([name, url]) => ({ name, url }));

const register = new client.Registry();
client.collectDefaultMetrics({ register });

/* ── 1) Sondeo del sitio ── */
const probeOk = new client.Gauge({ name: 'probe_success', help: '1 si la URL respondió 2xx/3xx', labelNames: ['target'], registers: [register] });
const probeTime = new client.Gauge({ name: 'probe_duration_seconds', help: 'Duración del último sondeo', labelNames: ['target'], registers: [register] });
const probeStatus = new client.Gauge({ name: 'probe_http_status_code', help: 'Código HTTP del último sondeo', labelNames: ['target'], registers: [register] });

async function probe({ name, url }) {
  const t0 = process.hrtime.bigint();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'follow' });
    await res.arrayBuffer();
    probeOk.set({ target: name }, res.status < 400 ? 1 : 0);
    probeStatus.set({ target: name }, res.status);
  } catch {
    probeOk.set({ target: name }, 0);
    probeStatus.set({ target: name }, 0);
  }
  probeTime.set({ target: name }, Number(process.hrtime.bigint() - t0) / 1e9);
}
setInterval(() => TARGETS.forEach(probe), 5000);
TARGETS.forEach(probe);

/* ── 2) Resultados de JMeter (.jtl en CSV) ── */
const samples = new client.Counter({ name: 'jmeter_samples_total', help: 'Muestras de JMeter', labelNames: ['label', 'success'], registers: [register] });
const resp = new client.Histogram({
  name: 'jmeter_response_time_seconds', help: 'Tiempo de respuesta medido por JMeter', labelNames: ['label'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 3, 5, 10], registers: [register],
});
const threads = new client.Gauge({ name: 'jmeter_active_threads', help: 'Usuarios virtuales activos', registers: [register] });
const bytes = new client.Counter({ name: 'jmeter_received_bytes_total', help: 'Bytes recibidos', registers: [register] });

function splitCsv(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

let current = null; // { file, offset, header, rest }
function newestJtl() {
  try {
    return fs.readdirSync(RESULTS_DIR)
      .map((d) => path.join(RESULTS_DIR, d, 'resultados.jtl'))
      .filter((f) => fs.existsSync(f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  } catch { return undefined; }
}

function tailJtl() {
  const file = newestJtl();
  if (!file) return;
  if (!current || current.file !== file) current = { file, offset: 0, header: null, rest: '' };
  const size = fs.statSync(file).size;
  if (size <= current.offset) return;
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(size - current.offset);
  fs.readSync(fd, buf, 0, buf.length, current.offset);
  fs.closeSync(fd);
  current.offset = size;
  const lines = (current.rest + buf.toString('utf8')).split(/\r?\n/);
  current.rest = lines.pop() ?? ''; // última línea posiblemente incompleta
  for (const line of lines) {
    if (!line) continue;
    const cols = splitCsv(line);
    if (!current.header) { current.header = cols; continue; }
    const row = Object.fromEntries(current.header.map((h, i) => [h, cols[i]]));
    const label = row.label || 'sin_etiqueta';
    samples.inc({ label, success: row.success === 'true' ? 'true' : 'false' });
    resp.observe({ label }, Number(row.elapsed) / 1000);
    bytes.inc(Number(row.bytes) || 0);
    if (row.allThreads) threads.set(Number(row.allThreads));
  }
}
setInterval(() => { try { tailJtl(); } catch (e) { console.error(e.message); } }, 1000);

http
  .createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      return res.end(await register.metrics());
    }
    res.statusCode = 404;
    res.end('GET /metrics');
  })
  .listen(PORT, () => console.log(`Exportador en http://localhost:${PORT}/metrics  ·  objetivos: ${TARGETS.map((t) => t.name).join(', ')}`));
