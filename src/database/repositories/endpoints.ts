import { safe } from '../../common';
import type { EndpointsType } from '../../types';
import { type Database } from '../database';
import { Repository } from './repository';

class EndpointsRepository extends Repository<EndpointsType> {
  constructor(database: Database) {
    super(database, 'endpoints');
  }

  find_by_path_and_method = (path: string, method: string) => {
    return this.database.get<EndpointsType>('SELECT * FROM endpoints WHERE path = ? AND method = ? AND deleted_at IS NULL', [path, method]);
  };

  find_active = () => {
    return this.database.query<EndpointsType>('SELECT * FROM endpoints WHERE deleted_at IS NULL ORDER BY created_at DESC');
  };

  override delete = safe((id: string) => {
    return this.database.run('UPDATE endpoints SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
  });
}

export { EndpointsRepository };
