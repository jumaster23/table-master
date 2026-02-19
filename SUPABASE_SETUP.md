# Instrucciones de conexión con Supabase

1. Ve a tu proyecto en https://app.supabase.com/
2. En SQL Editor ejecuta primero el script de seed para datos base de la app:

```sql
-- copia y ejecuta el contenido de SUPABASE_SEED_AREAS_TABLES.sql
```

3. Si también necesitas el ajuste de schema de reservas, ejecuta:

```sql
-- copia y ejecuta el contenido de SUPABASE_MIGRATION_RESERVATIONS.sql
```

4. Configura variables de entorno del frontend en `.env` (raíz del proyecto):

```dotenv
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

5. Configura variables de entorno del backend en `api/.env`:

```dotenv
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<tu-service-role-o-sb-secret-key>
PORT=3000
```

6. Reinicia el entorno (`npm run dev:full`).

## Referencia (opcional)

Este bloque era una referencia mínima para otra parte del proyecto:

```sql
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(20)
);

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id),
  item VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL
);
```
