type EndpointsType = {
  id: string;
  path: string;
  method: string;
  handler: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AnalyticsType = {
  id: string;
  endpoint_id: string | null;
  request_count: number;
  last_requested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type { AnalyticsType, EndpointsType };
