CREATE TABLE endpoints (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  handler TEXT NOT NULL,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_endpoints_path_method ON endpoints(path, method) WHERE deleted_at IS NULL;
CREATE INDEX idx_endpoints_deleted ON endpoints(deleted_at);
