DROP INDEX IF EXISTS index_items_on_name_and_id;

CREATE UNIQUE INDEX IF NOT EXISTS index_items_on_name ON items(name);
