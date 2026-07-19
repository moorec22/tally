PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  preferred_source TEXT,
  low INTEGER,
  high INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0),
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE INDEX IF NOT EXISTS index_items_on_name_and_id ON items(name, id);
CREATE INDEX IF NOT EXISTS index_inventory_snapshots_latest
  ON inventory_snapshots(item_id, created_at DESC, id DESC);
