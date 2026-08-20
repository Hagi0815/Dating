import jwt from 'jsonwebtoken';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error('JWT_SECRET fehlt. Bitte in .env setzen (siehe .env.example).');
  }
  return s;
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}

export function getSession(request) {
  const token = request.cookies.get('session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30
};
