import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;
const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:8080,http://localhost:8081')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOW_ANON_KEY_IN_DEV = String(process.env.ALLOW_ANON_KEY_IN_DEV || 'true').toLowerCase() === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    'Configuración inválida: define SUPABASE_URL y una clave en SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.'
  );
}

function getSupabaseKeyRole(jwt) {
  try {
    const payloadPart = jwt?.split('.')?.[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

const supabaseKeyRole = getSupabaseKeyRole(SUPABASE_SERVICE_KEY);
if (supabaseKeyRole !== 'service_role') {
  const msg = `La clave en SUPABASE_SERVICE_KEY tiene rol '${supabaseKeyRole ?? 'desconocido'}'. Usa la service_role key para backend.`;
  if (isProduction || !ALLOW_ANON_KEY_IN_DEV) {
    throw new Error(msg);
  }
  console.info(`${msg} Continuando en modo desarrollo.`);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

const openApiPath = path.resolve(process.cwd(), '..', 'src', 'openapy.yaml');
const openApiSpec = fs.existsSync(openApiPath) ? fs.readFileSync(openApiPath, 'utf8') : '';

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '512kb' }));

if (openApiSpec) {
  app.get('/openapi.yaml', (_req, res) => {
    res.type('text/yaml').send(openApiSpec);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
    swaggerOptions: {
      url: '/openapi.yaml',
    },
  }));
}

function isValidDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time);
}

function apiError(res, status, message, details) {
  return res.status(status).json({ error: message, details });
}

function normalizeReservationStatus(status) {
  const normalized = String(status || 'CONFIRMED').toUpperCase();
  const allowed = new Set(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']);
  return allowed.has(normalized) ? normalized : 'CONFIRMED';
}

function normalizeStartTime(time) {
  if (!isValidTime(time)) return null;
  return time.length === 5 ? `${time}:00` : time;
}

async function insertReservationWithAdaptivePayloads(baseValues) {
  const reservationCamel = {
    guestName: baseValues.guestName,
    partySize: baseValues.partySize,
    date: baseValues.date,
    startTime: baseValues.startTime,
    endTime: baseValues.endTime,
    durationMins: baseValues.durationMins,
    tableIds: baseValues.tableIds,
    tableId: baseValues.tableId,
    isVip: baseValues.isVip,
    status: baseValues.status,
    notes: baseValues.notes,
  };

  const reservationHybrid = {
    guestName: baseValues.guestName,
    partySize: baseValues.partySize,
    date: baseValues.date,
    startTime: baseValues.startTime,
    endTime: baseValues.endTime,
    duration_mins: baseValues.durationMins,
    tableIds: baseValues.tableIds,
    table_id: baseValues.tableId,
    isVip: baseValues.isVip,
    status: baseValues.status,
    notes: baseValues.notes,
  };

  const reservationSnake = {
    guest_name: baseValues.guestName,
    party_size: baseValues.partySize,
    date: baseValues.date,
    start_time: baseValues.startTime,
    end_time: baseValues.endTime,
    duration_mins: baseValues.durationMins,
    table_ids: baseValues.tableIds,
    table_id: baseValues.tableId,
    is_vip: baseValues.isVip,
    status: baseValues.status,
    notes: baseValues.notes,
  };

  const payloads = [reservationSnake, reservationHybrid, reservationCamel];
  const errors = [];

  const tryInsertWithPruning = async (initialPayload) => {
    const payload = { ...initialPayload };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { data, error } = await supabase.from('reservations').insert([payload]).select();

      if (!error) {
        return { data: data[0], error: null };
      }

      errors.push(error.message);
      const missingColumnMatch = /Could not find the '([^']+)' column/.exec(error.message);
      if (!missingColumnMatch) {
        return { data: null, error };
      }

      const missingColumn = missingColumnMatch[1];
      if (!(missingColumn in payload)) {
        return { data: null, error };
      }

      delete payload[missingColumn];
    }

    return { data: null, error: { message: 'No se pudo adaptar el payload al esquema de reservations.' } };
  };

  for (const payload of payloads) {
    const result = await tryInsertWithPruning(payload);
    if (!result.error && result.data) {
      return { data: result.data, error: null };
    }
  }

  return { data: null, error: errors[errors.length - 1] || 'Error al crear reserva' };
}

app.get('/api/health', async (_req, res) => {
  const { error } = await supabase.from('areas').select('id').limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.json({ ok: true, keyRole: supabaseKeyRole ?? 'unknown' });
});

app.get('/api/ready', async (_req, res) => {
  const checks = { supabase: false, keyRole: supabaseKeyRole ?? 'unknown' };
  const { error } = await supabase.from('reservations').select('id').limit(1);
  checks.supabase = !error;
  if (error) return res.status(503).json({ ok: false, checks, error: error.message });
  return res.json({ ok: true, checks });
});

