# Instrucciones para crear tablas en Supabase

1. Ve a tu proyecto en https://app.supabase.com/
2. Abre el panel SQL y ejecuta:

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

3. Copia tu URL y Key de Supabase y agrégalas al archivo `.env`:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

4. Reinicia el servidor de desarrollo para que los cambios surtan efecto.
