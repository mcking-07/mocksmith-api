import { type JWTPayload, type JWTVerifyOptions, type JWTVerifyResult, jwtVerify as verify } from 'jose';
import { safe } from '../common';
import { Unauthorized } from '../errors';
import type { AuthenticationOptions, Context, Middleware, NextFunction } from '../types';

const safe_verify = safe(verify as <PayloadType = JWTPayload>(token: string, secret: Uint8Array, options?: JWTVerifyOptions) => Promise<JWTVerifyResult<PayloadType>>);

class Authentication implements Middleware {
  private readonly enabled: boolean;
  private readonly secret: Uint8Array;
  constructor(options: AuthenticationOptions = {}) {
    this.enabled = options?.enabled ?? false;
    this.secret = new TextEncoder().encode(options?.secret ?? '');
  }
  handle = async (context: Context, next: NextFunction) => {
    if (!this.enabled) return next();
    if (!this.secret.length) throw new Unauthorized('authentication misconfigured');

    const token = context?.req?.headers?.get('authorization')?.split(' ')[1];
    if (!token) throw new Unauthorized('bearer token is missing');

    const [error, response] = await safe_verify(token, this.secret, { algorithms: ['HS256'] });
    if (error) throw new Unauthorized('invalid or expired token');

    const { payload } = response;
    context.state.set('user', payload);

    return next();
  };
}

export { Authentication };
