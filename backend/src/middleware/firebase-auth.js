import { AppError } from '../common/errors.js';
import { devAuth } from './dev-auth.js';

function bearerToken(req) {
  const header = req.get('authorization');
  if (!header) throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required');
  const match = /^Bearer ([^\s]+)$/i.exec(header);
  if (!match) throw new AppError(401, 'INVALID_AUTH_HEADER', 'Authorization header is malformed');
  return match[1];
}

export function toFirebaseIdentity(decodedToken) {
  const signInProvider = decodedToken.firebase?.sign_in_provider || null;
  const identityProviders = decodedToken.firebase?.identities && typeof decodedToken.firebase.identities === 'object'
    ? Object.keys(decodedToken.firebase.identities)
    : [];
  const providers = Array.from(new Set([signInProvider, ...identityProviders].filter(Boolean)));

  return {
    uid: decodedToken.uid || decodedToken.sub,
    email: typeof decodedToken.email === 'string' ? decodedToken.email : null,
    emailVerified: decodedToken.email_verified === true,
    name: typeof decodedToken.name === 'string' ? decodedToken.name : null,
    picture: typeof decodedToken.picture === 'string' ? decodedToken.picture : null,
    provider: signInProvider,
    providers,
  };
}

export function firebaseAuth(tokenVerifier) {
  return async (req, _res, next) => {
    try {
      const decodedToken = await tokenVerifier.verifyIdToken(bearerToken(req));
      const identity = toFirebaseIdentity(decodedToken);
      if (!identity.uid) throw new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid');
      req.auth = identity;
      next();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[AUTH_ERROR_STAGE=token_verification]', {
          code: error?.code,
          message: error?.message,
        });
      }
      if (error instanceof AppError) return next(error);
      return next(new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid'));
    }
  };
}

export function combinedAuth({ config, tokenVerifier, userService }) {
  const verifyFirebase = firebaseAuth(tokenVerifier);
  const verifyDevelopment = devAuth(config, userService);
  return (req, res, next) => {
    if (req.get('authorization')) {
      return verifyFirebase(req, res, async (error) => {
        if (error) return next(error);
        try {
          req.user = await userService.authenticateFirebaseUser(req.auth);
          return next();
        } catch (authenticationError) {
          return next(authenticationError);
        }
      });
    }

    return verifyDevelopment(req, res, next);
  };
}
