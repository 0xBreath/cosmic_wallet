import nacl from "tweetnacl";

/*
 * ed2curve: convert Ed25519 signing key pair into Curve25519
 * key pair suitable for Diffie-Hellman key exchange.
 *
 * Written by Dmitry Chestnykh in 2014. Public domain.
 */

// -- Operations copied from TweetNaCl.js. --
export class DiffieHellman {
  constructor() {}

  gf(init?: any): Float64Array {
    let i,
      r = new Float64Array(16);
    if (init) {
      for (i = 0; i < init.length; i++) {
        r[i] = init[i];
      }
    }
    return r;
  }

  gf0(): any {
    return this.gf();
  }

  gf1(): any {
    return this.gf([1]);
  }

  D(): any {
    return this.gf([
      0x78a3, 0x1359, 0x4dca, 0x75eb, 0xd8ab, 0x4141, 0x0a4d, 0x0070, 0xe898,
      0x7779, 0x4079, 0x8cc7, 0xfe73, 0x2b6f, 0x6cee, 0x5203,
    ]);
  }

  I(): any {
    return this.gf([
      0xa0b0, 0x4a0e, 0x1b27, 0xc4ee, 0xe478, 0xad2f, 0x1806, 0x2f43, 0xd7a7,
      0x3dfb, 0x0099, 0x2b4d, 0xdf0b, 0x4fc1, 0x2480, 0x2b83,
    ]);
  }

  car25519(o: any): void {
    let c;
    for (let i = 0; i < 16; i++) {
      o[i] += 65536;
      c = Math.floor(o[i] / 65536);
      o[(i + 1) * (i < 15 ? 1 : 0)] +=
        c - 1 + 37 * (c - 1) * (i === 15 ? 1 : 0);
      o[i] -= c * 65536;
    }
  }

  sel25519(p: any, q: any, b: any): void {
    let t,
      c = ~(b - 1);
    for (let i = 0; i < 16; i++) {
      t = c & (p[i] ^ q[i]);
      p[i] ^= t;
      q[i] ^= t;
    }
  }

  unpack25519(o: any, n: any): void {
    for (let i = 0; i < 16; i++) o[i] = n[2 * i] + (n[2 * i + 1] << 8);
    o[15] &= 0x7fff;
  }

  /// addition
  A(o: any, a: any, b: any): void {
    for (let i = 0; i < 16; i++) {
      o[i] = (a[i] + b[i]) | 0;
    }
  }

  /// subtraction
  Z(o: any, a: any, b: any): void {
    for (let i = 0; i < 16; i++) o[i] = (a[i] - b[i]) | 0;
  }

