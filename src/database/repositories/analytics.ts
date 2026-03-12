import { safe } from '../../common';
import type { AnalyticsType } from '../../types';
import type { Database } from '../database';
import { Repository } from './repository';

class AnalyticsRepository extends Repository<AnalyticsType> {
  constructor(database: Database) {
    super(database, 'analytics');
  }

  find_by_endpoint_id = (endpoint_id: string) => {
    return this.database.get<AnalyticsType>('SELECT * FROM analytics WHERE endpoint_id = ?', [endpoint_id]);
  };

  increment = safe((endpoint_id: string) => {
    return this.database.run('UPDATE analytics SET request_count = request_count + 1, last_requested_at = CURRENT_TIMESTAMP WHERE endpoint_id = ?', [endpoint_id]);
  });

  create_for_endpoint = (endpoint_id: string) => {
    return this.create({ endpoint_id, request_count: 0, last_requested_at: null });
  };
}


export { AnalyticsRepository };
