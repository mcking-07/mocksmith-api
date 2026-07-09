CREATE TABLE analytics (
  id TEXT PRIMARY KEY,
  endpoint_id TEXT,
  request_count INTEGER DEFAULT 0,
  last_requested_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE SET NULL
);

CREATE INDEX idx_analytics_endpoint ON analytics(endpoint_id);
CREATE INDEX idx_analytics_last_requested ON analytics(last_requested_at);
