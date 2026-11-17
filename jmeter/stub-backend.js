// Backend SIMULADO para pruebas de carga sin Postgres ni RabbitMQ.
// Atiende, en un solo puerto (3100), las rutas que el api-gateway reenvía a cada microservicio:
//   /users  /users/login  /properties  /leads  /viewings  /contracts  /commissions  /notifications  /analytics
// Uso:  node jmeter/stub-backend.js
//   y levantar el api-gateway apuntando todas las *_SERVICE_URL a http://localhost:3100
// Los datos son sintéticos y viven en memoria (se pierden al cerrar).
const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3100);
const secret = process.env.JWT_SECRET || "secreto-de-prueba";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload) {
  const h = b64({ alg: "HS256", typ: "JWT" });
  const p = b64({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 });
  return `${h}.${p}.${crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url")}`;
}

const photos = [
  "1595564852555-c52950751075", "1624204386084-dd8c05e32226", "1706808849777-96e0d7be3bb7",
  "1638973140785-3b918e290682", "1684226910423-a4eb43a03257", "1613977257363-707ba9348227",
].map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`);
const props = Array.from({ length: 12 }, (_, i) => ({
  id: `p${i + 1}`,
  title: ["Casa moderna", "Apartamento con balcón", "Casa familiar", "Apartaestudio", "Finca campestre", "Villa con piscina"][i % 6] + ` ${i + 1}`,
  description: "Propiedad de prueba para la carga.",
  address: `Calle ${10 + i} #3-${40 + i}, Montería`,
  price: (i % 3 === 2 ? 2500000 : 450000000) + i * 1000000,
  status: i % 7 === 6 ? "Reservada" : "Disponible",
  images: [photos[i % photos.length]],
  operation: i % 3 === 2 ? "Alquiler" : "Venta",
  property_type: ["Casa", "Apartamento", "Casa", "Apartaestudio", "Finca", "Casa"][i % 6],
  city: "Montería",
  created_at: new Date(Date.now() - i * 864e5).toISOString(),
}));
const users = [
  { id: "u1", name: "Administrador Sistema", email: "admin@realtyhub.com", role: "ADMIN", office_id: "o1", active: true },
  { id: "u2", name: "Gerente Comercial", email: "gerente@realtyhub.com", role: "GERENTE", office_id: "o1", active: true },
  { id: "u3", name: "Agente Inmobiliario", email: "agente@realtyhub.com", role: "AGENTE", office_id: "o1", active: true },
];
const leads = [];
const viewings = [];
const contracts = [{ id: "c1", property_id: "p1", lead_id: "l1", agent_id: "u3", price: 450000000, type: "Venta", status: "Firmado" }];
const commissions = [{ id: "m1", contract_id: "c1", agent_id: "u3", amount: 22500000, status: "Pendiente" }];
const notifications = [{ id: "n1", title: "¡Nuevo Contrato Cerrado!", message: "Contrato firmado.", type: "success", is_read: false }];

function send(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => {
      try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); }
    });
  });
}

http
  .createServer(async (req, res) => {
    // Latencia simulada (5–35 ms) para que las gráficas se parezcan a un servicio real
    await new Promise((r) => setTimeout(r, 5 + Math.random() * 30));
    const [, a, b, c] = req.url.split("?")[0].split("/");
    const body = req.method === "GET" ? {} : await readBody(req);

    if (a === "users" && b === "login" && req.method === "POST") {
      const u = users.find((x) => x.email === String(body.email || "").toLowerCase());
      if (!u || body.password !== "123456") return send(res, 401, { message: "Credenciales inválidas" });
      const token = jwt({ sub: u.id, email: u.email, name: u.name, role: u.role, office_id: u.office_id });
      return send(res, 201, { ...u, token, access_token: token });
    }
    if (a === "users") return send(res, 200, users);
    if (a === "properties") {
      if (b) {
        const p = props.find((x) => x.id === b);
        return p ? send(res, 200, p) : send(res, 404, { message: "Propiedad no encontrada" });
      }
      return send(res, 200, props);
    }
    if (a === "leads") {
      if (req.method === "POST") {
        const lead = { id: `l${leads.length + 1}`, status: "Nuevo", created_at: new Date().toISOString(), ...body };
        leads.push(lead);
        if (leads.length > 5000) leads.shift(); // no crecer sin límite durante la carga
        return send(res, 201, lead);
      }
      return send(res, 200, leads.slice(-50));
    }
    if (a === "viewings") {
      if (req.method === "POST") {
        if (viewings.some((v) => v.property_id === body.property_id && v.scheduled_at === body.scheduled_at))
          return send(res, 400, { message: "La propiedad ya tiene una visita en ese horario" });
        const v = { id: `v${viewings.length + 1}`, status: "Pendiente", ...body };
        viewings.push(v);
        if (viewings.length > 5000) viewings.shift();
        return send(res, 201, v);
      }
      return send(res, 200, viewings.slice(-50));
    }
    if (a === "contracts") return send(res, 200, contracts);
    if (a === "commissions") return send(res, 200, commissions);
    if (a === "notifications") return send(res, 200, notifications);
    if (a === "analytics") return send(res, 200, { total_revenue: 452500000, total_sales: 2 });
    send(res, 404, { message: "No encontrado" });
  })
  .listen(PORT, () => console.log(`Backend simulado en http://localhost:${PORT}`));
