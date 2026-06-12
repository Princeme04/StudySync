import * as crypto from 'node:crypto';

type Argon2Parameters = {
  message: Buffer;
  nonce: Buffer;
  parallelism: number;
  tagLength: number;
  memory: number;
  passes: number;
};

const { argon2, argon2Sync } = crypto as unknown as {
  argon2: (algorithm: string, parameters: Argon2Parameters, callback: (error: Error | null, result: Buffer) => void) => void;
  argon2Sync: (algorithm: string, parameters: Argon2Parameters) => Buffer;
};
const { randomBytes, timingSafeEqual } = crypto;

const ALGORITHM = 'argon2id';
const MEMORY = 65_536;
const PASSES = 3;
const PARALLELISM = 1;
const TAG_LENGTH = 32;

const parameters = (password: string, salt: Buffer) => ({
  message: Buffer.from(password, 'utf8'),
  nonce: salt,
  parallelism: PARALLELISM,
  tagLength: TAG_LENGTH,
  memory: MEMORY,
  passes: PASSES
});

const encode = (salt: Buffer, hash: Buffer) => [
  ALGORITHM,
  String(MEMORY),
  String(PASSES),
  String(PARALLELISM),
  salt.toString('base64url'),
  hash.toString('base64url')
].join('$');

const parse = (encoded: string) => {
  const [algorithm, memory, passes, parallelism, salt, hash] = encoded.split('$');
  if (algorithm !== ALGORITHM || !memory || !passes || !parallelism || !salt || !hash) return null;
  return {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
    salt: Buffer.from(salt, 'base64url'),
    hash: Buffer.from(hash, 'base64url')
  };
};

export const isPasswordHash = (value: string) => value.startsWith(`${ALGORITHM}$`);

export const hashPasswordSync = (password: string) => {
  const salt = randomBytes(16);
  return encode(salt, argon2Sync(ALGORITHM, parameters(password, salt)));
};

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    argon2(ALGORITHM, parameters(password, salt), (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  return encode(salt, hash);
};

export const verifyPassword = async (password: string, encoded: string) => {
  const parsed = parse(encoded);
  if (!parsed) return false;
  const actual = await new Promise<Buffer>((resolve, reject) => {
    argon2(ALGORITHM, {
      message: Buffer.from(password, 'utf8'),
      nonce: parsed.salt,
      parallelism: parsed.parallelism,
      tagLength: parsed.hash.length,
      memory: parsed.memory,
      passes: parsed.passes
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
  return actual.length === parsed.hash.length && timingSafeEqual(actual, parsed.hash);
};
