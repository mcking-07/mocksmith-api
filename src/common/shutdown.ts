import { loggerFor } from './logger';

const logger = loggerFor(import.meta.url);

class ShutdownManager {
  private readonly server: ReturnType<typeof Bun.serve>;
  private readonly timeout: number;
  private shutting_down: boolean;

  constructor(server: ReturnType<typeof Bun.serve>, timeout: number = 30000) {
    this.server = server;
    this.timeout = timeout;
    this.shutting_down = false;
  }

  private force_shutdown = () => {
    logger.warn(`force shutdown triggered after ${this.timeout}ms`);
    process.exit(1);
  };

  private shutdown = (signal: string) => {
    if (this.shutting_down) return;
    this.shutting_down = true;

    logger.info(`graceful shutdown initiated, received (${signal}) signal`);
    const timer = setTimeout(this.force_shutdown, this.timeout);

    void Promise.resolve().then(() => this.server.stop()).then(() => {
      logger.info('graceful shutdown completed');
      process.exit(0);
    }).catch((error) => {
      logger.error('graceful shutdown failed', error);
      process.exit(1);
    }).finally(() => clearTimeout(timer));
  };

  listen = () => {
    process.once('SIGTERM', signal => void this.shutdown(signal));
    process.once('SIGINT', signal => void this.shutdown(signal));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('unhandled rejection', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('uncaught exception', error);
      this.shutdown('uncaughtException');
    });

    process.on('warning', (warning) => {
      logger.warn('process warning', warning);
    });
  };
}

export { ShutdownManager };
