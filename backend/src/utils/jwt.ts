import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;

export function signJwt(payload: object, expiresIn: jwt.SignOptions['expiresIn'] = "1h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}