  // multiplication
  M(o: any, a: any, b: any): void {
    let t = new Float64Array(31);
    for (let i = 0; i < 31; i++) {
      t[i] = 0;
    }
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        t[i + j] += a[i] * b[j];
      }
    }
    for (let i = 0; i < 15; i++) {
      t[i] += 38 * t[i + 16];
    }
    for (let i = 0; i < 16; i++) {
      o[i] = t[i];
    }
    this.car25519(o);
    this.car25519(o);
  }

  /// squaring
  S(o: any, a: any): void {
    this.M(o, a, a);
  }

  // inversion
  inv25519(o: any, i: any): void {
    const c = this.gf();
    for (let a = 0; a < 16; a++) {
      c[a] = i[a];
    }
    for (let a = 253; a >= 0; a--) {
      this.S(c, c);
      if (a !== 2 && a !== 4) {
        this.M(c, c, i);
      }
    }
    for (let a = 0; a < 16; a++) {
      o[a] = c[a];
    }
  }

  pack25519(o: any, n: any): void {
    let b;
    let m = this.gf();
    let t = this.gf();
    for (let i = 0; i < 16; i++) {
      t[i] = n[i];
    }
    this.car25519(t);
    this.car25519(t);
    this.car25519(t);
    for (let j = 0; j < 2; j++) {
      m[0] = t[0] - 0xffed;
      for (let i = 1; i < 15; i++) {
        m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
        m[i - 1] &= 0xffff;
      }
      m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
      b = (m[15] >> 16) & 1;
      m[14] &= 0xffff;
      this.sel25519(t, m, 1 - b);
    }
    for (let i = 0; i < 16; i++) {
      o[2 * i] = t[i] & 0xff;
      o[2 * i + 1] = t[i] >> 8;
    }
  }

  par25519(a: any): number {
    let d = new Uint8Array(32);
    this.pack25519(d, a);
    return d[0] & 1;
  }

  vn(x: any, xi: any, y: any, yi: any, n: any): number {
    let d = 0;
    for (let i = 0; i < n; i++) {
      d |= x[xi + i] ^ y[yi + i];
    }
    return (1 & ((d - 1) >>> 8)) - 1;
  }

  crypto_verify_32(x: any, xi: any, y: any, yi: any): number {
    return this.vn(x, xi, y, yi, 32);
  }

  neq25519(a: any, b: any): number {
    var c = new Uint8Array(32),
      d = new Uint8Array(32);
    this.pack25519(c, a);
    this.pack25519(d, b);
    return this.crypto_verify_32(c, 0, d, 0);
  }

  pow2523(o: any, i: any): void {
    let c = this.gf();
    for (let a = 0; a < 16; a++) {
      c[a] = i[a];
    }
    for (let a = 250; a >= 0; a--) {
      this.S(c, c);
      if (a !== 1) this.M(c, c, i);
    }
    for (let a = 0; a < 16; a++) {
      o[a] = c[a];
    }
  }

  set25519(r: any, a: any): void {
    for (let i = 0; i < 16; i++) {
      r[i] = a[i] | 0;
    }
  }

  unpackneg(r: any, p: any): number {
    let t = this.gf();
    let chk = this.gf();
    let num = this.gf();
    let den = this.gf();
    let den2 = this.gf();
    let den4 = this.gf();
    let den6 = this.gf();

    this.set25519(r[2], this.gf1);
    this.unpack25519(r[1], p);
    this.S(num, r[1]);
    this.M(den, num, this.D);
    this.Z(num, num, r[2]);
    this.A(den, r[2], den);

    this.S(den2, den);
    this.S(den4, den2);
    this.M(den6, den4, den2);
    this.M(t, den6, num);
    this.M(t, t, den);

    this.pow2523(t, t);
    this.M(t, t, num);
    this.M(t, t, den);
    this.M(t, t, den);
    this.M(r[0], t, den);

    this.S(chk, r[0]);
    this.M(chk, chk, den);
    if (this.neq25519(chk, num)) {
      this.M(r[0], r[0], this.I);
    }

    this.S(chk, r[0]);
    this.M(chk, chk, den);
    if (this.neq25519(chk, num)) return -1;

    if (this.par25519(r[0]) === p[31] >> 7) {
      this.Z(r[0], this.gf0, r[0]);
    }

    this.M(r[3], r[0], r[1]);
    return 0;
  }

  // ----

  /// Converts Ed25519 public key to Curve25519 public key.
  /// montgomeryX = (edwardsY + 1)*inverse(1 - edwardsY) mod p
  public convertPublicKey(pk: any): Uint8Array | null {
    let z = new Uint8Array(32);
    let q = [this.gf(), this.gf(), this.gf(), this.gf()];
    let a = this.gf();
    let b = this.gf();

    if (this.unpackneg(q, pk)) return null; // reject invalid key

    let y = q[1];

    this.A(a, this.gf1, y);
    this.Z(b, this.gf1, y);
    this.inv25519(b, b);
    this.M(a, a, b);

    this.pack25519(z, a);
    return z;
  }

  /// Converts Ed25519 secret key to Curve25519 secret key.
  public convertSecretKey(sk: any): Uint8Array {
    let d = new Uint8Array(64);
    let o = new Uint8Array(32);

    // todo: fix this
    // @ts-ignore
    nacl.lowlevel.crypto_hash(d, sk, 32);
    d[0] &= 248;
    d[31] &= 127;
    d[31] |= 64;
    for (let i = 0; i < 32; i++) o[i] = d[i];
    for (let i = 0; i < 64; i++) d[i] = 0;
    return o;
  }

  public convertKeyPair(edKeyPair: any) {
    var publicKey = this.convertPublicKey(edKeyPair.publicKey);
    if (!publicKey) return null;
    return {
      publicKey: publicKey,
      secretKey: this.convertSecretKey(edKeyPair.secretKey),
    };
  }
}
