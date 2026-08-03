PRAGMA defer_foreign_keys = ON;

DROP INDEX IF EXISTS index_items_on_name;

CREATE TABLE items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'unit',
  preferred_source TEXT,
  low INTEGER,
  high INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO items_new (
  id,
  name,
  category,
  unit,
  preferred_source,
  low,
  high,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  category,
  COALESCE(NULLIF(TRIM(unit), ''), 'unit'),
  preferred_source,
  low,
  high,
  created_at,
  updated_at
FROM items;

DROP TABLE items;
ALTER TABLE items_new RENAME TO items;

CREATE UNIQUE INDEX IF NOT EXISTS index_items_on_name ON items(name);

PRAGMA defer_foreign_keys = OFF;