// ─── Áreas ──────────────────────────────────────────────
app.get('/api/areas', async (_req, res) => {
  const { data, error } = await supabase.from('areas').select('*');
  if (error) return apiError(res, 500, 'Error al obtener áreas', error.message);
  res.json({ data });
});

// ─── Mesas ──────────────────────────────────────────────
app.get('/api/tables', async (req, res) => {
  const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : undefined;
  let query = supabase.from('tables').select('*');
  let data;
  let error;

  if (areaId) {
    ({ data, error } = await query.eq('area', areaId));
    if (error) {
      ({ data, error } = await supabase.from('tables').select('*').eq('areaId', areaId));
    }
  } else {
    ({ data, error } = await query);
  }

  if (error) return apiError(res, 500, 'Error al obtener mesas', error.message);
  res.json({ data });
});

// ─── Reservas ───────────────────────────────────────────
app.get('/api/reservations', async (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const areaId = typeof req.query.areaId === 'string' ? req.query.areaId : undefined;

  if (!date || !isValidDate(date)) {
    return apiError(res, 400, 'Parámetro date inválido. Usa formato YYYY-MM-DD.');
  }

  let query = supabase.from('reservations').select('*').eq('date', date);
  let data;
  let error;

  if (areaId) {
    ({ data, error } = await query.eq('area', areaId));
    if (error) {
      ({ data, error } = await supabase.from('reservations').select('*').eq('date', date).eq('areaId', areaId));
    }
  } else {
    ({ data, error } = await query);
  }

  if (error) return apiError(res, 500, 'Error al obtener reservas', error.message);
  res.json({ data });
});

app.post('/api/reservations', async (req, res) => {
  const { guestName, partySize, date, startTime, endTime, durationMins, tableIds, tableId, isVip, status, notes } = req.body || {};

  if (!guestName || typeof guestName !== 'string') {
    return apiError(res, 400, 'guestName es requerido.');
  }
  if (!isValidDate(date)) {
    return apiError(res, 400, 'date inválida. Usa formato YYYY-MM-DD.');
  }
  if (!isValidTime(startTime)) {
    return apiError(res, 400, 'startTime inválido. Usa formato HH:mm o HH:mm:ss.');
  }

  const normalizedStartTime = normalizeStartTime(startTime);
  const normalizedEndTime = endTime ? normalizeStartTime(endTime) : null;
  if (endTime && !normalizedEndTime) {
    return apiError(res, 400, 'endTime inválido. Usa formato HH:mm o HH:mm:ss.');
  }

  const safePartySize = Number.isFinite(Number(partySize)) ? Math.max(1, Number(partySize)) : 1;
  const safeDurationMins = Number.isFinite(Number(durationMins)) ? Math.max(1, Number(durationMins)) : 90;
  const normalizedTableIds = Array.isArray(tableIds)
    ? tableIds.filter((id) => typeof id === 'string' && id.length > 0)
    : [];
  const normalizedTableId = typeof tableId === 'string' && tableId.length > 0
    ? tableId
    : normalizedTableIds[0];

  if (!normalizedTableId && normalizedTableIds.length === 0) {
    return apiError(res, 400, 'Debes enviar tableId o tableIds.');
  }

  const result = await insertReservationWithAdaptivePayloads({
    guestName: guestName.trim(),
    partySize: safePartySize,
    date,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    durationMins: safeDurationMins,
    tableIds: normalizedTableIds,
    tableId: normalizedTableId,
    isVip: Boolean(isVip),
    status: normalizeReservationStatus(status),
    notes: typeof notes === 'string' ? notes : '',
  });

  if (result.error) {
    return apiError(res, 500, 'Error al crear reserva', result.error);
  }

  return res.json({ data: result.data });
});

app.patch('/api/reservations/:id/status', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!id) return apiError(res, 400, 'id de reserva inválido.');

  const normalizedStatus = normalizeReservationStatus(status);
  const updateCandidates = [
    { status: normalizedStatus },
    { reservation_status: normalizedStatus },
  ];

  let data = null;
  let error = null;

  for (const updatePayload of updateCandidates) {
    ({ data, error } = await supabase.from('reservations').update(updatePayload).eq('id', id).select());
    if (!error) break;
    if (!/Could not find the '([^']+)' column/.test(error.message)) break;
  }

  if (error) return apiError(res, 500, 'Error al actualizar estado de reserva', error.message);
  res.json({ data: data[0] });
});

// ─── Disponibilidad (simplificada) ─────────────────────
app.get('/api/availability', async (req, res) => {
  // Aquí deberías implementar la lógica real de disponibilidad
  res.json({ options: [] });
});

app.listen(PORT, () => {
  console.log(`API (${NODE_ENV}) corriendo en http://localhost:${PORT}/api`);
});
