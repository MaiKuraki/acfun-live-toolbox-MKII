import { g as Uo, c as Pe, a as Wo } from "./_commonjsHelpers-DQNKXVTB.js";
import { _ as qo } from "./index-crb4mmSD.js";
import tt from "events";
import So from "fs";
import Le from "path";
import $o from "@aws-sdk/client-s3";
function Ho(b, m) {
  for (var c = 0; c < m.length; c++) {
    const S = m[c];
    if (typeof S != "string" && !Array.isArray(S)) {
      for (const v in S)
        if (v !== "default" && !(v in b)) {
          const e = Object.getOwnPropertyDescriptor(S, v);
          e && Object.defineProperty(b, v, e.get ? e : {
            enumerable: !0,
            get: () => S[v]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(b, Symbol.toStringTag, { value: "Module" }));
}
var Ze = {};
const Ae = /* @__PURE__ */ Uo(qo);
var Nt, Cn;
function hn() {
  if (Cn) return Nt;
  Cn = 1;
  const b = Ae, m = Ae, c = "function";
  function S() {
    if (!(this instanceof S))
      return new S();
    b.Duplex.call(this, { decodeStrings: !1, objectMode: !0 }), this.buffer = Buffer.from("");
    const v = this;
    v.on("finish", function() {
      v.finished = !0, v.emit("chunk", !1);
    });
  }
  return m.inherits(S, b.Duplex), S.prototype._write = function(v, e, s) {
    this.buffer = Buffer.concat([this.buffer, v]), this.cb = s, this.emit("chunk");
  }, S.prototype.stream = function(v, e) {
    const s = b.PassThrough();
    let r;
    const f = this;
    function g() {
      if (typeof f.cb === c) {
        const p = f.cb;
        return f.cb = void 0, p();
      }
    }
    function E() {
      let p;
      if (f.buffer && f.buffer.length) {
        if (typeof v == "number")
          p = f.buffer.slice(0, v), f.buffer = f.buffer.slice(v), v -= p.length, r = r || !v;
        else {
          let y = f.buffer.indexOf(v);
          if (y !== -1)
            f.match = y, e && (y = y + v.length), p = f.buffer.slice(0, y), f.buffer = f.buffer.slice(y), r = !0;
          else {
            const d = f.buffer.length - v.length;
            d <= 0 ? g() : (p = f.buffer.slice(0, d), f.buffer = f.buffer.slice(d));
          }
        }
        p && s.write(p, function() {
          (f.buffer.length === 0 || v.length && f.buffer.length <= v.length) && g();
        });
      }
      if (r)
        f.removeListener("chunk", E), s.end();
      else if (f.finished) {
        f.removeListener("chunk", E), f.emit("error", new Error("FILE_ENDED"));
        return;
      }
    }
    return f.on("chunk", E), E(), s;
  }, S.prototype.pull = function(v, e) {
    if (v === 0) return Promise.resolve("");
    if (!isNaN(v) && this.buffer.length > v) {
      const p = this.buffer.slice(0, v);
      return this.buffer = this.buffer.slice(v), Promise.resolve(p);
    }
    let s = Buffer.from("");
    const r = this, f = new b.Transform();
    f._transform = function(p, y, d) {
      s = Buffer.concat([s, p]), d();
    };
    let g, E;
    return new Promise(function(p, y) {
      if (g = y, E = function(d) {
        r.__emittedError = d, y(d);
      }, r.finished)
        return y(new Error("FILE_ENDED"));
      r.once("error", E), r.stream(v, e).on("error", y).pipe(f).on("finish", function() {
        p(s);
      }).on("error", y);
    }).finally(function() {
      r.removeListener("error", g), r.removeListener("error", E);
    });
  }, S.prototype._read = function() {
  }, Nt = S, Nt;
}
var Lt, Fn;
function Vo() {
  if (Fn) return Lt;
  Fn = 1;
  const b = Ae, m = Ae;
  function c() {
    if (!(this instanceof c))
      return new c();
    b.Transform.call(this);
  }
  return m.inherits(c, b.Transform), c.prototype._transform = function(S, v, e) {
    e();
  }, Lt = c, Lt;
}
var Mt, An;
function pn() {
  if (An) return Mt;
  An = 1;
  const b = Ae;
  return Mt = function(m) {
    return new Promise(function(c, S) {
      const v = [], e = b.Transform().on("finish", function() {
        c(Buffer.concat(v));
      }).on("error", S);
      e._transform = function(s, r, f) {
        v.push(s), f();
      }, m.on("error", S).pipe(e);
    });
  }, Mt;
}
var Pt, On;
function Tt() {
  if (On) return Pt;
  On = 1;
  const b = function(c, S, v) {
    let e;
    switch (v) {
      case 1:
        e = c.readUInt8(S);
        break;
      case 2:
        e = c.readUInt16LE(S);
        break;
      case 4:
        e = c.readUInt32LE(S);
        break;
      case 8:
        e = Number(c.readBigUInt64LE(S));
        break;
      default:
        throw new Error("Unsupported UInt LE size!");
    }
    return e;
  };
  return Pt = {
    parse: function(c, S) {
      const v = {};
      let e = 0;
      for (const [s, r] of S)
        c.length >= e + r ? v[s] = b(c, e, r) : v[s] = null, e += r;
      return v;
    }
  }, Pt;
}
var Ut, In;
function yn() {
  if (In) return Ut;
  In = 1;
  const b = Tt();
  return Ut = function(m, c) {
    let S;
    for (; !S && m && m.length; ) {
      const v = b.parse(m, [
        ["signature", 2],
        ["partSize", 2]
      ]);
      if (v.signature === 1) {
        const e = [];
        c.uncompressedSize === 4294967295 && e.push(["uncompressedSize", 8]), c.compressedSize === 4294967295 && e.push(["compressedSize", 8]), c.offsetToLocalFileHeader === 4294967295 && e.push(["offsetToLocalFileHeader", 8]), S = b.parse(m.slice(4), e);
      } else
        m = m.slice(v.partSize + 4);
    }
    return S = S || {}, c.compressedSize === 4294967295 && (c.compressedSize = S.compressedSize), c.uncompressedSize === 4294967295 && (c.uncompressedSize = S.uncompressedSize), c.offsetToLocalFileHeader === 4294967295 && (c.offsetToLocalFileHeader = S.offsetToLocalFileHeader), S;
  }, Ut;
}
var Wt, Dn;
function _n() {
  return Dn || (Dn = 1, Wt = function(m, c) {
    const S = m & 31, v = m >> 5 & 15, e = (m >> 9 & 127) + 1980, s = c ? (c & 31) * 2 : 0, r = c ? c >> 5 & 63 : 0, f = c ? c >> 11 : 0;
    return new Date(Date.UTC(e, v - 1, S, f, r, s));
  }), Wt;
}
var qt, Bn;
function gn() {
  if (Bn) return qt;
  Bn = 1;
  const b = Ae, m = Ae, c = Ae, S = hn(), v = Vo(), e = pn(), s = yn(), r = _n(), f = c.pipeline, g = Tt(), E = Buffer.alloc(4);
  E.writeUInt32LE(101010256, 0);
  function p(y) {
    if (!(this instanceof p))
      return new p(y);
    const d = this;
    d._opts = y || { verbose: !1 }, S.call(d, d._opts), d.on("finish", function() {
      d.emit("end"), d.emit("close");
    }), d._readRecord().catch(function(w) {
      (!d.__emittedError || d.__emittedError !== w) && d.emit("error", w);
    });
  }
  return b.inherits(p, S), p.prototype._readRecord = function() {
    const y = this;
    return y.pull(4).then(function(d) {
      if (d.length === 0)
        return;
      const w = d.readUInt32LE(0);
      if (w === 875721283)
        return y._readCrxHeader();
      if (w === 67324752)
        return y._readFile();
      if (w === 33639248)
        return y.reachedCD = !0, y._readCentralDirectoryFileHeader();
      if (w === 101010256)
        return y._readEndOfCentralDirectoryRecord();
      if (y.reachedCD)
        return y.pull(E, !0).then(function() {
          return y._readEndOfCentralDirectoryRecord();
        });
      y.emit("error", new Error("invalid signature: 0x" + w.toString(16)));
    }).then((function(d) {
      if (d)
        return y._readRecord();
    }));
  }, p.prototype._readCrxHeader = function() {
    const y = this;
    return y.pull(12).then(function(d) {
      return y.crxHeader = g.parse(d, [
        ["version", 4],
        ["pubKeyLength", 4],
        ["signatureLength", 4]
      ]), y.pull(y.crxHeader.pubKeyLength + y.crxHeader.signatureLength);
    }).then(function(d) {
      return y.crxHeader.publicKey = d.slice(0, y.crxHeader.pubKeyLength), y.crxHeader.signature = d.slice(y.crxHeader.pubKeyLength), y.emit("crx-header", y.crxHeader), !0;
    });
  }, p.prototype._readFile = function() {
    const y = this;
    return y.pull(26).then(function(d) {
      const w = g.parse(d, [
        ["versionsNeededToExtract", 2],
        ["flags", 2],
        ["compressionMethod", 2],
        ["lastModifiedTime", 2],
        ["lastModifiedDate", 2],
        ["crc32", 4],
        ["compressedSize", 4],
        ["uncompressedSize", 4],
        ["fileNameLength", 2],
        ["extraFieldLength", 2]
      ]);
      return w.lastModifiedDateTime = r(w.lastModifiedDate, w.lastModifiedTime), y.crxHeader && (w.crxHeader = y.crxHeader), y.pull(w.fileNameLength).then(function(_) {
        const i = _.toString("utf8"), t = c.PassThrough();
        let n = !1;
        return t.autodrain = function() {
          n = !0;
          const u = t.pipe(v());
          return u.promise = function() {
            return new Promise(function(k, R) {
              u.on("finish", k), u.on("error", R);
            });
          }, u;
        }, t.buffer = function() {
          return e(t);
        }, t.path = i, t.props = {}, t.props.path = i, t.props.pathBuffer = _, t.props.flags = {
          isUnicode: (w.flags & 2048) != 0
        }, t.type = w.uncompressedSize === 0 && /[/\\]$/.test(i) ? "Directory" : "File", y._opts.verbose && (t.type === "Directory" ? console.log("   creating:", i) : t.type === "File" && (w.compressionMethod === 0 ? console.log(" extracting:", i) : console.log("  inflating:", i))), y.pull(w.extraFieldLength).then(function(u) {
          const k = s(u, w);
          t.vars = w, t.extra = k, y._opts.forceStream ? y.push(t) : (y.emit("entry", t), (y._readableState.pipesCount || y._readableState.pipes && y._readableState.pipes.length) && y.push(t)), y._opts.verbose && console.log({
            filename: i,
            vars: w,
            extra: k
          });
          const R = !(w.flags & 8) || w.compressedSize > 0;
          let j;
          t.__autodraining = n;
          const U = w.compressionMethod && !n ? m.createInflateRaw() : c.PassThrough();
          return R ? (t.size = w.uncompressedSize, j = w.compressedSize) : (j = Buffer.alloc(4), j.writeUInt32LE(134695760, 0)), new Promise(function(M, Z) {
            f(
              y.stream(j),
              U,
              t,
              function(q) {
                return q ? Z(q) : R ? M(R) : y._processDataDescriptor(t).then(M).catch(Z);
              }
            );
          });
        });
      });
    });
  }, p.prototype._processDataDescriptor = function(y) {
    return this.pull(16).then(function(w) {
      const _ = g.parse(w, [
        ["dataDescriptorSignature", 4],
        ["crc32", 4],
        ["compressedSize", 4],
        ["uncompressedSize", 4]
      ]);
      return y.size = _.uncompressedSize, !0;
    });
  }, p.prototype._readCentralDirectoryFileHeader = function() {
    const y = this;
    return y.pull(42).then(function(d) {
      const w = g.parse(d, [
        ["versionMadeBy", 2],
        ["versionsNeededToExtract", 2],
        ["flags", 2],
        ["compressionMethod", 2],
        ["lastModifiedTime", 2],
        ["lastModifiedDate", 2],
        ["crc32", 4],
        ["compressedSize", 4],
        ["uncompressedSize", 4],
        ["fileNameLength", 2],
        ["extraFieldLength", 2],
        ["fileCommentLength", 2],
        ["diskNumber", 2],
        ["internalFileAttributes", 2],
        ["externalFileAttributes", 4],
        ["offsetToLocalFileHeader", 4]
      ]);
      return y.pull(w.fileNameLength).then(function(_) {
        return w.fileName = _.toString("utf8"), y.pull(w.extraFieldLength);
      }).then(function() {
        return y.pull(w.fileCommentLength);
      }).then(function() {
        return !0;
      });
    });
  }, p.prototype._readEndOfCentralDirectoryRecord = function() {
    const y = this;
    return y.pull(18).then(function(d) {
      const w = g.parse(d, [
        ["diskNumber", 2],
        ["diskStart", 2],
        ["numberOfRecordsOnDisk", 2],
        ["numberOfRecords", 2],
        ["sizeOfCentralDirectory", 4],
        ["offsetToStartOfCentralDirectory", 4],
        ["commentLength", 2]
      ]);
      return y.pull(w.commentLength).then(function() {
        y.end(), y.push(null);
      });
    });
  }, p.prototype.promise = function() {
    const y = this;
    return new Promise(function(d, w) {
      y.on("finish", d), y.on("error", w);
    });
  }, qt = p, qt;
}
var pt = { exports: {} }, yt = { exports: {} }, _t = { exports: {} }, jn;
function kt() {
  if (jn) return _t.exports;
  jn = 1, typeof process > "u" || !process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0 ? _t.exports = { nextTick: b } : _t.exports = process;
  function b(m, c, S, v) {
    if (typeof m != "function")
      throw new TypeError('"callback" argument must be a function');
    var e = arguments.length, s, r;
    switch (e) {
      case 0:
      case 1:
        return process.nextTick(m);
      case 2:
        return process.nextTick(function() {
          m.call(null, c);
        });
      case 3:
        return process.nextTick(function() {
          m.call(null, c, S);
        });
      case 4:
        return process.nextTick(function() {
          m.call(null, c, S, v);
        });
      default:
        for (s = new Array(e - 1), r = 0; r < s.length; )
          s[r++] = arguments[r];
        return process.nextTick(function() {
          m.apply(null, s);
        });
    }
  }
  return _t.exports;
}
var $t, Nn;
function zo() {
  if (Nn) return $t;
  Nn = 1;
  var b = {}.toString;
  return $t = Array.isArray || function(m) {
    return b.call(m) == "[object Array]";
  }, $t;
}
var Ht, Ln;
function Eo() {
  return Ln || (Ln = 1, Ht = tt.EventEmitter), Ht;
}
var gt = { exports: {} }, Vt = {}, st = {}, Mn;
function Go() {
  if (Mn) return st;
  Mn = 1, st.byteLength = r, st.toByteArray = g, st.fromByteArray = y;
  for (var b = [], m = [], c = typeof Uint8Array < "u" ? Uint8Array : Array, S = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", v = 0, e = S.length; v < e; ++v)
    b[v] = S[v], m[S.charCodeAt(v)] = v;
  m[45] = 62, m[95] = 63;
  function s(d) {
    var w = d.length;
    if (w % 4 > 0)
      throw new Error("Invalid string. Length must be a multiple of 4");
    var _ = d.indexOf("=");
    _ === -1 && (_ = w);
    var i = _ === w ? 0 : 4 - _ % 4;
    return [_, i];
  }
  function r(d) {
    var w = s(d), _ = w[0], i = w[1];
    return (_ + i) * 3 / 4 - i;
  }
  function f(d, w, _) {
    return (w + _) * 3 / 4 - _;
  }
  function g(d) {
    var w, _ = s(d), i = _[0], t = _[1], n = new c(f(d, i, t)), u = 0, k = t > 0 ? i - 4 : i, R;
    for (R = 0; R < k; R += 4)
      w = m[d.charCodeAt(R)] << 18 | m[d.charCodeAt(R + 1)] << 12 | m[d.charCodeAt(R + 2)] << 6 | m[d.charCodeAt(R + 3)], n[u++] = w >> 16 & 255, n[u++] = w >> 8 & 255, n[u++] = w & 255;
    return t === 2 && (w = m[d.charCodeAt(R)] << 2 | m[d.charCodeAt(R + 1)] >> 4, n[u++] = w & 255), t === 1 && (w = m[d.charCodeAt(R)] << 10 | m[d.charCodeAt(R + 1)] << 4 | m[d.charCodeAt(R + 2)] >> 2, n[u++] = w >> 8 & 255, n[u++] = w & 255), n;
  }
  function E(d) {
    return b[d >> 18 & 63] + b[d >> 12 & 63] + b[d >> 6 & 63] + b[d & 63];
  }
  function p(d, w, _) {
    for (var i, t = [], n = w; n < _; n += 3)
      i = (d[n] << 16 & 16711680) + (d[n + 1] << 8 & 65280) + (d[n + 2] & 255), t.push(E(i));
    return t.join("");
  }
  function y(d) {
    for (var w, _ = d.length, i = _ % 3, t = [], n = 16383, u = 0, k = _ - i; u < k; u += n)
      t.push(p(d, u, u + n > k ? k : u + n));
    return i === 1 ? (w = d[_ - 1], t.push(
      b[w >> 2] + b[w << 4 & 63] + "=="
    )) : i === 2 && (w = (d[_ - 2] << 8) + d[_ - 1], t.push(
      b[w >> 10] + b[w >> 4 & 63] + b[w << 2 & 63] + "="
    )), t.join("");
  }
  return st;
}
var wt = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
var Pn;
function Jo() {
  return Pn || (Pn = 1, wt.read = function(b, m, c, S, v) {
    var e, s, r = v * 8 - S - 1, f = (1 << r) - 1, g = f >> 1, E = -7, p = c ? v - 1 : 0, y = c ? -1 : 1, d = b[m + p];
    for (p += y, e = d & (1 << -E) - 1, d >>= -E, E += r; E > 0; e = e * 256 + b[m + p], p += y, E -= 8)
      ;
    for (s = e & (1 << -E) - 1, e >>= -E, E += S; E > 0; s = s * 256 + b[m + p], p += y, E -= 8)
      ;
    if (e === 0)
      e = 1 - g;
    else {
      if (e === f)
        return s ? NaN : (d ? -1 : 1) * (1 / 0);
      s = s + Math.pow(2, S), e = e - g;
    }
    return (d ? -1 : 1) * s * Math.pow(2, e - S);
  }, wt.write = function(b, m, c, S, v, e) {
    var s, r, f, g = e * 8 - v - 1, E = (1 << g) - 1, p = E >> 1, y = v === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, d = S ? 0 : e - 1, w = S ? 1 : -1, _ = m < 0 || m === 0 && 1 / m < 0 ? 1 : 0;
    for (m = Math.abs(m), isNaN(m) || m === 1 / 0 ? (r = isNaN(m) ? 1 : 0, s = E) : (s = Math.floor(Math.log(m) / Math.LN2), m * (f = Math.pow(2, -s)) < 1 && (s--, f *= 2), s + p >= 1 ? m += y / f : m += y * Math.pow(2, 1 - p), m * f >= 2 && (s++, f /= 2), s + p >= E ? (r = 0, s = E) : s + p >= 1 ? (r = (m * f - 1) * Math.pow(2, v), s = s + p) : (r = m * Math.pow(2, p - 1) * Math.pow(2, v), s = 0)); v >= 8; b[c + d] = r & 255, d += w, r /= 256, v -= 8)
      ;
    for (s = s << v | r, g += v; g > 0; b[c + d] = s & 255, d += w, s /= 256, g -= 8)
      ;
    b[c + d - w] |= _ * 128;
  }), wt;
}
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
var Un;
function $e() {
  return Un || (Un = 1, (function(b) {
    const m = Go(), c = Jo(), S = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
    b.Buffer = r, b.SlowBuffer = n, b.INSPECT_MAX_BYTES = 50;
    const v = 2147483647;
    b.kMaxLength = v, r.TYPED_ARRAY_SUPPORT = e(), !r.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
      "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
    );
    function e() {
      try {
        const x = new Uint8Array(1), o = { foo: function() {
          return 42;
        } };
        return Object.setPrototypeOf(o, Uint8Array.prototype), Object.setPrototypeOf(x, o), x.foo() === 42;
      } catch {
        return !1;
      }
    }
    Object.defineProperty(r.prototype, "parent", {
      enumerable: !0,
      get: function() {
        if (r.isBuffer(this))
          return this.buffer;
      }
    }), Object.defineProperty(r.prototype, "offset", {
      enumerable: !0,
      get: function() {
        if (r.isBuffer(this))
          return this.byteOffset;
      }
    });
    function s(x) {
      if (x > v)
        throw new RangeError('The value "' + x + '" is invalid for option "size"');
      const o = new Uint8Array(x);
      return Object.setPrototypeOf(o, r.prototype), o;
    }
    function r(x, o, l) {
      if (typeof x == "number") {
        if (typeof o == "string")
          throw new TypeError(
            'The "string" argument must be of type string. Received type number'
          );
        return p(x);
      }
      return f(x, o, l);
    }
    r.poolSize = 8192;
    function f(x, o, l) {
      if (typeof x == "string")
        return y(x, o);
      if (ArrayBuffer.isView(x))
        return w(x);
      if (x == null)
        throw new TypeError(
          "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof x
        );
      if (ie(x, ArrayBuffer) || x && ie(x.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (ie(x, SharedArrayBuffer) || x && ie(x.buffer, SharedArrayBuffer)))
        return _(x, o, l);
      if (typeof x == "number")
        throw new TypeError(
          'The "value" argument must not be of type number. Received type number'
        );
      const A = x.valueOf && x.valueOf();
      if (A != null && A !== x)
        return r.from(A, o, l);
      const V = i(x);
      if (V) return V;
      if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof x[Symbol.toPrimitive] == "function")
        return r.from(x[Symbol.toPrimitive]("string"), o, l);
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof x
      );
    }
    r.from = function(x, o, l) {
      return f(x, o, l);
    }, Object.setPrototypeOf(r.prototype, Uint8Array.prototype), Object.setPrototypeOf(r, Uint8Array);
    function g(x) {
      if (typeof x != "number")
        throw new TypeError('"size" argument must be of type number');
      if (x < 0)
        throw new RangeError('The value "' + x + '" is invalid for option "size"');
    }
    function E(x, o, l) {
      return g(x), x <= 0 ? s(x) : o !== void 0 ? typeof l == "string" ? s(x).fill(o, l) : s(x).fill(o) : s(x);
    }
    r.alloc = function(x, o, l) {
      return E(x, o, l);
    };
    function p(x) {
      return g(x), s(x < 0 ? 0 : t(x) | 0);
    }
    r.allocUnsafe = function(x) {
      return p(x);
    }, r.allocUnsafeSlow = function(x) {
      return p(x);
    };
    function y(x, o) {
      if ((typeof o != "string" || o === "") && (o = "utf8"), !r.isEncoding(o))
        throw new TypeError("Unknown encoding: " + o);
      const l = u(x, o) | 0;
      let A = s(l);
      const V = A.write(x, o);
      return V !== l && (A = A.slice(0, V)), A;
    }
    function d(x) {
      const o = x.length < 0 ? 0 : t(x.length) | 0, l = s(o);
      for (let A = 0; A < o; A += 1)
        l[A] = x[A] & 255;
      return l;
    }
    function w(x) {
      if (ie(x, Uint8Array)) {
        const o = new Uint8Array(x);
        return _(o.buffer, o.byteOffset, o.byteLength);
      }
      return d(x);
    }
    function _(x, o, l) {
      if (o < 0 || x.byteLength < o)
        throw new RangeError('"offset" is outside of buffer bounds');
      if (x.byteLength < o + (l || 0))
        throw new RangeError('"length" is outside of buffer bounds');
      let A;
      return o === void 0 && l === void 0 ? A = new Uint8Array(x) : l === void 0 ? A = new Uint8Array(x, o) : A = new Uint8Array(x, o, l), Object.setPrototypeOf(A, r.prototype), A;
    }
    function i(x) {
      if (r.isBuffer(x)) {
        const o = t(x.length) | 0, l = s(o);
        return l.length === 0 || x.copy(l, 0, 0, o), l;
      }
      if (x.length !== void 0)
        return typeof x.length != "number" || Ee(x.length) ? s(0) : d(x);
      if (x.type === "Buffer" && Array.isArray(x.data))
        return d(x.data);
    }
    function t(x) {
      if (x >= v)
        throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + v.toString(16) + " bytes");
      return x | 0;
    }
    function n(x) {
      return +x != x && (x = 0), r.alloc(+x);
    }
    r.isBuffer = function(o) {
      return o != null && o._isBuffer === !0 && o !== r.prototype;
    }, r.compare = function(o, l) {
      if (ie(o, Uint8Array) && (o = r.from(o, o.offset, o.byteLength)), ie(l, Uint8Array) && (l = r.from(l, l.offset, l.byteLength)), !r.isBuffer(o) || !r.isBuffer(l))
        throw new TypeError(
          'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
        );
      if (o === l) return 0;
      let A = o.length, V = l.length;
      for (let ee = 0, O = Math.min(A, V); ee < O; ++ee)
        if (o[ee] !== l[ee]) {
          A = o[ee], V = l[ee];
          break;
        }
      return A < V ? -1 : V < A ? 1 : 0;
    }, r.isEncoding = function(o) {
      switch (String(o).toLowerCase()) {
        case "hex":
        case "utf8":
        case "utf-8":
        case "ascii":
        case "latin1":
        case "binary":
        case "base64":
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return !0;
        default:
          return !1;
      }
    }, r.concat = function(o, l) {
      if (!Array.isArray(o))
        throw new TypeError('"list" argument must be an Array of Buffers');
      if (o.length === 0)
        return r.alloc(0);
      let A;
      if (l === void 0)
        for (l = 0, A = 0; A < o.length; ++A)
          l += o[A].length;
      const V = r.allocUnsafe(l);
      let ee = 0;
      for (A = 0; A < o.length; ++A) {
        let O = o[A];
        if (ie(O, Uint8Array))
          ee + O.length > V.length ? (r.isBuffer(O) || (O = r.from(O)), O.copy(V, ee)) : Uint8Array.prototype.set.call(
            V,
            O,
            ee
          );
        else if (r.isBuffer(O))
          O.copy(V, ee);
        else
          throw new TypeError('"list" argument must be an Array of Buffers');
        ee += O.length;
      }
      return V;
    };
    function u(x, o) {
      if (r.isBuffer(x))
        return x.length;
      if (ArrayBuffer.isView(x) || ie(x, ArrayBuffer))
        return x.byteLength;
      if (typeof x != "string")
        throw new TypeError(
          'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof x
        );
      const l = x.length, A = arguments.length > 2 && arguments[2] === !0;
      if (!A && l === 0) return 0;
      let V = !1;
      for (; ; )
        switch (o) {
          case "ascii":
          case "latin1":
          case "binary":
            return l;
          case "utf8":
          case "utf-8":
            return de(x).length;
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return l * 2;
          case "hex":
            return l >>> 1;
          case "base64":
            return le(x).length;
          default:
            if (V)
              return A ? -1 : de(x).length;
            o = ("" + o).toLowerCase(), V = !0;
        }
    }
    r.byteLength = u;
    function k(x, o, l) {
      let A = !1;
      if ((o === void 0 || o < 0) && (o = 0), o > this.length || ((l === void 0 || l > this.length) && (l = this.length), l <= 0) || (l >>>= 0, o >>>= 0, l <= o))
        return "";
      for (x || (x = "utf8"); ; )
        switch (x) {
          case "hex":
            return Y(this, o, l);
          case "utf8":
          case "utf-8":
            return te(this, o, l);
          case "ascii":
            return W(this, o, l);
          case "latin1":
          case "binary":
            return B(this, o, l);
          case "base64":
            return H(this, o, l);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return C(this, o, l);
          default:
            if (A) throw new TypeError("Unknown encoding: " + x);
            x = (x + "").toLowerCase(), A = !0;
        }
    }
    r.prototype._isBuffer = !0;
    function R(x, o, l) {
      const A = x[o];
      x[o] = x[l], x[l] = A;
    }
    r.prototype.swap16 = function() {
      const o = this.length;
      if (o % 2 !== 0)
        throw new RangeError("Buffer size must be a multiple of 16-bits");
      for (let l = 0; l < o; l += 2)
        R(this, l, l + 1);
      return this;
    }, r.prototype.swap32 = function() {
      const o = this.length;
      if (o % 4 !== 0)
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      for (let l = 0; l < o; l += 4)
        R(this, l, l + 3), R(this, l + 1, l + 2);
      return this;
    }, r.prototype.swap64 = function() {
      const o = this.length;
      if (o % 8 !== 0)
        throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (let l = 0; l < o; l += 8)
        R(this, l, l + 7), R(this, l + 1, l + 6), R(this, l + 2, l + 5), R(this, l + 3, l + 4);
      return this;
    }, r.prototype.toString = function() {
      const o = this.length;
      return o === 0 ? "" : arguments.length === 0 ? te(this, 0, o) : k.apply(this, arguments);
    }, r.prototype.toLocaleString = r.prototype.toString, r.prototype.equals = function(o) {
      if (!r.isBuffer(o)) throw new TypeError("Argument must be a Buffer");
      return this === o ? !0 : r.compare(this, o) === 0;
    }, r.prototype.inspect = function() {
      let o = "";
      const l = b.INSPECT_MAX_BYTES;
      return o = this.toString("hex", 0, l).replace(/(.{2})/g, "$1 ").trim(), this.length > l && (o += " ... "), "<Buffer " + o + ">";
    }, S && (r.prototype[S] = r.prototype.inspect), r.prototype.compare = function(o, l, A, V, ee) {
      if (ie(o, Uint8Array) && (o = r.from(o, o.offset, o.byteLength)), !r.isBuffer(o))
        throw new TypeError(
          'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof o
        );
      if (l === void 0 && (l = 0), A === void 0 && (A = o ? o.length : 0), V === void 0 && (V = 0), ee === void 0 && (ee = this.length), l < 0 || A > o.length || V < 0 || ee > this.length)
        throw new RangeError("out of range index");
      if (V >= ee && l >= A)
        return 0;
      if (V >= ee)
        return -1;
      if (l >= A)
        return 1;
      if (l >>>= 0, A >>>= 0, V >>>= 0, ee >>>= 0, this === o) return 0;
      let O = ee - V, K = A - l;
      const ae = Math.min(O, K), oe = this.slice(V, ee), be = o.slice(l, A);
      for (let ve = 0; ve < ae; ++ve)
        if (oe[ve] !== be[ve]) {
          O = oe[ve], K = be[ve];
          break;
        }
      return O < K ? -1 : K < O ? 1 : 0;
    };
    function j(x, o, l, A, V) {
      if (x.length === 0) return -1;
      if (typeof l == "string" ? (A = l, l = 0) : l > 2147483647 ? l = 2147483647 : l < -2147483648 && (l = -2147483648), l = +l, Ee(l) && (l = V ? 0 : x.length - 1), l < 0 && (l = x.length + l), l >= x.length) {
        if (V) return -1;
        l = x.length - 1;
      } else if (l < 0)
        if (V) l = 0;
        else return -1;
      if (typeof o == "string" && (o = r.from(o, A)), r.isBuffer(o))
        return o.length === 0 ? -1 : U(x, o, l, A, V);
      if (typeof o == "number")
        return o = o & 255, typeof Uint8Array.prototype.indexOf == "function" ? V ? Uint8Array.prototype.indexOf.call(x, o, l) : Uint8Array.prototype.lastIndexOf.call(x, o, l) : U(x, [o], l, A, V);
      throw new TypeError("val must be string, number or Buffer");
    }
    function U(x, o, l, A, V) {
      let ee = 1, O = x.length, K = o.length;
      if (A !== void 0 && (A = String(A).toLowerCase(), A === "ucs2" || A === "ucs-2" || A === "utf16le" || A === "utf-16le")) {
        if (x.length < 2 || o.length < 2)
          return -1;
        ee = 2, O /= 2, K /= 2, l /= 2;
      }
      function ae(be, ve) {
        return ee === 1 ? be[ve] : be.readUInt16BE(ve * ee);
      }
      let oe;
      if (V) {
        let be = -1;
        for (oe = l; oe < O; oe++)
          if (ae(x, oe) === ae(o, be === -1 ? 0 : oe - be)) {
            if (be === -1 && (be = oe), oe - be + 1 === K) return be * ee;
          } else
            be !== -1 && (oe -= oe - be), be = -1;
      } else
        for (l + K > O && (l = O - K), oe = l; oe >= 0; oe--) {
          let be = !0;
          for (let ve = 0; ve < K; ve++)
            if (ae(x, oe + ve) !== ae(o, ve)) {
              be = !1;
              break;
            }
          if (be) return oe;
        }
      return -1;
    }
    r.prototype.includes = function(o, l, A) {
      return this.indexOf(o, l, A) !== -1;
    }, r.prototype.indexOf = function(o, l, A) {
      return j(this, o, l, A, !0);
    }, r.prototype.lastIndexOf = function(o, l, A) {
      return j(this, o, l, A, !1);
    };
    function M(x, o, l, A) {
      l = Number(l) || 0;
      const V = x.length - l;
      A ? (A = Number(A), A > V && (A = V)) : A = V;
      const ee = o.length;
      A > ee / 2 && (A = ee / 2);
      let O;
      for (O = 0; O < A; ++O) {
        const K = parseInt(o.substr(O * 2, 2), 16);
        if (Ee(K)) return O;
        x[l + O] = K;
      }
      return O;
    }
    function Z(x, o, l, A) {
      return ye(de(o, x.length - l), x, l, A);
    }
    function q(x, o, l, A) {
      return ye(ce(o), x, l, A);
    }
    function Q(x, o, l, A) {
      return ye(le(o), x, l, A);
    }
    function re(x, o, l, A) {
      return ye(z(o, x.length - l), x, l, A);
    }
    r.prototype.write = function(o, l, A, V) {
      if (l === void 0)
        V = "utf8", A = this.length, l = 0;
      else if (A === void 0 && typeof l == "string")
        V = l, A = this.length, l = 0;
      else if (isFinite(l))
        l = l >>> 0, isFinite(A) ? (A = A >>> 0, V === void 0 && (V = "utf8")) : (V = A, A = void 0);
      else
        throw new Error(
          "Buffer.write(string, encoding, offset[, length]) is no longer supported"
        );
      const ee = this.length - l;
      if ((A === void 0 || A > ee) && (A = ee), o.length > 0 && (A < 0 || l < 0) || l > this.length)
        throw new RangeError("Attempt to write outside buffer bounds");
      V || (V = "utf8");
      let O = !1;
      for (; ; )
        switch (V) {
          case "hex":
            return M(this, o, l, A);
          case "utf8":
          case "utf-8":
            return Z(this, o, l, A);
          case "ascii":
          case "latin1":
          case "binary":
            return q(this, o, l, A);
          case "base64":
            return Q(this, o, l, A);
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
            return re(this, o, l, A);
          default:
            if (O) throw new TypeError("Unknown encoding: " + V);
            V = ("" + V).toLowerCase(), O = !0;
        }
    }, r.prototype.toJSON = function() {
      return {
        type: "Buffer",
        data: Array.prototype.slice.call(this._arr || this, 0)
      };
    };
    function H(x, o, l) {
      return o === 0 && l === x.length ? m.fromByteArray(x) : m.fromByteArray(x.slice(o, l));
    }
    function te(x, o, l) {
      l = Math.min(x.length, l);
      const A = [];
      let V = o;
      for (; V < l; ) {
        const ee = x[V];
        let O = null, K = ee > 239 ? 4 : ee > 223 ? 3 : ee > 191 ? 2 : 1;
        if (V + K <= l) {
          let ae, oe, be, ve;
          switch (K) {
            case 1:
              ee < 128 && (O = ee);
              break;
            case 2:
              ae = x[V + 1], (ae & 192) === 128 && (ve = (ee & 31) << 6 | ae & 63, ve > 127 && (O = ve));
              break;
            case 3:
              ae = x[V + 1], oe = x[V + 2], (ae & 192) === 128 && (oe & 192) === 128 && (ve = (ee & 15) << 12 | (ae & 63) << 6 | oe & 63, ve > 2047 && (ve < 55296 || ve > 57343) && (O = ve));
              break;
            case 4:
              ae = x[V + 1], oe = x[V + 2], be = x[V + 3], (ae & 192) === 128 && (oe & 192) === 128 && (be & 192) === 128 && (ve = (ee & 15) << 18 | (ae & 63) << 12 | (oe & 63) << 6 | be & 63, ve > 65535 && ve < 1114112 && (O = ve));
          }
        }
        O === null ? (O = 65533, K = 1) : O > 65535 && (O -= 65536, A.push(O >>> 10 & 1023 | 55296), O = 56320 | O & 1023), A.push(O), V += K;
      }
      return fe(A);
    }
    const ue = 4096;
    function fe(x) {
      const o = x.length;
      if (o <= ue)
        return String.fromCharCode.apply(String, x);
      let l = "", A = 0;
      for (; A < o; )
        l += String.fromCharCode.apply(
          String,
          x.slice(A, A += ue)
        );
      return l;
    }
    function W(x, o, l) {
      let A = "";
      l = Math.min(x.length, l);
      for (let V = o; V < l; ++V)
        A += String.fromCharCode(x[V] & 127);
      return A;
    }
    function B(x, o, l) {
      let A = "";
      l = Math.min(x.length, l);
      for (let V = o; V < l; ++V)
        A += String.fromCharCode(x[V]);
      return A;
    }
    function Y(x, o, l) {
      const A = x.length;
      (!o || o < 0) && (o = 0), (!l || l < 0 || l > A) && (l = A);
      let V = "";
      for (let ee = o; ee < l; ++ee)
        V += ke[x[ee]];
      return V;
    }
    function C(x, o, l) {
      const A = x.slice(o, l);
      let V = "";
      for (let ee = 0; ee < A.length - 1; ee += 2)
        V += String.fromCharCode(A[ee] + A[ee + 1] * 256);
      return V;
    }
    r.prototype.slice = function(o, l) {
      const A = this.length;
      o = ~~o, l = l === void 0 ? A : ~~l, o < 0 ? (o += A, o < 0 && (o = 0)) : o > A && (o = A), l < 0 ? (l += A, l < 0 && (l = 0)) : l > A && (l = A), l < o && (l = o);
      const V = this.subarray(o, l);
      return Object.setPrototypeOf(V, r.prototype), V;
    };
    function G(x, o, l) {
      if (x % 1 !== 0 || x < 0) throw new RangeError("offset is not uint");
      if (x + o > l) throw new RangeError("Trying to access beyond buffer length");
    }
    r.prototype.readUintLE = r.prototype.readUIntLE = function(o, l, A) {
      o = o >>> 0, l = l >>> 0, A || G(o, l, this.length);
      let V = this[o], ee = 1, O = 0;
      for (; ++O < l && (ee *= 256); )
        V += this[o + O] * ee;
      return V;
    }, r.prototype.readUintBE = r.prototype.readUIntBE = function(o, l, A) {
      o = o >>> 0, l = l >>> 0, A || G(o, l, this.length);
      let V = this[o + --l], ee = 1;
      for (; l > 0 && (ee *= 256); )
        V += this[o + --l] * ee;
      return V;
    }, r.prototype.readUint8 = r.prototype.readUInt8 = function(o, l) {
      return o = o >>> 0, l || G(o, 1, this.length), this[o];
    }, r.prototype.readUint16LE = r.prototype.readUInt16LE = function(o, l) {
      return o = o >>> 0, l || G(o, 2, this.length), this[o] | this[o + 1] << 8;
    }, r.prototype.readUint16BE = r.prototype.readUInt16BE = function(o, l) {
      return o = o >>> 0, l || G(o, 2, this.length), this[o] << 8 | this[o + 1];
    }, r.prototype.readUint32LE = r.prototype.readUInt32LE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), (this[o] | this[o + 1] << 8 | this[o + 2] << 16) + this[o + 3] * 16777216;
    }, r.prototype.readUint32BE = r.prototype.readUInt32BE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), this[o] * 16777216 + (this[o + 1] << 16 | this[o + 2] << 8 | this[o + 3]);
    }, r.prototype.readBigUInt64LE = Se(function(o) {
      o = o >>> 0, F(o, "offset");
      const l = this[o], A = this[o + 7];
      (l === void 0 || A === void 0) && P(o, this.length - 8);
      const V = l + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + this[++o] * 2 ** 24, ee = this[++o] + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + A * 2 ** 24;
      return BigInt(V) + (BigInt(ee) << BigInt(32));
    }), r.prototype.readBigUInt64BE = Se(function(o) {
      o = o >>> 0, F(o, "offset");
      const l = this[o], A = this[o + 7];
      (l === void 0 || A === void 0) && P(o, this.length - 8);
      const V = l * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + this[++o], ee = this[++o] * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + A;
      return (BigInt(V) << BigInt(32)) + BigInt(ee);
    }), r.prototype.readIntLE = function(o, l, A) {
      o = o >>> 0, l = l >>> 0, A || G(o, l, this.length);
      let V = this[o], ee = 1, O = 0;
      for (; ++O < l && (ee *= 256); )
        V += this[o + O] * ee;
      return ee *= 128, V >= ee && (V -= Math.pow(2, 8 * l)), V;
    }, r.prototype.readIntBE = function(o, l, A) {
      o = o >>> 0, l = l >>> 0, A || G(o, l, this.length);
      let V = l, ee = 1, O = this[o + --V];
      for (; V > 0 && (ee *= 256); )
        O += this[o + --V] * ee;
      return ee *= 128, O >= ee && (O -= Math.pow(2, 8 * l)), O;
    }, r.prototype.readInt8 = function(o, l) {
      return o = o >>> 0, l || G(o, 1, this.length), this[o] & 128 ? (255 - this[o] + 1) * -1 : this[o];
    }, r.prototype.readInt16LE = function(o, l) {
      o = o >>> 0, l || G(o, 2, this.length);
      const A = this[o] | this[o + 1] << 8;
      return A & 32768 ? A | 4294901760 : A;
    }, r.prototype.readInt16BE = function(o, l) {
      o = o >>> 0, l || G(o, 2, this.length);
      const A = this[o + 1] | this[o] << 8;
      return A & 32768 ? A | 4294901760 : A;
    }, r.prototype.readInt32LE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), this[o] | this[o + 1] << 8 | this[o + 2] << 16 | this[o + 3] << 24;
    }, r.prototype.readInt32BE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), this[o] << 24 | this[o + 1] << 16 | this[o + 2] << 8 | this[o + 3];
    }, r.prototype.readBigInt64LE = Se(function(o) {
      o = o >>> 0, F(o, "offset");
      const l = this[o], A = this[o + 7];
      (l === void 0 || A === void 0) && P(o, this.length - 8);
      const V = this[o + 4] + this[o + 5] * 2 ** 8 + this[o + 6] * 2 ** 16 + (A << 24);
      return (BigInt(V) << BigInt(32)) + BigInt(l + this[++o] * 2 ** 8 + this[++o] * 2 ** 16 + this[++o] * 2 ** 24);
    }), r.prototype.readBigInt64BE = Se(function(o) {
      o = o >>> 0, F(o, "offset");
      const l = this[o], A = this[o + 7];
      (l === void 0 || A === void 0) && P(o, this.length - 8);
      const V = (l << 24) + // Overflow
      this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + this[++o];
      return (BigInt(V) << BigInt(32)) + BigInt(this[++o] * 2 ** 24 + this[++o] * 2 ** 16 + this[++o] * 2 ** 8 + A);
    }), r.prototype.readFloatLE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), c.read(this, o, !0, 23, 4);
    }, r.prototype.readFloatBE = function(o, l) {
      return o = o >>> 0, l || G(o, 4, this.length), c.read(this, o, !1, 23, 4);
    }, r.prototype.readDoubleLE = function(o, l) {
      return o = o >>> 0, l || G(o, 8, this.length), c.read(this, o, !0, 52, 8);
    }, r.prototype.readDoubleBE = function(o, l) {
      return o = o >>> 0, l || G(o, 8, this.length), c.read(this, o, !1, 52, 8);
    };
    function ne(x, o, l, A, V, ee) {
      if (!r.isBuffer(x)) throw new TypeError('"buffer" argument must be a Buffer instance');
      if (o > V || o < ee) throw new RangeError('"value" argument is out of bounds');
      if (l + A > x.length) throw new RangeError("Index out of range");
    }
    r.prototype.writeUintLE = r.prototype.writeUIntLE = function(o, l, A, V) {
      if (o = +o, l = l >>> 0, A = A >>> 0, !V) {
        const K = Math.pow(2, 8 * A) - 1;
        ne(this, o, l, A, K, 0);
      }
      let ee = 1, O = 0;
      for (this[l] = o & 255; ++O < A && (ee *= 256); )
        this[l + O] = o / ee & 255;
      return l + A;
    }, r.prototype.writeUintBE = r.prototype.writeUIntBE = function(o, l, A, V) {
      if (o = +o, l = l >>> 0, A = A >>> 0, !V) {
        const K = Math.pow(2, 8 * A) - 1;
        ne(this, o, l, A, K, 0);
      }
      let ee = A - 1, O = 1;
      for (this[l + ee] = o & 255; --ee >= 0 && (O *= 256); )
        this[l + ee] = o / O & 255;
      return l + A;
    }, r.prototype.writeUint8 = r.prototype.writeUInt8 = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 1, 255, 0), this[l] = o & 255, l + 1;
    }, r.prototype.writeUint16LE = r.prototype.writeUInt16LE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 2, 65535, 0), this[l] = o & 255, this[l + 1] = o >>> 8, l + 2;
    }, r.prototype.writeUint16BE = r.prototype.writeUInt16BE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 2, 65535, 0), this[l] = o >>> 8, this[l + 1] = o & 255, l + 2;
    }, r.prototype.writeUint32LE = r.prototype.writeUInt32LE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 4, 4294967295, 0), this[l + 3] = o >>> 24, this[l + 2] = o >>> 16, this[l + 1] = o >>> 8, this[l] = o & 255, l + 4;
    }, r.prototype.writeUint32BE = r.prototype.writeUInt32BE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 4, 4294967295, 0), this[l] = o >>> 24, this[l + 1] = o >>> 16, this[l + 2] = o >>> 8, this[l + 3] = o & 255, l + 4;
    };
    function D(x, o, l, A, V) {
      $(o, A, V, x, l, 7);
      let ee = Number(o & BigInt(4294967295));
      x[l++] = ee, ee = ee >> 8, x[l++] = ee, ee = ee >> 8, x[l++] = ee, ee = ee >> 8, x[l++] = ee;
      let O = Number(o >> BigInt(32) & BigInt(4294967295));
      return x[l++] = O, O = O >> 8, x[l++] = O, O = O >> 8, x[l++] = O, O = O >> 8, x[l++] = O, l;
    }
    function he(x, o, l, A, V) {
      $(o, A, V, x, l, 7);
      let ee = Number(o & BigInt(4294967295));
      x[l + 7] = ee, ee = ee >> 8, x[l + 6] = ee, ee = ee >> 8, x[l + 5] = ee, ee = ee >> 8, x[l + 4] = ee;
      let O = Number(o >> BigInt(32) & BigInt(4294967295));
      return x[l + 3] = O, O = O >> 8, x[l + 2] = O, O = O >> 8, x[l + 1] = O, O = O >> 8, x[l] = O, l + 8;
    }
    r.prototype.writeBigUInt64LE = Se(function(o, l = 0) {
      return D(this, o, l, BigInt(0), BigInt("0xffffffffffffffff"));
    }), r.prototype.writeBigUInt64BE = Se(function(o, l = 0) {
      return he(this, o, l, BigInt(0), BigInt("0xffffffffffffffff"));
    }), r.prototype.writeIntLE = function(o, l, A, V) {
      if (o = +o, l = l >>> 0, !V) {
        const ae = Math.pow(2, 8 * A - 1);
        ne(this, o, l, A, ae - 1, -ae);
      }
      let ee = 0, O = 1, K = 0;
      for (this[l] = o & 255; ++ee < A && (O *= 256); )
        o < 0 && K === 0 && this[l + ee - 1] !== 0 && (K = 1), this[l + ee] = (o / O >> 0) - K & 255;
      return l + A;
    }, r.prototype.writeIntBE = function(o, l, A, V) {
      if (o = +o, l = l >>> 0, !V) {
        const ae = Math.pow(2, 8 * A - 1);
        ne(this, o, l, A, ae - 1, -ae);
      }
      let ee = A - 1, O = 1, K = 0;
      for (this[l + ee] = o & 255; --ee >= 0 && (O *= 256); )
        o < 0 && K === 0 && this[l + ee + 1] !== 0 && (K = 1), this[l + ee] = (o / O >> 0) - K & 255;
      return l + A;
    }, r.prototype.writeInt8 = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 1, 127, -128), o < 0 && (o = 255 + o + 1), this[l] = o & 255, l + 1;
    }, r.prototype.writeInt16LE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 2, 32767, -32768), this[l] = o & 255, this[l + 1] = o >>> 8, l + 2;
    }, r.prototype.writeInt16BE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 2, 32767, -32768), this[l] = o >>> 8, this[l + 1] = o & 255, l + 2;
    }, r.prototype.writeInt32LE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 4, 2147483647, -2147483648), this[l] = o & 255, this[l + 1] = o >>> 8, this[l + 2] = o >>> 16, this[l + 3] = o >>> 24, l + 4;
    }, r.prototype.writeInt32BE = function(o, l, A) {
      return o = +o, l = l >>> 0, A || ne(this, o, l, 4, 2147483647, -2147483648), o < 0 && (o = 4294967295 + o + 1), this[l] = o >>> 24, this[l + 1] = o >>> 16, this[l + 2] = o >>> 8, this[l + 3] = o & 255, l + 4;
    }, r.prototype.writeBigInt64LE = Se(function(o, l = 0) {
      return D(this, o, l, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    }), r.prototype.writeBigInt64BE = Se(function(o, l = 0) {
      return he(this, o, l, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    });
    function se(x, o, l, A, V, ee) {
      if (l + A > x.length) throw new RangeError("Index out of range");
      if (l < 0) throw new RangeError("Index out of range");
    }
    function _e(x, o, l, A, V) {
      return o = +o, l = l >>> 0, V || se(x, o, l, 4), c.write(x, o, l, A, 23, 4), l + 4;
    }
    r.prototype.writeFloatLE = function(o, l, A) {
      return _e(this, o, l, !0, A);
    }, r.prototype.writeFloatBE = function(o, l, A) {
      return _e(this, o, l, !1, A);
    };
    function h(x, o, l, A, V) {
      return o = +o, l = l >>> 0, V || se(x, o, l, 8), c.write(x, o, l, A, 52, 8), l + 8;
    }
    r.prototype.writeDoubleLE = function(o, l, A) {
      return h(this, o, l, !0, A);
    }, r.prototype.writeDoubleBE = function(o, l, A) {
      return h(this, o, l, !1, A);
    }, r.prototype.copy = function(o, l, A, V) {
      if (!r.isBuffer(o)) throw new TypeError("argument should be a Buffer");
      if (A || (A = 0), !V && V !== 0 && (V = this.length), l >= o.length && (l = o.length), l || (l = 0), V > 0 && V < A && (V = A), V === A || o.length === 0 || this.length === 0) return 0;
      if (l < 0)
        throw new RangeError("targetStart out of bounds");
      if (A < 0 || A >= this.length) throw new RangeError("Index out of range");
      if (V < 0) throw new RangeError("sourceEnd out of bounds");
      V > this.length && (V = this.length), o.length - l < V - A && (V = o.length - l + A);
      const ee = V - A;
      return this === o && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(l, A, V) : Uint8Array.prototype.set.call(
        o,
        this.subarray(A, V),
        l
      ), ee;
    }, r.prototype.fill = function(o, l, A, V) {
      if (typeof o == "string") {
        if (typeof l == "string" ? (V = l, l = 0, A = this.length) : typeof A == "string" && (V = A, A = this.length), V !== void 0 && typeof V != "string")
          throw new TypeError("encoding must be a string");
        if (typeof V == "string" && !r.isEncoding(V))
          throw new TypeError("Unknown encoding: " + V);
        if (o.length === 1) {
          const O = o.charCodeAt(0);
          (V === "utf8" && O < 128 || V === "latin1") && (o = O);
        }
      } else typeof o == "number" ? o = o & 255 : typeof o == "boolean" && (o = Number(o));
      if (l < 0 || this.length < l || this.length < A)
        throw new RangeError("Out of range index");
      if (A <= l)
        return this;
      l = l >>> 0, A = A === void 0 ? this.length : A >>> 0, o || (o = 0);
      let ee;
      if (typeof o == "number")
        for (ee = l; ee < A; ++ee)
          this[ee] = o;
      else {
        const O = r.isBuffer(o) ? o : r.from(o, V), K = O.length;
        if (K === 0)
          throw new TypeError('The value "' + o + '" is invalid for argument "value"');
        for (ee = 0; ee < A - l; ++ee)
          this[ee + l] = O[ee % K];
      }
      return this;
    };
    const a = {};
    function T(x, o, l) {
      a[x] = class extends l {
        constructor() {
          super(), Object.defineProperty(this, "message", {
            value: o.apply(this, arguments),
            writable: !0,
            configurable: !0
          }), this.name = `${this.name} [${x}]`, this.stack, delete this.name;
        }
        get code() {
          return x;
        }
        set code(V) {
          Object.defineProperty(this, "code", {
            configurable: !0,
            enumerable: !0,
            value: V,
            writable: !0
          });
        }
        toString() {
          return `${this.name} [${x}]: ${this.message}`;
        }
      };
    }
    T(
      "ERR_BUFFER_OUT_OF_BOUNDS",
      function(x) {
        return x ? `${x} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
      },
      RangeError
    ), T(
      "ERR_INVALID_ARG_TYPE",
      function(x, o) {
        return `The "${x}" argument must be of type number. Received type ${typeof o}`;
      },
      TypeError
    ), T(
      "ERR_OUT_OF_RANGE",
      function(x, o, l) {
        let A = `The value of "${x}" is out of range.`, V = l;
        return Number.isInteger(l) && Math.abs(l) > 2 ** 32 ? V = N(String(l)) : typeof l == "bigint" && (V = String(l), (l > BigInt(2) ** BigInt(32) || l < -(BigInt(2) ** BigInt(32))) && (V = N(V)), V += "n"), A += ` It must be ${o}. Received ${V}`, A;
      },
      RangeError
    );
    function N(x) {
      let o = "", l = x.length;
      const A = x[0] === "-" ? 1 : 0;
      for (; l >= A + 4; l -= 3)
        o = `_${x.slice(l - 3, l)}${o}`;
      return `${x.slice(0, l)}${o}`;
    }
    function J(x, o, l) {
      F(o, "offset"), (x[o] === void 0 || x[o + l] === void 0) && P(o, x.length - (l + 1));
    }
    function $(x, o, l, A, V, ee) {
      if (x > l || x < o) {
        const O = typeof o == "bigint" ? "n" : "";
        let K;
        throw o === 0 || o === BigInt(0) ? K = `>= 0${O} and < 2${O} ** ${(ee + 1) * 8}${O}` : K = `>= -(2${O} ** ${(ee + 1) * 8 - 1}${O}) and < 2 ** ${(ee + 1) * 8 - 1}${O}`, new a.ERR_OUT_OF_RANGE("value", K, x);
      }
      J(A, V, ee);
    }
    function F(x, o) {
      if (typeof x != "number")
        throw new a.ERR_INVALID_ARG_TYPE(o, "number", x);
    }
    function P(x, o, l) {
      throw Math.floor(x) !== x ? (F(x, l), new a.ERR_OUT_OF_RANGE("offset", "an integer", x)) : o < 0 ? new a.ERR_BUFFER_OUT_OF_BOUNDS() : new a.ERR_OUT_OF_RANGE(
        "offset",
        `>= 0 and <= ${o}`,
        x
      );
    }
    const X = /[^+/0-9A-Za-z-_]/g;
    function pe(x) {
      if (x = x.split("=")[0], x = x.trim().replace(X, ""), x.length < 2) return "";
      for (; x.length % 4 !== 0; )
        x = x + "=";
      return x;
    }
    function de(x, o) {
      o = o || 1 / 0;
      let l;
      const A = x.length;
      let V = null;
      const ee = [];
      for (let O = 0; O < A; ++O) {
        if (l = x.charCodeAt(O), l > 55295 && l < 57344) {
          if (!V) {
            if (l > 56319) {
              (o -= 3) > -1 && ee.push(239, 191, 189);
              continue;
            } else if (O + 1 === A) {
              (o -= 3) > -1 && ee.push(239, 191, 189);
              continue;
            }
            V = l;
            continue;
          }
          if (l < 56320) {
            (o -= 3) > -1 && ee.push(239, 191, 189), V = l;
            continue;
          }
          l = (V - 55296 << 10 | l - 56320) + 65536;
        } else V && (o -= 3) > -1 && ee.push(239, 191, 189);
        if (V = null, l < 128) {
          if ((o -= 1) < 0) break;
          ee.push(l);
        } else if (l < 2048) {
          if ((o -= 2) < 0) break;
          ee.push(
            l >> 6 | 192,
            l & 63 | 128
          );
        } else if (l < 65536) {
          if ((o -= 3) < 0) break;
          ee.push(
            l >> 12 | 224,
            l >> 6 & 63 | 128,
            l & 63 | 128
          );
        } else if (l < 1114112) {
          if ((o -= 4) < 0) break;
          ee.push(
            l >> 18 | 240,
            l >> 12 & 63 | 128,
            l >> 6 & 63 | 128,
            l & 63 | 128
          );
        } else
          throw new Error("Invalid code point");
      }
      return ee;
    }
    function ce(x) {
      const o = [];
      for (let l = 0; l < x.length; ++l)
        o.push(x.charCodeAt(l) & 255);
      return o;
    }
    function z(x, o) {
      let l, A, V;
      const ee = [];
      for (let O = 0; O < x.length && !((o -= 2) < 0); ++O)
        l = x.charCodeAt(O), A = l >> 8, V = l % 256, ee.push(V), ee.push(A);
      return ee;
    }
    function le(x) {
      return m.toByteArray(pe(x));
    }
    function ye(x, o, l, A) {
      let V;
      for (V = 0; V < A && !(V + l >= o.length || V >= x.length); ++V)
        o[V + l] = x[V];
      return V;
    }
    function ie(x, o) {
      return x instanceof o || x != null && x.constructor != null && x.constructor.name != null && x.constructor.name === o.name;
    }
    function Ee(x) {
      return x !== x;
    }
    const ke = (function() {
      const x = "0123456789abcdef", o = new Array(256);
      for (let l = 0; l < 16; ++l) {
        const A = l * 16;
        for (let V = 0; V < 16; ++V)
          o[A + V] = x[l] + x[V];
      }
      return o;
    })();
    function Se(x) {
      return typeof BigInt > "u" ? Oe : x;
    }
    function Oe() {
      throw new Error("BigInt not supported");
    }
  })(Vt)), Vt;
}
var Wn;
function Ct() {
  return Wn || (Wn = 1, (function(b, m) {
    var c = $e(), S = c.Buffer;
    function v(s, r) {
      for (var f in s)
        r[f] = s[f];
    }
    S.from && S.alloc && S.allocUnsafe && S.allocUnsafeSlow ? b.exports = c : (v(c, m), m.Buffer = e);
    function e(s, r, f) {
      return S(s, r, f);
    }
    v(S, e), e.from = function(s, r, f) {
      if (typeof s == "number")
        throw new TypeError("Argument must not be a number");
      return S(s, r, f);
    }, e.alloc = function(s, r, f) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      var g = S(s);
      return r !== void 0 ? typeof f == "string" ? g.fill(r, f) : g.fill(r) : g.fill(0), g;
    }, e.allocUnsafe = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return S(s);
    }, e.allocUnsafeSlow = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return c.SlowBuffer(s);
    };
  })(gt, gt.exports)), gt.exports;
}
var Ie = {}, qn;
function ft() {
  if (qn) return Ie;
  qn = 1;
  function b(_) {
    return Array.isArray ? Array.isArray(_) : w(_) === "[object Array]";
  }
  Ie.isArray = b;
  function m(_) {
    return typeof _ == "boolean";
  }
  Ie.isBoolean = m;
  function c(_) {
    return _ === null;
  }
  Ie.isNull = c;
  function S(_) {
    return _ == null;
  }
  Ie.isNullOrUndefined = S;
  function v(_) {
    return typeof _ == "number";
  }
  Ie.isNumber = v;
  function e(_) {
    return typeof _ == "string";
  }
  Ie.isString = e;
  function s(_) {
    return typeof _ == "symbol";
  }
  Ie.isSymbol = s;
  function r(_) {
    return _ === void 0;
  }
  Ie.isUndefined = r;
  function f(_) {
    return w(_) === "[object RegExp]";
  }
  Ie.isRegExp = f;
  function g(_) {
    return typeof _ == "object" && _ !== null;
  }
  Ie.isObject = g;
  function E(_) {
    return w(_) === "[object Date]";
  }
  Ie.isDate = E;
  function p(_) {
    return w(_) === "[object Error]" || _ instanceof Error;
  }
  Ie.isError = p;
  function y(_) {
    return typeof _ == "function";
  }
  Ie.isFunction = y;
  function d(_) {
    return _ === null || typeof _ == "boolean" || typeof _ == "number" || typeof _ == "string" || typeof _ == "symbol" || // ES6 symbol
    typeof _ > "u";
  }
  Ie.isPrimitive = d, Ie.isBuffer = $e().Buffer.isBuffer;
  function w(_) {
    return Object.prototype.toString.call(_);
  }
  return Ie;
}
var bt = { exports: {} }, $n;
function ct() {
  return $n || ($n = 1, typeof Object.create == "function" ? bt.exports = function(m, c) {
    c && (m.super_ = c, m.prototype = Object.create(c.prototype, {
      constructor: {
        value: m,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }));
  } : bt.exports = function(m, c) {
    if (c) {
      m.super_ = c;
      var S = function() {
      };
      S.prototype = c.prototype, m.prototype = new S(), m.prototype.constructor = m;
    }
  }), bt.exports;
}
var zt = { exports: {} }, Hn;
function Ko() {
  return Hn || (Hn = 1, (function(b) {
    function m(e, s) {
      if (!(e instanceof s))
        throw new TypeError("Cannot call a class as a function");
    }
    var c = Ct().Buffer, S = Ae;
    function v(e, s, r) {
      e.copy(s, r);
    }
    b.exports = (function() {
      function e() {
        m(this, e), this.head = null, this.tail = null, this.length = 0;
      }
      return e.prototype.push = function(r) {
        var f = { data: r, next: null };
        this.length > 0 ? this.tail.next = f : this.head = f, this.tail = f, ++this.length;
      }, e.prototype.unshift = function(r) {
        var f = { data: r, next: this.head };
        this.length === 0 && (this.tail = f), this.head = f, ++this.length;
      }, e.prototype.shift = function() {
        if (this.length !== 0) {
          var r = this.head.data;
          return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
        }
      }, e.prototype.clear = function() {
        this.head = this.tail = null, this.length = 0;
      }, e.prototype.join = function(r) {
        if (this.length === 0) return "";
        for (var f = this.head, g = "" + f.data; f = f.next; )
          g += r + f.data;
        return g;
      }, e.prototype.concat = function(r) {
        if (this.length === 0) return c.alloc(0);
        for (var f = c.allocUnsafe(r >>> 0), g = this.head, E = 0; g; )
          v(g.data, f, E), E += g.data.length, g = g.next;
        return f;
      }, e;
    })(), S && S.inspect && S.inspect.custom && (b.exports.prototype[S.inspect.custom] = function() {
      var e = S.inspect({ length: this.length });
      return this.constructor.name + " " + e;
    });
  })(zt)), zt.exports;
}
var Gt, Vn;
function xo() {
  if (Vn) return Gt;
  Vn = 1;
  var b = kt();
  function m(v, e) {
    var s = this, r = this._readableState && this._readableState.destroyed, f = this._writableState && this._writableState.destroyed;
    return r || f ? (e ? e(v) : v && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, b.nextTick(S, this, v)) : b.nextTick(S, this, v)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(v || null, function(g) {
      !e && g ? s._writableState ? s._writableState.errorEmitted || (s._writableState.errorEmitted = !0, b.nextTick(S, s, g)) : b.nextTick(S, s, g) : e && e(g);
    }), this);
  }
  function c() {
    this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
  }
  function S(v, e) {
    v.emit("error", e);
  }
  return Gt = {
    destroy: m,
    undestroy: c
  }, Gt;
}
var Jt, zn;
function Yo() {
  if (zn) return Jt;
  zn = 1, Jt = b;
  function b(c, S) {
    if (m("noDeprecation"))
      return c;
    var v = !1;
    function e() {
      if (!v) {
        if (m("throwDeprecation"))
          throw new Error(S);
        m("traceDeprecation") ? console.trace(S) : console.warn(S), v = !0;
      }
      return c.apply(this, arguments);
    }
    return e;
  }
  function m(c) {
    try {
      if (!Pe.localStorage) return !1;
    } catch {
      return !1;
    }
    var S = Pe.localStorage[c];
    return S == null ? !1 : String(S).toLowerCase() === "true";
  }
  return Jt;
}
var Kt, Gn;
function Ro() {
  if (Gn) return Kt;
  Gn = 1;
  var b = kt();
  Kt = _;
  function m(W) {
    var B = this;
    this.next = null, this.entry = null, this.finish = function() {
      fe(B, W);
    };
  }
  var c = !process.browser && ["v0.10", "v0.9."].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : b.nextTick, S;
  _.WritableState = d;
  var v = Object.create(ft());
  v.inherits = ct();
  var e = {
    deprecate: Yo()
  }, s = Eo(), r = Ct().Buffer, f = (typeof Pe < "u" ? Pe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function g(W) {
    return r.from(W);
  }
  function E(W) {
    return r.isBuffer(W) || W instanceof f;
  }
  var p = xo();
  v.inherits(_, s);
  function y() {
  }
  function d(W, B) {
    S = S || et(), W = W || {};
    var Y = B instanceof S;
    this.objectMode = !!W.objectMode, Y && (this.objectMode = this.objectMode || !!W.writableObjectMode);
    var C = W.highWaterMark, G = W.writableHighWaterMark, ne = this.objectMode ? 16 : 16 * 1024;
    C || C === 0 ? this.highWaterMark = C : Y && (G || G === 0) ? this.highWaterMark = G : this.highWaterMark = ne, this.highWaterMark = Math.floor(this.highWaterMark), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    var D = W.decodeStrings === !1;
    this.decodeStrings = !D, this.defaultEncoding = W.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(he) {
      U(B, he);
    }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.bufferedRequestCount = 0, this.corkedRequestsFree = new m(this);
  }
  d.prototype.getBuffer = function() {
    for (var B = this.bufferedRequest, Y = []; B; )
      Y.push(B), B = B.next;
    return Y;
  }, (function() {
    try {
      Object.defineProperty(d.prototype, "buffer", {
        get: e.deprecate(function() {
          return this.getBuffer();
        }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
      });
    } catch {
    }
  })();
  var w;
  typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (w = Function.prototype[Symbol.hasInstance], Object.defineProperty(_, Symbol.hasInstance, {
    value: function(W) {
      return w.call(this, W) ? !0 : this !== _ ? !1 : W && W._writableState instanceof d;
    }
  })) : w = function(W) {
    return W instanceof this;
  };
  function _(W) {
    if (S = S || et(), !w.call(_, this) && !(this instanceof S))
      return new _(W);
    this._writableState = new d(W, this), this.writable = !0, W && (typeof W.write == "function" && (this._write = W.write), typeof W.writev == "function" && (this._writev = W.writev), typeof W.destroy == "function" && (this._destroy = W.destroy), typeof W.final == "function" && (this._final = W.final)), s.call(this);
  }
  _.prototype.pipe = function() {
    this.emit("error", new Error("Cannot pipe, not readable"));
  };
  function i(W, B) {
    var Y = new Error("write after end");
    W.emit("error", Y), b.nextTick(B, Y);
  }
  function t(W, B, Y, C) {
    var G = !0, ne = !1;
    return Y === null ? ne = new TypeError("May not write null values to stream") : typeof Y != "string" && Y !== void 0 && !B.objectMode && (ne = new TypeError("Invalid non-string/buffer chunk")), ne && (W.emit("error", ne), b.nextTick(C, ne), G = !1), G;
  }
  _.prototype.write = function(W, B, Y) {
    var C = this._writableState, G = !1, ne = !C.objectMode && E(W);
    return ne && !r.isBuffer(W) && (W = g(W)), typeof B == "function" && (Y = B, B = null), ne ? B = "buffer" : B || (B = C.defaultEncoding), typeof Y != "function" && (Y = y), C.ended ? i(this, Y) : (ne || t(this, C, W, Y)) && (C.pendingcb++, G = u(this, C, ne, W, B, Y)), G;
  }, _.prototype.cork = function() {
    var W = this._writableState;
    W.corked++;
  }, _.prototype.uncork = function() {
    var W = this._writableState;
    W.corked && (W.corked--, !W.writing && !W.corked && !W.bufferProcessing && W.bufferedRequest && q(this, W));
  }, _.prototype.setDefaultEncoding = function(B) {
    if (typeof B == "string" && (B = B.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((B + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + B);
    return this._writableState.defaultEncoding = B, this;
  };
  function n(W, B, Y) {
    return !W.objectMode && W.decodeStrings !== !1 && typeof B == "string" && (B = r.from(B, Y)), B;
  }
  Object.defineProperty(_.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function u(W, B, Y, C, G, ne) {
    if (!Y) {
      var D = n(B, C, G);
      C !== D && (Y = !0, G = "buffer", C = D);
    }
    var he = B.objectMode ? 1 : C.length;
    B.length += he;
    var se = B.length < B.highWaterMark;
    if (se || (B.needDrain = !0), B.writing || B.corked) {
      var _e = B.lastBufferedRequest;
      B.lastBufferedRequest = {
        chunk: C,
        encoding: G,
        isBuf: Y,
        callback: ne,
        next: null
      }, _e ? _e.next = B.lastBufferedRequest : B.bufferedRequest = B.lastBufferedRequest, B.bufferedRequestCount += 1;
    } else
      k(W, B, !1, he, C, G, ne);
    return se;
  }
  function k(W, B, Y, C, G, ne, D) {
    B.writelen = C, B.writecb = D, B.writing = !0, B.sync = !0, Y ? W._writev(G, B.onwrite) : W._write(G, ne, B.onwrite), B.sync = !1;
  }
  function R(W, B, Y, C, G) {
    --B.pendingcb, Y ? (b.nextTick(G, C), b.nextTick(te, W, B), W._writableState.errorEmitted = !0, W.emit("error", C)) : (G(C), W._writableState.errorEmitted = !0, W.emit("error", C), te(W, B));
  }
  function j(W) {
    W.writing = !1, W.writecb = null, W.length -= W.writelen, W.writelen = 0;
  }
  function U(W, B) {
    var Y = W._writableState, C = Y.sync, G = Y.writecb;
    if (j(Y), B) R(W, Y, C, B, G);
    else {
      var ne = Q(Y);
      !ne && !Y.corked && !Y.bufferProcessing && Y.bufferedRequest && q(W, Y), C ? c(M, W, Y, ne, G) : M(W, Y, ne, G);
    }
  }
  function M(W, B, Y, C) {
    Y || Z(W, B), B.pendingcb--, C(), te(W, B);
  }
  function Z(W, B) {
    B.length === 0 && B.needDrain && (B.needDrain = !1, W.emit("drain"));
  }
  function q(W, B) {
    B.bufferProcessing = !0;
    var Y = B.bufferedRequest;
    if (W._writev && Y && Y.next) {
      var C = B.bufferedRequestCount, G = new Array(C), ne = B.corkedRequestsFree;
      ne.entry = Y;
      for (var D = 0, he = !0; Y; )
        G[D] = Y, Y.isBuf || (he = !1), Y = Y.next, D += 1;
      G.allBuffers = he, k(W, B, !0, B.length, G, "", ne.finish), B.pendingcb++, B.lastBufferedRequest = null, ne.next ? (B.corkedRequestsFree = ne.next, ne.next = null) : B.corkedRequestsFree = new m(B), B.bufferedRequestCount = 0;
    } else {
      for (; Y; ) {
        var se = Y.chunk, _e = Y.encoding, h = Y.callback, a = B.objectMode ? 1 : se.length;
        if (k(W, B, !1, a, se, _e, h), Y = Y.next, B.bufferedRequestCount--, B.writing)
          break;
      }
      Y === null && (B.lastBufferedRequest = null);
    }
    B.bufferedRequest = Y, B.bufferProcessing = !1;
  }
  _.prototype._write = function(W, B, Y) {
    Y(new Error("_write() is not implemented"));
  }, _.prototype._writev = null, _.prototype.end = function(W, B, Y) {
    var C = this._writableState;
    typeof W == "function" ? (Y = W, W = null, B = null) : typeof B == "function" && (Y = B, B = null), W != null && this.write(W, B), C.corked && (C.corked = 1, this.uncork()), C.ending || ue(this, C, Y);
  };
  function Q(W) {
    return W.ending && W.length === 0 && W.bufferedRequest === null && !W.finished && !W.writing;
  }
  function re(W, B) {
    W._final(function(Y) {
      B.pendingcb--, Y && W.emit("error", Y), B.prefinished = !0, W.emit("prefinish"), te(W, B);
    });
  }
  function H(W, B) {
    !B.prefinished && !B.finalCalled && (typeof W._final == "function" ? (B.pendingcb++, B.finalCalled = !0, b.nextTick(re, W, B)) : (B.prefinished = !0, W.emit("prefinish")));
  }
  function te(W, B) {
    var Y = Q(B);
    return Y && (H(W, B), B.pendingcb === 0 && (B.finished = !0, W.emit("finish"))), Y;
  }
  function ue(W, B, Y) {
    B.ending = !0, te(W, B), Y && (B.finished ? b.nextTick(Y) : W.once("finish", Y)), B.ended = !0, W.writable = !1;
  }
  function fe(W, B, Y) {
    var C = W.entry;
    for (W.entry = null; C; ) {
      var G = C.callback;
      B.pendingcb--, G(Y), C = C.next;
    }
    B.corkedRequestsFree.next = W;
  }
  return Object.defineProperty(_.prototype, "destroyed", {
    get: function() {
      return this._writableState === void 0 ? !1 : this._writableState.destroyed;
    },
    set: function(W) {
      this._writableState && (this._writableState.destroyed = W);
    }
  }), _.prototype.destroy = p.destroy, _.prototype._undestroy = p.undestroy, _.prototype._destroy = function(W, B) {
    this.end(), B(W);
  }, Kt;
}
var Yt, Jn;
function et() {
  if (Jn) return Yt;
  Jn = 1;
  var b = kt(), m = Object.keys || function(p) {
    var y = [];
    for (var d in p)
      y.push(d);
    return y;
  };
  Yt = f;
  var c = Object.create(ft());
  c.inherits = ct();
  var S = To(), v = Ro();
  c.inherits(f, S);
  for (var e = m(v.prototype), s = 0; s < e.length; s++) {
    var r = e[s];
    f.prototype[r] || (f.prototype[r] = v.prototype[r]);
  }
  function f(p) {
    if (!(this instanceof f)) return new f(p);
    S.call(this, p), v.call(this, p), p && p.readable === !1 && (this.readable = !1), p && p.writable === !1 && (this.writable = !1), this.allowHalfOpen = !0, p && p.allowHalfOpen === !1 && (this.allowHalfOpen = !1), this.once("end", g);
  }
  Object.defineProperty(f.prototype, "writableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._writableState.highWaterMark;
    }
  });
  function g() {
    this.allowHalfOpen || this._writableState.ended || b.nextTick(E, this);
  }
  function E(p) {
    p.end();
  }
  return Object.defineProperty(f.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
    },
    set: function(p) {
      this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = p, this._writableState.destroyed = p);
    }
  }), f.prototype._destroy = function(p, y) {
    this.push(null), this.end(), b.nextTick(y, p);
  }, Yt;
}
var Qt = {}, Kn;
function Yn() {
  if (Kn) return Qt;
  Kn = 1;
  var b = Ct().Buffer, m = b.isEncoding || function(t) {
    switch (t = "" + t, t && t.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return !0;
      default:
        return !1;
    }
  };
  function c(t) {
    if (!t) return "utf8";
    for (var n; ; )
      switch (t) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return t;
        default:
          if (n) return;
          t = ("" + t).toLowerCase(), n = !0;
      }
  }
  function S(t) {
    var n = c(t);
    if (typeof n != "string" && (b.isEncoding === m || !m(t))) throw new Error("Unknown encoding: " + t);
    return n || t;
  }
  Qt.StringDecoder = v;
  function v(t) {
    this.encoding = S(t);
    var n;
    switch (this.encoding) {
      case "utf16le":
        this.text = p, this.end = y, n = 4;
        break;
      case "utf8":
        this.fillLast = f, n = 4;
        break;
      case "base64":
        this.text = d, this.end = w, n = 3;
        break;
      default:
        this.write = _, this.end = i;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = b.allocUnsafe(n);
  }
  v.prototype.write = function(t) {
    if (t.length === 0) return "";
    var n, u;
    if (this.lastNeed) {
      if (n = this.fillLast(t), n === void 0) return "";
      u = this.lastNeed, this.lastNeed = 0;
    } else
      u = 0;
    return u < t.length ? n ? n + this.text(t, u) : this.text(t, u) : n || "";
  }, v.prototype.end = E, v.prototype.text = g, v.prototype.fillLast = function(t) {
    if (this.lastNeed <= t.length)
      return t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t.length), this.lastNeed -= t.length;
  };
  function e(t) {
    return t <= 127 ? 0 : t >> 5 === 6 ? 2 : t >> 4 === 14 ? 3 : t >> 3 === 30 ? 4 : t >> 6 === 2 ? -1 : -2;
  }
  function s(t, n, u) {
    var k = n.length - 1;
    if (k < u) return 0;
    var R = e(n[k]);
    return R >= 0 ? (R > 0 && (t.lastNeed = R - 1), R) : --k < u || R === -2 ? 0 : (R = e(n[k]), R >= 0 ? (R > 0 && (t.lastNeed = R - 2), R) : --k < u || R === -2 ? 0 : (R = e(n[k]), R >= 0 ? (R > 0 && (R === 2 ? R = 0 : t.lastNeed = R - 3), R) : 0));
  }
  function r(t, n, u) {
    if ((n[0] & 192) !== 128)
      return t.lastNeed = 0, "�";
    if (t.lastNeed > 1 && n.length > 1) {
      if ((n[1] & 192) !== 128)
        return t.lastNeed = 1, "�";
      if (t.lastNeed > 2 && n.length > 2 && (n[2] & 192) !== 128)
        return t.lastNeed = 2, "�";
    }
  }
  function f(t) {
    var n = this.lastTotal - this.lastNeed, u = r(this, t);
    if (u !== void 0) return u;
    if (this.lastNeed <= t.length)
      return t.copy(this.lastChar, n, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    t.copy(this.lastChar, n, 0, t.length), this.lastNeed -= t.length;
  }
  function g(t, n) {
    var u = s(this, t, n);
    if (!this.lastNeed) return t.toString("utf8", n);
    this.lastTotal = u;
    var k = t.length - (u - this.lastNeed);
    return t.copy(this.lastChar, 0, k), t.toString("utf8", n, k);
  }
  function E(t) {
    var n = t && t.length ? this.write(t) : "";
    return this.lastNeed ? n + "�" : n;
  }
  function p(t, n) {
    if ((t.length - n) % 2 === 0) {
      var u = t.toString("utf16le", n);
      if (u) {
        var k = u.charCodeAt(u.length - 1);
        if (k >= 55296 && k <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1], u.slice(0, -1);
      }
      return u;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = t[t.length - 1], t.toString("utf16le", n, t.length - 1);
  }
  function y(t) {
    var n = t && t.length ? this.write(t) : "";
    if (this.lastNeed) {
      var u = this.lastTotal - this.lastNeed;
      return n + this.lastChar.toString("utf16le", 0, u);
    }
    return n;
  }
  function d(t, n) {
    var u = (t.length - n) % 3;
    return u === 0 ? t.toString("base64", n) : (this.lastNeed = 3 - u, this.lastTotal = 3, u === 1 ? this.lastChar[0] = t[t.length - 1] : (this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1]), t.toString("base64", n, t.length - u));
  }
  function w(t) {
    var n = t && t.length ? this.write(t) : "";
    return this.lastNeed ? n + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : n;
  }
  function _(t) {
    return t.toString(this.encoding);
  }
  function i(t) {
    return t && t.length ? this.write(t) : "";
  }
  return Qt;
}
var Xt, Qn;
function To() {
  if (Qn) return Xt;
  Qn = 1;
  var b = kt();
  Xt = n;
  var m = zo(), c;
  n.ReadableState = t, tt.EventEmitter;
  var S = function(h, a) {
    return h.listeners(a).length;
  }, v = Eo(), e = Ct().Buffer, s = (typeof Pe < "u" ? Pe : typeof window < "u" ? window : typeof self < "u" ? self : {}).Uint8Array || function() {
  };
  function r(h) {
    return e.from(h);
  }
  function f(h) {
    return e.isBuffer(h) || h instanceof s;
  }
  var g = Object.create(ft());
  g.inherits = ct();
  var E = Ae, p = void 0;
  E && E.debuglog ? p = E.debuglog("stream") : p = function() {
  };
  var y = Ko(), d = xo(), w;
  g.inherits(n, v);
  var _ = ["error", "close", "destroy", "pause", "resume"];
  function i(h, a, T) {
    if (typeof h.prependListener == "function") return h.prependListener(a, T);
    !h._events || !h._events[a] ? h.on(a, T) : m(h._events[a]) ? h._events[a].unshift(T) : h._events[a] = [T, h._events[a]];
  }
  function t(h, a) {
    c = c || et(), h = h || {};
    var T = a instanceof c;
    this.objectMode = !!h.objectMode, T && (this.objectMode = this.objectMode || !!h.readableObjectMode);
    var N = h.highWaterMark, J = h.readableHighWaterMark, $ = this.objectMode ? 16 : 16 * 1024;
    N || N === 0 ? this.highWaterMark = N : T && (J || J === 0) ? this.highWaterMark = J : this.highWaterMark = $, this.highWaterMark = Math.floor(this.highWaterMark), this.buffer = new y(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.destroyed = !1, this.defaultEncoding = h.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, h.encoding && (w || (w = Yn().StringDecoder), this.decoder = new w(h.encoding), this.encoding = h.encoding);
  }
  function n(h) {
    if (c = c || et(), !(this instanceof n)) return new n(h);
    this._readableState = new t(h, this), this.readable = !0, h && (typeof h.read == "function" && (this._read = h.read), typeof h.destroy == "function" && (this._destroy = h.destroy)), v.call(this);
  }
  Object.defineProperty(n.prototype, "destroyed", {
    get: function() {
      return this._readableState === void 0 ? !1 : this._readableState.destroyed;
    },
    set: function(h) {
      this._readableState && (this._readableState.destroyed = h);
    }
  }), n.prototype.destroy = d.destroy, n.prototype._undestroy = d.undestroy, n.prototype._destroy = function(h, a) {
    this.push(null), a(h);
  }, n.prototype.push = function(h, a) {
    var T = this._readableState, N;
    return T.objectMode ? N = !0 : typeof h == "string" && (a = a || T.defaultEncoding, a !== T.encoding && (h = e.from(h, a), a = ""), N = !0), u(this, h, a, !1, N);
  }, n.prototype.unshift = function(h) {
    return u(this, h, null, !0, !1);
  };
  function u(h, a, T, N, J) {
    var $ = h._readableState;
    if (a === null)
      $.reading = !1, q(h, $);
    else {
      var F;
      J || (F = R($, a)), F ? h.emit("error", F) : $.objectMode || a && a.length > 0 ? (typeof a != "string" && !$.objectMode && Object.getPrototypeOf(a) !== e.prototype && (a = r(a)), N ? $.endEmitted ? h.emit("error", new Error("stream.unshift() after end event")) : k(h, $, a, !0) : $.ended ? h.emit("error", new Error("stream.push() after EOF")) : ($.reading = !1, $.decoder && !T ? (a = $.decoder.write(a), $.objectMode || a.length !== 0 ? k(h, $, a, !1) : H(h, $)) : k(h, $, a, !1))) : N || ($.reading = !1);
    }
    return j($);
  }
  function k(h, a, T, N) {
    a.flowing && a.length === 0 && !a.sync ? (h.emit("data", T), h.read(0)) : (a.length += a.objectMode ? 1 : T.length, N ? a.buffer.unshift(T) : a.buffer.push(T), a.needReadable && Q(h)), H(h, a);
  }
  function R(h, a) {
    var T;
    return !f(a) && typeof a != "string" && a !== void 0 && !h.objectMode && (T = new TypeError("Invalid non-string/buffer chunk")), T;
  }
  function j(h) {
    return !h.ended && (h.needReadable || h.length < h.highWaterMark || h.length === 0);
  }
  n.prototype.isPaused = function() {
    return this._readableState.flowing === !1;
  }, n.prototype.setEncoding = function(h) {
    return w || (w = Yn().StringDecoder), this._readableState.decoder = new w(h), this._readableState.encoding = h, this;
  };
  var U = 8388608;
  function M(h) {
    return h >= U ? h = U : (h--, h |= h >>> 1, h |= h >>> 2, h |= h >>> 4, h |= h >>> 8, h |= h >>> 16, h++), h;
  }
  function Z(h, a) {
    return h <= 0 || a.length === 0 && a.ended ? 0 : a.objectMode ? 1 : h !== h ? a.flowing && a.length ? a.buffer.head.data.length : a.length : (h > a.highWaterMark && (a.highWaterMark = M(h)), h <= a.length ? h : a.ended ? a.length : (a.needReadable = !0, 0));
  }
  n.prototype.read = function(h) {
    p("read", h), h = parseInt(h, 10);
    var a = this._readableState, T = h;
    if (h !== 0 && (a.emittedReadable = !1), h === 0 && a.needReadable && (a.length >= a.highWaterMark || a.ended))
      return p("read: emitReadable", a.length, a.ended), a.length === 0 && a.ended ? he(this) : Q(this), null;
    if (h = Z(h, a), h === 0 && a.ended)
      return a.length === 0 && he(this), null;
    var N = a.needReadable;
    p("need readable", N), (a.length === 0 || a.length - h < a.highWaterMark) && (N = !0, p("length less than watermark", N)), a.ended || a.reading ? (N = !1, p("reading or ended", N)) : N && (p("do read"), a.reading = !0, a.sync = !0, a.length === 0 && (a.needReadable = !0), this._read(a.highWaterMark), a.sync = !1, a.reading || (h = Z(T, a)));
    var J;
    return h > 0 ? J = C(h, a) : J = null, J === null ? (a.needReadable = !0, h = 0) : a.length -= h, a.length === 0 && (a.ended || (a.needReadable = !0), T !== h && a.ended && he(this)), J !== null && this.emit("data", J), J;
  };
  function q(h, a) {
    if (!a.ended) {
      if (a.decoder) {
        var T = a.decoder.end();
        T && T.length && (a.buffer.push(T), a.length += a.objectMode ? 1 : T.length);
      }
      a.ended = !0, Q(h);
    }
  }
  function Q(h) {
    var a = h._readableState;
    a.needReadable = !1, a.emittedReadable || (p("emitReadable", a.flowing), a.emittedReadable = !0, a.sync ? b.nextTick(re, h) : re(h));
  }
  function re(h) {
    p("emit readable"), h.emit("readable"), Y(h);
  }
  function H(h, a) {
    a.readingMore || (a.readingMore = !0, b.nextTick(te, h, a));
  }
  function te(h, a) {
    for (var T = a.length; !a.reading && !a.flowing && !a.ended && a.length < a.highWaterMark && (p("maybeReadMore read 0"), h.read(0), T !== a.length); )
      T = a.length;
    a.readingMore = !1;
  }
  n.prototype._read = function(h) {
    this.emit("error", new Error("_read() is not implemented"));
  }, n.prototype.pipe = function(h, a) {
    var T = this, N = this._readableState;
    switch (N.pipesCount) {
      case 0:
        N.pipes = h;
        break;
      case 1:
        N.pipes = [N.pipes, h];
        break;
      default:
        N.pipes.push(h);
        break;
    }
    N.pipesCount += 1, p("pipe count=%d opts=%j", N.pipesCount, a);
    var J = (!a || a.end !== !1) && h !== process.stdout && h !== process.stderr, $ = J ? P : Ee;
    N.endEmitted ? b.nextTick($) : T.once("end", $), h.on("unpipe", F);
    function F(ke, Se) {
      p("onunpipe"), ke === T && Se && Se.hasUnpiped === !1 && (Se.hasUnpiped = !0, de());
    }
    function P() {
      p("onend"), h.end();
    }
    var X = ue(T);
    h.on("drain", X);
    var pe = !1;
    function de() {
      p("cleanup"), h.removeListener("close", ye), h.removeListener("finish", ie), h.removeListener("drain", X), h.removeListener("error", le), h.removeListener("unpipe", F), T.removeListener("end", P), T.removeListener("end", Ee), T.removeListener("data", z), pe = !0, N.awaitDrain && (!h._writableState || h._writableState.needDrain) && X();
    }
    var ce = !1;
    T.on("data", z);
    function z(ke) {
      p("ondata"), ce = !1;
      var Se = h.write(ke);
      Se === !1 && !ce && ((N.pipesCount === 1 && N.pipes === h || N.pipesCount > 1 && _e(N.pipes, h) !== -1) && !pe && (p("false write response, pause", N.awaitDrain), N.awaitDrain++, ce = !0), T.pause());
    }
    function le(ke) {
      p("onerror", ke), Ee(), h.removeListener("error", le), S(h, "error") === 0 && h.emit("error", ke);
    }
    i(h, "error", le);
    function ye() {
      h.removeListener("finish", ie), Ee();
    }
    h.once("close", ye);
    function ie() {
      p("onfinish"), h.removeListener("close", ye), Ee();
    }
    h.once("finish", ie);
    function Ee() {
      p("unpipe"), T.unpipe(h);
    }
    return h.emit("pipe", T), N.flowing || (p("pipe resume"), T.resume()), h;
  };
  function ue(h) {
    return function() {
      var a = h._readableState;
      p("pipeOnDrain", a.awaitDrain), a.awaitDrain && a.awaitDrain--, a.awaitDrain === 0 && S(h, "data") && (a.flowing = !0, Y(h));
    };
  }
  n.prototype.unpipe = function(h) {
    var a = this._readableState, T = { hasUnpiped: !1 };
    if (a.pipesCount === 0) return this;
    if (a.pipesCount === 1)
      return h && h !== a.pipes ? this : (h || (h = a.pipes), a.pipes = null, a.pipesCount = 0, a.flowing = !1, h && h.emit("unpipe", this, T), this);
    if (!h) {
      var N = a.pipes, J = a.pipesCount;
      a.pipes = null, a.pipesCount = 0, a.flowing = !1;
      for (var $ = 0; $ < J; $++)
        N[$].emit("unpipe", this, { hasUnpiped: !1 });
      return this;
    }
    var F = _e(a.pipes, h);
    return F === -1 ? this : (a.pipes.splice(F, 1), a.pipesCount -= 1, a.pipesCount === 1 && (a.pipes = a.pipes[0]), h.emit("unpipe", this, T), this);
  }, n.prototype.on = function(h, a) {
    var T = v.prototype.on.call(this, h, a);
    if (h === "data")
      this._readableState.flowing !== !1 && this.resume();
    else if (h === "readable") {
      var N = this._readableState;
      !N.endEmitted && !N.readableListening && (N.readableListening = N.needReadable = !0, N.emittedReadable = !1, N.reading ? N.length && Q(this) : b.nextTick(fe, this));
    }
    return T;
  }, n.prototype.addListener = n.prototype.on;
  function fe(h) {
    p("readable nexttick read 0"), h.read(0);
  }
  n.prototype.resume = function() {
    var h = this._readableState;
    return h.flowing || (p("resume"), h.flowing = !0, W(this, h)), this;
  };
  function W(h, a) {
    a.resumeScheduled || (a.resumeScheduled = !0, b.nextTick(B, h, a));
  }
  function B(h, a) {
    a.reading || (p("resume read 0"), h.read(0)), a.resumeScheduled = !1, a.awaitDrain = 0, h.emit("resume"), Y(h), a.flowing && !a.reading && h.read(0);
  }
  n.prototype.pause = function() {
    return p("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (p("pause"), this._readableState.flowing = !1, this.emit("pause")), this;
  };
  function Y(h) {
    var a = h._readableState;
    for (p("flow", a.flowing); a.flowing && h.read() !== null; )
      ;
  }
  n.prototype.wrap = function(h) {
    var a = this, T = this._readableState, N = !1;
    h.on("end", function() {
      if (p("wrapped end"), T.decoder && !T.ended) {
        var F = T.decoder.end();
        F && F.length && a.push(F);
      }
      a.push(null);
    }), h.on("data", function(F) {
      if (p("wrapped data"), T.decoder && (F = T.decoder.write(F)), !(T.objectMode && F == null) && !(!T.objectMode && (!F || !F.length))) {
        var P = a.push(F);
        P || (N = !0, h.pause());
      }
    });
    for (var J in h)
      this[J] === void 0 && typeof h[J] == "function" && (this[J] = /* @__PURE__ */ (function(F) {
        return function() {
          return h[F].apply(h, arguments);
        };
      })(J));
    for (var $ = 0; $ < _.length; $++)
      h.on(_[$], this.emit.bind(this, _[$]));
    return this._read = function(F) {
      p("wrapped _read", F), N && (N = !1, h.resume());
    }, this;
  }, Object.defineProperty(n.prototype, "readableHighWaterMark", {
    // making it explicit this property is not enumerable
    // because otherwise some prototype manipulation in
    // userland will fail
    enumerable: !1,
    get: function() {
      return this._readableState.highWaterMark;
    }
  }), n._fromList = C;
  function C(h, a) {
    if (a.length === 0) return null;
    var T;
    return a.objectMode ? T = a.buffer.shift() : !h || h >= a.length ? (a.decoder ? T = a.buffer.join("") : a.buffer.length === 1 ? T = a.buffer.head.data : T = a.buffer.concat(a.length), a.buffer.clear()) : T = G(h, a.buffer, a.decoder), T;
  }
  function G(h, a, T) {
    var N;
    return h < a.head.data.length ? (N = a.head.data.slice(0, h), a.head.data = a.head.data.slice(h)) : h === a.head.data.length ? N = a.shift() : N = T ? ne(h, a) : D(h, a), N;
  }
  function ne(h, a) {
    var T = a.head, N = 1, J = T.data;
    for (h -= J.length; T = T.next; ) {
      var $ = T.data, F = h > $.length ? $.length : h;
      if (F === $.length ? J += $ : J += $.slice(0, h), h -= F, h === 0) {
        F === $.length ? (++N, T.next ? a.head = T.next : a.head = a.tail = null) : (a.head = T, T.data = $.slice(F));
        break;
      }
      ++N;
    }
    return a.length -= N, J;
  }
  function D(h, a) {
    var T = e.allocUnsafe(h), N = a.head, J = 1;
    for (N.data.copy(T), h -= N.data.length; N = N.next; ) {
      var $ = N.data, F = h > $.length ? $.length : h;
      if ($.copy(T, T.length - h, 0, F), h -= F, h === 0) {
        F === $.length ? (++J, N.next ? a.head = N.next : a.head = a.tail = null) : (a.head = N, N.data = $.slice(F));
        break;
      }
      ++J;
    }
    return a.length -= J, T;
  }
  function he(h) {
    var a = h._readableState;
    if (a.length > 0) throw new Error('"endReadable()" called on non-empty stream');
    a.endEmitted || (a.ended = !0, b.nextTick(se, a, h));
  }
  function se(h, a) {
    !h.endEmitted && h.length === 0 && (h.endEmitted = !0, a.readable = !1, a.emit("end"));
  }
  function _e(h, a) {
    for (var T = 0, N = h.length; T < N; T++)
      if (h[T] === a) return T;
    return -1;
  }
  return Xt;
}
var Zt, Xn;
function ko() {
  if (Xn) return Zt;
  Xn = 1, Zt = S;
  var b = et(), m = Object.create(ft());
  m.inherits = ct(), m.inherits(S, b);
  function c(s, r) {
    var f = this._transformState;
    f.transforming = !1;
    var g = f.writecb;
    if (!g)
      return this.emit("error", new Error("write callback called multiple times"));
    f.writechunk = null, f.writecb = null, r != null && this.push(r), g(s);
    var E = this._readableState;
    E.reading = !1, (E.needReadable || E.length < E.highWaterMark) && this._read(E.highWaterMark);
  }
  function S(s) {
    if (!(this instanceof S)) return new S(s);
    b.call(this, s), this._transformState = {
      afterTransform: c.bind(this),
      needTransform: !1,
      transforming: !1,
      writecb: null,
      writechunk: null,
      writeencoding: null
    }, this._readableState.needReadable = !0, this._readableState.sync = !1, s && (typeof s.transform == "function" && (this._transform = s.transform), typeof s.flush == "function" && (this._flush = s.flush)), this.on("prefinish", v);
  }
  function v() {
    var s = this;
    typeof this._flush == "function" ? this._flush(function(r, f) {
      e(s, r, f);
    }) : e(this, null, null);
  }
  S.prototype.push = function(s, r) {
    return this._transformState.needTransform = !1, b.prototype.push.call(this, s, r);
  }, S.prototype._transform = function(s, r, f) {
    throw new Error("_transform() is not implemented");
  }, S.prototype._write = function(s, r, f) {
    var g = this._transformState;
    if (g.writecb = f, g.writechunk = s, g.writeencoding = r, !g.transforming) {
      var E = this._readableState;
      (g.needTransform || E.needReadable || E.length < E.highWaterMark) && this._read(E.highWaterMark);
    }
  }, S.prototype._read = function(s) {
    var r = this._transformState;
    r.writechunk !== null && r.writecb && !r.transforming ? (r.transforming = !0, this._transform(r.writechunk, r.writeencoding, r.afterTransform)) : r.needTransform = !0;
  }, S.prototype._destroy = function(s, r) {
    var f = this;
    b.prototype._destroy.call(this, s, function(g) {
      r(g), f.emit("close");
    });
  };
  function e(s, r, f) {
    if (r) return s.emit("error", r);
    if (f != null && s.push(f), s._writableState.length) throw new Error("Calling transform done when ws.length != 0");
    if (s._transformState.transforming) throw new Error("Calling transform done when still transforming");
    return s.push(null);
  }
  return Zt;
}
var er, Zn;
function Qo() {
  if (Zn) return er;
  Zn = 1, er = c;
  var b = ko(), m = Object.create(ft());
  m.inherits = ct(), m.inherits(c, b);
  function c(S) {
    if (!(this instanceof c)) return new c(S);
    b.call(this, S);
  }
  return c.prototype._transform = function(S, v, e) {
    e(null, S);
  }, er;
}
var ei;
function Xo() {
  return ei || (ei = 1, (function(b, m) {
    m = b.exports = To(), m.Stream = m, m.Readable = m, m.Writable = Ro(), m.Duplex = et(), m.Transform = ko(), m.PassThrough = Qo();
  })(yt, yt.exports)), yt.exports;
}
var ti;
function Co() {
  if (ti) return pt.exports;
  ti = 1;
  var b = Xo();
  function m(c, S, v) {
    typeof v > "u" && (v = S, S = c, c = null), b.Duplex.call(this, c), typeof v.read != "function" && (v = new b.Readable(c).wrap(v)), this._writable = S, this._readable = v, this._waiting = !1;
    var e = this;
    S.once("finish", function() {
      e.end();
    }), this.once("finish", function() {
      S.end();
    }), v.on("readable", function() {
      e._waiting && (e._waiting = !1, e._read());
    }), v.once("end", function() {
      e.push(null);
    }), (!c || typeof c.bubbleErrors > "u" || c.bubbleErrors) && (S.on("error", function(s) {
      e.emit("error", s);
    }), v.on("error", function(s) {
      e.emit("error", s);
    }));
  }
  return m.prototype = Object.create(b.Duplex.prototype, { constructor: { value: m } }), m.prototype._write = function(S, v, e) {
    this._writable.write(S, v, e);
  }, m.prototype._read = function() {
    for (var S, v = 0; (S = this._readable.read()) !== null; )
      this.push(S), v++;
    v === 0 && (this._waiting = !0);
  }, pt.exports = function(S, v, e) {
    return new m(S, v, e);
  }, pt.exports.DuplexWrapper = m, pt.exports;
}
var tr, ri;
function Zo() {
  if (ri) return tr;
  ri = 1;
  const b = Ae, m = gn(), c = Co(), S = pn();
  function v(e, s) {
    const r = b.PassThrough({ objectMode: !0 }), f = b.PassThrough(), g = b.Transform({ objectMode: !0 }), E = e instanceof RegExp ? e : e && new RegExp(e);
    let p;
    g._transform = function(d, w, _) {
      if (p || E && !E.exec(d.path))
        return d.autodrain(), _();
      p = !0, y.emit("entry", d), d.on("error", function(i) {
        f.emit("error", i);
      }), d.pipe(f).on("error", function(i) {
        _(i);
      }).on("finish", function(i) {
        _(null, i);
      });
    }, r.pipe(m(s)).on("error", function(d) {
      f.emit("error", d);
    }).pipe(g).on("error", Object).on("finish", function() {
      p ? f.end() : f.emit("error", new Error("PATTERN_NOT_FOUND"));
    });
    const y = c(r, f);
    return y.buffer = function() {
      return S(f);
    }, y;
  }
  return tr = v, tr;
}
var rr = {}, vt = {}, ni;
function De() {
  return ni || (ni = 1, vt.fromCallback = function(b) {
    return Object.defineProperty(function(...m) {
      if (typeof m[m.length - 1] == "function") b.apply(this, m);
      else
        return new Promise((c, S) => {
          m.push((v, e) => v != null ? S(v) : c(e)), b.apply(this, m);
        });
    }, "name", { value: b.name });
  }, vt.fromPromise = function(b) {
    return Object.defineProperty(function(...m) {
      const c = m[m.length - 1];
      if (typeof c != "function") return b.apply(this, m);
      m.pop(), b.apply(this, m).then((S) => c(null, S), c);
    }, "name", { value: b.name });
  }), vt;
}
var nr, ii;
function ea() {
  if (ii) return nr;
  ii = 1;
  var b = Ae, m = process.cwd, c = null, S = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return c || (c = m.call(process)), c;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var v = process.chdir;
    process.chdir = function(s) {
      c = null, v.call(process, s);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, v);
  }
  nr = e;
  function e(s) {
    b.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && r(s), s.lutimes || f(s), s.chown = p(s.chown), s.fchown = p(s.fchown), s.lchown = p(s.lchown), s.chmod = g(s.chmod), s.fchmod = g(s.fchmod), s.lchmod = g(s.lchmod), s.chownSync = y(s.chownSync), s.fchownSync = y(s.fchownSync), s.lchownSync = y(s.lchownSync), s.chmodSync = E(s.chmodSync), s.fchmodSync = E(s.fchmodSync), s.lchmodSync = E(s.lchmodSync), s.stat = d(s.stat), s.fstat = d(s.fstat), s.lstat = d(s.lstat), s.statSync = w(s.statSync), s.fstatSync = w(s.fstatSync), s.lstatSync = w(s.lstatSync), s.chmod && !s.lchmod && (s.lchmod = function(i, t, n) {
      n && process.nextTick(n);
    }, s.lchmodSync = function() {
    }), s.chown && !s.lchown && (s.lchown = function(i, t, n, u) {
      u && process.nextTick(u);
    }, s.lchownSync = function() {
    }), S === "win32" && (s.rename = typeof s.rename != "function" ? s.rename : (function(i) {
      function t(n, u, k) {
        var R = Date.now(), j = 0;
        i(n, u, function U(M) {
          if (M && (M.code === "EACCES" || M.code === "EPERM" || M.code === "EBUSY") && Date.now() - R < 6e4) {
            setTimeout(function() {
              s.stat(u, function(Z, q) {
                Z && Z.code === "ENOENT" ? i(n, u, U) : k(M);
              });
            }, j), j < 100 && (j += 10);
            return;
          }
          k && k(M);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(t, i), t;
    })(s.rename)), s.read = typeof s.read != "function" ? s.read : (function(i) {
      function t(n, u, k, R, j, U) {
        var M;
        if (U && typeof U == "function") {
          var Z = 0;
          M = function(q, Q, re) {
            if (q && q.code === "EAGAIN" && Z < 10)
              return Z++, i.call(s, n, u, k, R, j, M);
            U.apply(this, arguments);
          };
        }
        return i.call(s, n, u, k, R, j, M);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(t, i), t;
    })(s.read), s.readSync = typeof s.readSync != "function" ? s.readSync : /* @__PURE__ */ (function(i) {
      return function(t, n, u, k, R) {
        for (var j = 0; ; )
          try {
            return i.call(s, t, n, u, k, R);
          } catch (U) {
            if (U.code === "EAGAIN" && j < 10) {
              j++;
              continue;
            }
            throw U;
          }
      };
    })(s.readSync);
    function r(i) {
      i.lchmod = function(t, n, u) {
        i.open(
          t,
          b.O_WRONLY | b.O_SYMLINK,
          n,
          function(k, R) {
            if (k) {
              u && u(k);
              return;
            }
            i.fchmod(R, n, function(j) {
              i.close(R, function(U) {
                u && u(j || U);
              });
            });
          }
        );
      }, i.lchmodSync = function(t, n) {
        var u = i.openSync(t, b.O_WRONLY | b.O_SYMLINK, n), k = !0, R;
        try {
          R = i.fchmodSync(u, n), k = !1;
        } finally {
          if (k)
            try {
              i.closeSync(u);
            } catch {
            }
          else
            i.closeSync(u);
        }
        return R;
      };
    }
    function f(i) {
      b.hasOwnProperty("O_SYMLINK") && i.futimes ? (i.lutimes = function(t, n, u, k) {
        i.open(t, b.O_SYMLINK, function(R, j) {
          if (R) {
            k && k(R);
            return;
          }
          i.futimes(j, n, u, function(U) {
            i.close(j, function(M) {
              k && k(U || M);
            });
          });
        });
      }, i.lutimesSync = function(t, n, u) {
        var k = i.openSync(t, b.O_SYMLINK), R, j = !0;
        try {
          R = i.futimesSync(k, n, u), j = !1;
        } finally {
          if (j)
            try {
              i.closeSync(k);
            } catch {
            }
          else
            i.closeSync(k);
        }
        return R;
      }) : i.futimes && (i.lutimes = function(t, n, u, k) {
        k && process.nextTick(k);
      }, i.lutimesSync = function() {
      });
    }
    function g(i) {
      return i && function(t, n, u) {
        return i.call(s, t, n, function(k) {
          _(k) && (k = null), u && u.apply(this, arguments);
        });
      };
    }
    function E(i) {
      return i && function(t, n) {
        try {
          return i.call(s, t, n);
        } catch (u) {
          if (!_(u)) throw u;
        }
      };
    }
    function p(i) {
      return i && function(t, n, u, k) {
        return i.call(s, t, n, u, function(R) {
          _(R) && (R = null), k && k.apply(this, arguments);
        });
      };
    }
    function y(i) {
      return i && function(t, n, u) {
        try {
          return i.call(s, t, n, u);
        } catch (k) {
          if (!_(k)) throw k;
        }
      };
    }
    function d(i) {
      return i && function(t, n, u) {
        typeof n == "function" && (u = n, n = null);
        function k(R, j) {
          j && (j.uid < 0 && (j.uid += 4294967296), j.gid < 0 && (j.gid += 4294967296)), u && u.apply(this, arguments);
        }
        return n ? i.call(s, t, n, k) : i.call(s, t, k);
      };
    }
    function w(i) {
      return i && function(t, n) {
        var u = n ? i.call(s, t, n) : i.call(s, t);
        return u && (u.uid < 0 && (u.uid += 4294967296), u.gid < 0 && (u.gid += 4294967296)), u;
      };
    }
    function _(i) {
      if (!i || i.code === "ENOSYS")
        return !0;
      var t = !process.getuid || process.getuid() !== 0;
      return !!(t && (i.code === "EINVAL" || i.code === "EPERM"));
    }
  }
  return nr;
}
var ir, oi;
function ta() {
  if (oi) return ir;
  oi = 1;
  var b = Ae.Stream;
  ir = m;
  function m(c) {
    return {
      ReadStream: S,
      WriteStream: v
    };
    function S(e, s) {
      if (!(this instanceof S)) return new S(e, s);
      b.call(this);
      var r = this;
      this.path = e, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, s = s || {};
      for (var f = Object.keys(s), g = 0, E = f.length; g < E; g++) {
        var p = f[g];
        this[p] = s[p];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          r._read();
        });
        return;
      }
      c.open(this.path, this.flags, this.mode, function(y, d) {
        if (y) {
          r.emit("error", y), r.readable = !1;
          return;
        }
        r.fd = d, r.emit("open", d), r._read();
      });
    }
    function v(e, s) {
      if (!(this instanceof v)) return new v(e, s);
      b.call(this), this.path = e, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, s = s || {};
      for (var r = Object.keys(s), f = 0, g = r.length; f < g; f++) {
        var E = r[f];
        this[E] = s[E];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = c.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return ir;
}
var or, ai;
function ra() {
  if (ai) return or;
  ai = 1, or = m;
  var b = Object.getPrototypeOf || function(c) {
    return c.__proto__;
  };
  function m(c) {
    if (c === null || typeof c != "object")
      return c;
    if (c instanceof Object)
      var S = { __proto__: b(c) };
    else
      var S = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(c).forEach(function(v) {
      Object.defineProperty(S, v, Object.getOwnPropertyDescriptor(c, v));
    }), S;
  }
  return or;
}
var mt, si;
function rt() {
  if (si) return mt;
  si = 1;
  var b = So, m = ea(), c = ta(), S = ra(), v = Ae, e, s;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (e = Symbol.for("graceful-fs.queue"), s = Symbol.for("graceful-fs.previous")) : (e = "___graceful-fs.queue", s = "___graceful-fs.previous");
  function r() {
  }
  function f(i, t) {
    Object.defineProperty(i, e, {
      get: function() {
        return t;
      }
    });
  }
  var g = r;
  if (v.debuglog ? g = v.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (g = function() {
    var i = v.format.apply(v, arguments);
    i = "GFS4: " + i.split(/\n/).join(`
GFS4: `), console.error(i);
  }), !b[e]) {
    var E = Pe[e] || [];
    f(b, E), b.close = (function(i) {
      function t(n, u) {
        return i.call(b, n, function(k) {
          k || w(), typeof u == "function" && u.apply(this, arguments);
        });
      }
      return Object.defineProperty(t, s, {
        value: i
      }), t;
    })(b.close), b.closeSync = (function(i) {
      function t(n) {
        i.apply(b, arguments), w();
      }
      return Object.defineProperty(t, s, {
        value: i
      }), t;
    })(b.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      g(b[e]), Ae.equal(b[e].length, 0);
    });
  }
  Pe[e] || f(Pe, b[e]), mt = p(S(b)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !b.__patched && (mt = p(b), b.__patched = !0);
  function p(i) {
    m(i), i.gracefulify = p, i.createReadStream = G, i.createWriteStream = ne;
    var t = i.readFile;
    i.readFile = n;
    function n(se, _e, h) {
      return typeof _e == "function" && (h = _e, _e = null), a(se, _e, h);
      function a(T, N, J, $) {
        return t(T, N, function(F) {
          F && (F.code === "EMFILE" || F.code === "ENFILE") ? y([a, [T, N, J], F, $ || Date.now(), Date.now()]) : typeof J == "function" && J.apply(this, arguments);
        });
      }
    }
    var u = i.writeFile;
    i.writeFile = k;
    function k(se, _e, h, a) {
      return typeof h == "function" && (a = h, h = null), T(se, _e, h, a);
      function T(N, J, $, F, P) {
        return u(N, J, $, function(X) {
          X && (X.code === "EMFILE" || X.code === "ENFILE") ? y([T, [N, J, $, F], X, P || Date.now(), Date.now()]) : typeof F == "function" && F.apply(this, arguments);
        });
      }
    }
    var R = i.appendFile;
    R && (i.appendFile = j);
    function j(se, _e, h, a) {
      return typeof h == "function" && (a = h, h = null), T(se, _e, h, a);
      function T(N, J, $, F, P) {
        return R(N, J, $, function(X) {
          X && (X.code === "EMFILE" || X.code === "ENFILE") ? y([T, [N, J, $, F], X, P || Date.now(), Date.now()]) : typeof F == "function" && F.apply(this, arguments);
        });
      }
    }
    var U = i.copyFile;
    U && (i.copyFile = M);
    function M(se, _e, h, a) {
      return typeof h == "function" && (a = h, h = 0), T(se, _e, h, a);
      function T(N, J, $, F, P) {
        return U(N, J, $, function(X) {
          X && (X.code === "EMFILE" || X.code === "ENFILE") ? y([T, [N, J, $, F], X, P || Date.now(), Date.now()]) : typeof F == "function" && F.apply(this, arguments);
        });
      }
    }
    var Z = i.readdir;
    i.readdir = Q;
    var q = /^v[0-5]\./;
    function Q(se, _e, h) {
      typeof _e == "function" && (h = _e, _e = null);
      var a = q.test(process.version) ? function(J, $, F, P) {
        return Z(J, T(
          J,
          $,
          F,
          P
        ));
      } : function(J, $, F, P) {
        return Z(J, $, T(
          J,
          $,
          F,
          P
        ));
      };
      return a(se, _e, h);
      function T(N, J, $, F) {
        return function(P, X) {
          P && (P.code === "EMFILE" || P.code === "ENFILE") ? y([
            a,
            [N, J, $],
            P,
            F || Date.now(),
            Date.now()
          ]) : (X && X.sort && X.sort(), typeof $ == "function" && $.call(this, P, X));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var re = c(i);
      W = re.ReadStream, Y = re.WriteStream;
    }
    var H = i.ReadStream;
    H && (W.prototype = Object.create(H.prototype), W.prototype.open = B);
    var te = i.WriteStream;
    te && (Y.prototype = Object.create(te.prototype), Y.prototype.open = C), Object.defineProperty(i, "ReadStream", {
      get: function() {
        return W;
      },
      set: function(se) {
        W = se;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(i, "WriteStream", {
      get: function() {
        return Y;
      },
      set: function(se) {
        Y = se;
      },
      enumerable: !0,
      configurable: !0
    });
    var ue = W;
    Object.defineProperty(i, "FileReadStream", {
      get: function() {
        return ue;
      },
      set: function(se) {
        ue = se;
      },
      enumerable: !0,
      configurable: !0
    });
    var fe = Y;
    Object.defineProperty(i, "FileWriteStream", {
      get: function() {
        return fe;
      },
      set: function(se) {
        fe = se;
      },
      enumerable: !0,
      configurable: !0
    });
    function W(se, _e) {
      return this instanceof W ? (H.apply(this, arguments), this) : W.apply(Object.create(W.prototype), arguments);
    }
    function B() {
      var se = this;
      he(se.path, se.flags, se.mode, function(_e, h) {
        _e ? (se.autoClose && se.destroy(), se.emit("error", _e)) : (se.fd = h, se.emit("open", h), se.read());
      });
    }
    function Y(se, _e) {
      return this instanceof Y ? (te.apply(this, arguments), this) : Y.apply(Object.create(Y.prototype), arguments);
    }
    function C() {
      var se = this;
      he(se.path, se.flags, se.mode, function(_e, h) {
        _e ? (se.destroy(), se.emit("error", _e)) : (se.fd = h, se.emit("open", h));
      });
    }
    function G(se, _e) {
      return new i.ReadStream(se, _e);
    }
    function ne(se, _e) {
      return new i.WriteStream(se, _e);
    }
    var D = i.open;
    i.open = he;
    function he(se, _e, h, a) {
      return typeof h == "function" && (a = h, h = null), T(se, _e, h, a);
      function T(N, J, $, F, P) {
        return D(N, J, $, function(X, pe) {
          X && (X.code === "EMFILE" || X.code === "ENFILE") ? y([T, [N, J, $, F], X, P || Date.now(), Date.now()]) : typeof F == "function" && F.apply(this, arguments);
        });
      }
    }
    return i;
  }
  function y(i) {
    g("ENQUEUE", i[0].name, i[1]), b[e].push(i), _();
  }
  var d;
  function w() {
    for (var i = Date.now(), t = 0; t < b[e].length; ++t)
      b[e][t].length > 2 && (b[e][t][3] = i, b[e][t][4] = i);
    _();
  }
  function _() {
    if (clearTimeout(d), d = void 0, b[e].length !== 0) {
      var i = b[e].shift(), t = i[0], n = i[1], u = i[2], k = i[3], R = i[4];
      if (k === void 0)
        g("RETRY", t.name, n), t.apply(null, n);
      else if (Date.now() - k >= 6e4) {
        g("TIMEOUT", t.name, n);
        var j = n.pop();
        typeof j == "function" && j.call(null, u);
      } else {
        var U = Date.now() - R, M = Math.max(R - k, 1), Z = Math.min(M * 1.2, 100);
        U >= Z ? (g("RETRY", t.name, n), t.apply(null, n.concat([k]))) : b[e].push(i);
      }
      d === void 0 && (d = setTimeout(_, 0));
    }
  }
  return mt;
}
var ui;
function Me() {
  return ui || (ui = 1, (function(b) {
    const m = De().fromCallback, c = rt(), S = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((v) => typeof c[v] == "function");
    Object.assign(b, c), S.forEach((v) => {
      b[v] = m(c[v]);
    }), b.exists = function(v, e) {
      return typeof e == "function" ? c.exists(v, e) : new Promise((s) => c.exists(v, s));
    }, b.read = function(v, e, s, r, f, g) {
      return typeof g == "function" ? c.read(v, e, s, r, f, g) : new Promise((E, p) => {
        c.read(v, e, s, r, f, (y, d, w) => {
          if (y) return p(y);
          E({ bytesRead: d, buffer: w });
        });
      });
    }, b.write = function(v, e, ...s) {
      return typeof s[s.length - 1] == "function" ? c.write(v, e, ...s) : new Promise((r, f) => {
        c.write(v, e, ...s, (g, E, p) => {
          if (g) return f(g);
          r({ bytesWritten: E, buffer: p });
        });
      });
    }, b.readv = function(v, e, ...s) {
      return typeof s[s.length - 1] == "function" ? c.readv(v, e, ...s) : new Promise((r, f) => {
        c.readv(v, e, ...s, (g, E, p) => {
          if (g) return f(g);
          r({ bytesRead: E, buffers: p });
        });
      });
    }, b.writev = function(v, e, ...s) {
      return typeof s[s.length - 1] == "function" ? c.writev(v, e, ...s) : new Promise((r, f) => {
        c.writev(v, e, ...s, (g, E, p) => {
          if (g) return f(g);
          r({ bytesWritten: E, buffers: p });
        });
      });
    }, typeof c.realpath.native == "function" ? b.realpath.native = m(c.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(rr)), rr;
}
var St = {}, ar = {}, li;
function na() {
  if (li) return ar;
  li = 1;
  const b = Le;
  return ar.checkPath = function(c) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(c.replace(b.parse(c).root, ""))) {
      const v = new Error(`Path contains invalid characters: ${c}`);
      throw v.code = "EINVAL", v;
    }
  }, ar;
}
var fi;
function ia() {
  if (fi) return St;
  fi = 1;
  const b = /* @__PURE__ */ Me(), { checkPath: m } = /* @__PURE__ */ na(), c = (S) => {
    const v = { mode: 511 };
    return typeof S == "number" ? S : { ...v, ...S }.mode;
  };
  return St.makeDir = async (S, v) => (m(S), b.mkdir(S, {
    mode: c(v),
    recursive: !0
  })), St.makeDirSync = (S, v) => (m(S), b.mkdirSync(S, {
    mode: c(v),
    recursive: !0
  })), St;
}
var sr, ci;
function He() {
  if (ci) return sr;
  ci = 1;
  const b = De().fromPromise, { makeDir: m, makeDirSync: c } = /* @__PURE__ */ ia(), S = b(m);
  return sr = {
    mkdirs: S,
    mkdirsSync: c,
    // alias
    mkdirp: S,
    mkdirpSync: c,
    ensureDir: S,
    ensureDirSync: c
  }, sr;
}
var ur, di;
function Qe() {
  if (di) return ur;
  di = 1;
  const b = De().fromPromise, m = /* @__PURE__ */ Me();
  function c(S) {
    return m.access(S).then(() => !0).catch(() => !1);
  }
  return ur = {
    pathExists: b(c),
    pathExistsSync: m.existsSync
  }, ur;
}
var lr, hi;
function Fo() {
  if (hi) return lr;
  hi = 1;
  const b = /* @__PURE__ */ Me(), m = De().fromPromise;
  async function c(v, e, s) {
    const r = await b.open(v, "r+");
    let f = null;
    try {
      await b.futimes(r, e, s);
    } finally {
      try {
        await b.close(r);
      } catch (g) {
        f = g;
      }
    }
    if (f)
      throw f;
  }
  function S(v, e, s) {
    const r = b.openSync(v, "r+");
    return b.futimesSync(r, e, s), b.closeSync(r);
  }
  return lr = {
    utimesMillis: m(c),
    utimesMillisSync: S
  }, lr;
}
var fr, pi;
function nt() {
  if (pi) return fr;
  pi = 1;
  const b = /* @__PURE__ */ Me(), m = Le, c = De().fromPromise;
  function S(y, d, w) {
    const _ = w.dereference ? (i) => b.stat(i, { bigint: !0 }) : (i) => b.lstat(i, { bigint: !0 });
    return Promise.all([
      _(y),
      _(d).catch((i) => {
        if (i.code === "ENOENT") return null;
        throw i;
      })
    ]).then(([i, t]) => ({ srcStat: i, destStat: t }));
  }
  function v(y, d, w) {
    let _;
    const i = w.dereference ? (n) => b.statSync(n, { bigint: !0 }) : (n) => b.lstatSync(n, { bigint: !0 }), t = i(y);
    try {
      _ = i(d);
    } catch (n) {
      if (n.code === "ENOENT") return { srcStat: t, destStat: null };
      throw n;
    }
    return { srcStat: t, destStat: _ };
  }
  async function e(y, d, w, _) {
    const { srcStat: i, destStat: t } = await S(y, d, _);
    if (t) {
      if (g(i, t)) {
        const n = m.basename(y), u = m.basename(d);
        if (w === "move" && n !== u && n.toLowerCase() === u.toLowerCase())
          return { srcStat: i, destStat: t, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (i.isDirectory() && !t.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${d}' with directory '${y}'.`);
      if (!i.isDirectory() && t.isDirectory())
        throw new Error(`Cannot overwrite directory '${d}' with non-directory '${y}'.`);
    }
    if (i.isDirectory() && E(y, d))
      throw new Error(p(y, d, w));
    return { srcStat: i, destStat: t };
  }
  function s(y, d, w, _) {
    const { srcStat: i, destStat: t } = v(y, d, _);
    if (t) {
      if (g(i, t)) {
        const n = m.basename(y), u = m.basename(d);
        if (w === "move" && n !== u && n.toLowerCase() === u.toLowerCase())
          return { srcStat: i, destStat: t, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (i.isDirectory() && !t.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${d}' with directory '${y}'.`);
      if (!i.isDirectory() && t.isDirectory())
        throw new Error(`Cannot overwrite directory '${d}' with non-directory '${y}'.`);
    }
    if (i.isDirectory() && E(y, d))
      throw new Error(p(y, d, w));
    return { srcStat: i, destStat: t };
  }
  async function r(y, d, w, _) {
    const i = m.resolve(m.dirname(y)), t = m.resolve(m.dirname(w));
    if (t === i || t === m.parse(t).root) return;
    let n;
    try {
      n = await b.stat(t, { bigint: !0 });
    } catch (u) {
      if (u.code === "ENOENT") return;
      throw u;
    }
    if (g(d, n))
      throw new Error(p(y, w, _));
    return r(y, d, t, _);
  }
  function f(y, d, w, _) {
    const i = m.resolve(m.dirname(y)), t = m.resolve(m.dirname(w));
    if (t === i || t === m.parse(t).root) return;
    let n;
    try {
      n = b.statSync(t, { bigint: !0 });
    } catch (u) {
      if (u.code === "ENOENT") return;
      throw u;
    }
    if (g(d, n))
      throw new Error(p(y, w, _));
    return f(y, d, t, _);
  }
  function g(y, d) {
    return d.ino !== void 0 && d.dev !== void 0 && d.ino === y.ino && d.dev === y.dev;
  }
  function E(y, d) {
    const w = m.resolve(y).split(m.sep).filter((i) => i), _ = m.resolve(d).split(m.sep).filter((i) => i);
    return w.every((i, t) => _[t] === i);
  }
  function p(y, d, w) {
    return `Cannot ${w} '${y}' to a subdirectory of itself, '${d}'.`;
  }
  return fr = {
    // checkPaths
    checkPaths: c(e),
    checkPathsSync: s,
    // checkParent
    checkParentPaths: c(r),
    checkParentPathsSync: f,
    // Misc
    isSrcSubdir: E,
    areIdentical: g
  }, fr;
}
var cr, yi;
function oa() {
  if (yi) return cr;
  yi = 1;
  async function b(m, c) {
    const S = [];
    for await (const v of m)
      S.push(
        c(v).then(
          () => null,
          (e) => e ?? new Error("unknown error")
        )
      );
    await Promise.all(
      S.map(
        (v) => v.then((e) => {
          if (e !== null) throw e;
        })
      )
    );
  }
  return cr = {
    asyncIteratorConcurrentProcess: b
  }, cr;
}
var dr, _i;
function aa() {
  if (_i) return dr;
  _i = 1;
  const b = /* @__PURE__ */ Me(), m = Le, { mkdirs: c } = /* @__PURE__ */ He(), { pathExists: S } = /* @__PURE__ */ Qe(), { utimesMillis: v } = /* @__PURE__ */ Fo(), e = /* @__PURE__ */ nt(), { asyncIteratorConcurrentProcess: s } = /* @__PURE__ */ oa();
  async function r(i, t, n = {}) {
    typeof n == "function" && (n = { filter: n }), n.clobber = "clobber" in n ? !!n.clobber : !0, n.overwrite = "overwrite" in n ? !!n.overwrite : n.clobber, n.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    );
    const { srcStat: u, destStat: k } = await e.checkPaths(i, t, "copy", n);
    if (await e.checkParentPaths(i, u, t, "copy"), !await f(i, t, n)) return;
    const j = m.dirname(t);
    await S(j) || await c(j), await g(k, i, t, n);
  }
  async function f(i, t, n) {
    return n.filter ? n.filter(i, t) : !0;
  }
  async function g(i, t, n, u) {
    const R = await (u.dereference ? b.stat : b.lstat)(t);
    if (R.isDirectory()) return w(R, i, t, n, u);
    if (R.isFile() || R.isCharacterDevice() || R.isBlockDevice()) return E(R, i, t, n, u);
    if (R.isSymbolicLink()) return _(i, t, n, u);
    throw R.isSocket() ? new Error(`Cannot copy a socket file: ${t}`) : R.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${t}`) : new Error(`Unknown file: ${t}`);
  }
  async function E(i, t, n, u, k) {
    if (!t) return p(i, n, u, k);
    if (k.overwrite)
      return await b.unlink(u), p(i, n, u, k);
    if (k.errorOnExist)
      throw new Error(`'${u}' already exists`);
  }
  async function p(i, t, n, u) {
    if (await b.copyFile(t, n), u.preserveTimestamps) {
      y(i.mode) && await d(n, i.mode);
      const k = await b.stat(t);
      await v(n, k.atime, k.mtime);
    }
    return b.chmod(n, i.mode);
  }
  function y(i) {
    return (i & 128) === 0;
  }
  function d(i, t) {
    return b.chmod(i, t | 128);
  }
  async function w(i, t, n, u, k) {
    t || await b.mkdir(u), await s(await b.opendir(n), async (R) => {
      const j = m.join(n, R.name), U = m.join(u, R.name);
      if (await f(j, U, k)) {
        const { destStat: Z } = await e.checkPaths(j, U, "copy", k);
        await g(Z, j, U, k);
      }
    }), t || await b.chmod(u, i.mode);
  }
  async function _(i, t, n, u) {
    let k = await b.readlink(t);
    if (u.dereference && (k = m.resolve(process.cwd(), k)), !i)
      return b.symlink(k, n);
    let R = null;
    try {
      R = await b.readlink(n);
    } catch (j) {
      if (j.code === "EINVAL" || j.code === "UNKNOWN") return b.symlink(k, n);
      throw j;
    }
    if (u.dereference && (R = m.resolve(process.cwd(), R)), e.isSrcSubdir(k, R))
      throw new Error(`Cannot copy '${k}' to a subdirectory of itself, '${R}'.`);
    if (e.isSrcSubdir(R, k))
      throw new Error(`Cannot overwrite '${R}' with '${k}'.`);
    return await b.unlink(n), b.symlink(k, n);
  }
  return dr = r, dr;
}
var hr, gi;
function sa() {
  if (gi) return hr;
  gi = 1;
  const b = rt(), m = Le, c = He().mkdirsSync, S = Fo().utimesMillisSync, v = /* @__PURE__ */ nt();
  function e(R, j, U) {
    typeof U == "function" && (U = { filter: U }), U = U || {}, U.clobber = "clobber" in U ? !!U.clobber : !0, U.overwrite = "overwrite" in U ? !!U.overwrite : U.clobber, U.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: M, destStat: Z } = v.checkPathsSync(R, j, "copy", U);
    if (v.checkParentPathsSync(R, M, j, "copy"), U.filter && !U.filter(R, j)) return;
    const q = m.dirname(j);
    return b.existsSync(q) || c(q), s(Z, R, j, U);
  }
  function s(R, j, U, M) {
    const q = (M.dereference ? b.statSync : b.lstatSync)(j);
    if (q.isDirectory()) return _(q, R, j, U, M);
    if (q.isFile() || q.isCharacterDevice() || q.isBlockDevice()) return r(q, R, j, U, M);
    if (q.isSymbolicLink()) return u(R, j, U, M);
    throw q.isSocket() ? new Error(`Cannot copy a socket file: ${j}`) : q.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${j}`) : new Error(`Unknown file: ${j}`);
  }
  function r(R, j, U, M, Z) {
    return j ? f(R, U, M, Z) : g(R, U, M, Z);
  }
  function f(R, j, U, M) {
    if (M.overwrite)
      return b.unlinkSync(U), g(R, j, U, M);
    if (M.errorOnExist)
      throw new Error(`'${U}' already exists`);
  }
  function g(R, j, U, M) {
    return b.copyFileSync(j, U), M.preserveTimestamps && E(R.mode, j, U), d(U, R.mode);
  }
  function E(R, j, U) {
    return p(R) && y(U, R), w(j, U);
  }
  function p(R) {
    return (R & 128) === 0;
  }
  function y(R, j) {
    return d(R, j | 128);
  }
  function d(R, j) {
    return b.chmodSync(R, j);
  }
  function w(R, j) {
    const U = b.statSync(R);
    return S(j, U.atime, U.mtime);
  }
  function _(R, j, U, M, Z) {
    return j ? t(U, M, Z) : i(R.mode, U, M, Z);
  }
  function i(R, j, U, M) {
    return b.mkdirSync(U), t(j, U, M), d(U, R);
  }
  function t(R, j, U) {
    const M = b.opendirSync(R);
    try {
      let Z;
      for (; (Z = M.readSync()) !== null; )
        n(Z.name, R, j, U);
    } finally {
      M.closeSync();
    }
  }
  function n(R, j, U, M) {
    const Z = m.join(j, R), q = m.join(U, R);
    if (M.filter && !M.filter(Z, q)) return;
    const { destStat: Q } = v.checkPathsSync(Z, q, "copy", M);
    return s(Q, Z, q, M);
  }
  function u(R, j, U, M) {
    let Z = b.readlinkSync(j);
    if (M.dereference && (Z = m.resolve(process.cwd(), Z)), R) {
      let q;
      try {
        q = b.readlinkSync(U);
      } catch (Q) {
        if (Q.code === "EINVAL" || Q.code === "UNKNOWN") return b.symlinkSync(Z, U);
        throw Q;
      }
      if (M.dereference && (q = m.resolve(process.cwd(), q)), v.isSrcSubdir(Z, q))
        throw new Error(`Cannot copy '${Z}' to a subdirectory of itself, '${q}'.`);
      if (v.isSrcSubdir(q, Z))
        throw new Error(`Cannot overwrite '${q}' with '${Z}'.`);
      return k(Z, U);
    } else
      return b.symlinkSync(Z, U);
  }
  function k(R, j) {
    return b.unlinkSync(j), b.symlinkSync(R, j);
  }
  return hr = e, hr;
}
var pr, wi;
function wn() {
  if (wi) return pr;
  wi = 1;
  const b = De().fromPromise;
  return pr = {
    copy: b(/* @__PURE__ */ aa()),
    copySync: /* @__PURE__ */ sa()
  }, pr;
}
var yr, bi;
function Ft() {
  if (bi) return yr;
  bi = 1;
  const b = rt(), m = De().fromCallback;
  function c(v, e) {
    b.rm(v, { recursive: !0, force: !0 }, e);
  }
  function S(v) {
    b.rmSync(v, { recursive: !0, force: !0 });
  }
  return yr = {
    remove: m(c),
    removeSync: S
  }, yr;
}
var _r, vi;
function ua() {
  if (vi) return _r;
  vi = 1;
  const b = De().fromPromise, m = /* @__PURE__ */ Me(), c = Le, S = /* @__PURE__ */ He(), v = /* @__PURE__ */ Ft(), e = b(async function(f) {
    let g;
    try {
      g = await m.readdir(f);
    } catch {
      return S.mkdirs(f);
    }
    return Promise.all(g.map((E) => v.remove(c.join(f, E))));
  });
  function s(r) {
    let f;
    try {
      f = m.readdirSync(r);
    } catch {
      return S.mkdirsSync(r);
    }
    f.forEach((g) => {
      g = c.join(r, g), v.removeSync(g);
    });
  }
  return _r = {
    emptyDirSync: s,
    emptydirSync: s,
    emptyDir: e,
    emptydir: e
  }, _r;
}
var gr, mi;
function la() {
  if (mi) return gr;
  mi = 1;
  const b = De().fromPromise, m = Le, c = /* @__PURE__ */ Me(), S = /* @__PURE__ */ He();
  async function v(s) {
    let r;
    try {
      r = await c.stat(s);
    } catch {
    }
    if (r && r.isFile()) return;
    const f = m.dirname(s);
    let g = null;
    try {
      g = await c.stat(f);
    } catch (E) {
      if (E.code === "ENOENT") {
        await S.mkdirs(f), await c.writeFile(s, "");
        return;
      } else
        throw E;
    }
    g.isDirectory() ? await c.writeFile(s, "") : await c.readdir(f);
  }
  function e(s) {
    let r;
    try {
      r = c.statSync(s);
    } catch {
    }
    if (r && r.isFile()) return;
    const f = m.dirname(s);
    try {
      c.statSync(f).isDirectory() || c.readdirSync(f);
    } catch (g) {
      if (g && g.code === "ENOENT") S.mkdirsSync(f);
      else throw g;
    }
    c.writeFileSync(s, "");
  }
  return gr = {
    createFile: b(v),
    createFileSync: e
  }, gr;
}
var wr, Si;
function fa() {
  if (Si) return wr;
  Si = 1;
  const b = De().fromPromise, m = Le, c = /* @__PURE__ */ Me(), S = /* @__PURE__ */ He(), { pathExists: v } = /* @__PURE__ */ Qe(), { areIdentical: e } = /* @__PURE__ */ nt();
  async function s(f, g) {
    let E;
    try {
      E = await c.lstat(g);
    } catch {
    }
    let p;
    try {
      p = await c.lstat(f);
    } catch (w) {
      throw w.message = w.message.replace("lstat", "ensureLink"), w;
    }
    if (E && e(p, E)) return;
    const y = m.dirname(g);
    await v(y) || await S.mkdirs(y), await c.link(f, g);
  }
  function r(f, g) {
    let E;
    try {
      E = c.lstatSync(g);
    } catch {
    }
    try {
      const d = c.lstatSync(f);
      if (E && e(d, E)) return;
    } catch (d) {
      throw d.message = d.message.replace("lstat", "ensureLink"), d;
    }
    const p = m.dirname(g);
    return c.existsSync(p) || S.mkdirsSync(p), c.linkSync(f, g);
  }
  return wr = {
    createLink: b(s),
    createLinkSync: r
  }, wr;
}
var br, Ei;
function ca() {
  if (Ei) return br;
  Ei = 1;
  const b = Le, m = /* @__PURE__ */ Me(), { pathExists: c } = /* @__PURE__ */ Qe(), S = De().fromPromise;
  async function v(s, r) {
    if (b.isAbsolute(s)) {
      try {
        await m.lstat(s);
      } catch (p) {
        throw p.message = p.message.replace("lstat", "ensureSymlink"), p;
      }
      return {
        toCwd: s,
        toDst: s
      };
    }
    const f = b.dirname(r), g = b.join(f, s);
    if (await c(g))
      return {
        toCwd: g,
        toDst: s
      };
    try {
      await m.lstat(s);
    } catch (p) {
      throw p.message = p.message.replace("lstat", "ensureSymlink"), p;
    }
    return {
      toCwd: s,
      toDst: b.relative(f, s)
    };
  }
  function e(s, r) {
    if (b.isAbsolute(s)) {
      if (!m.existsSync(s)) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: s,
        toDst: s
      };
    }
    const f = b.dirname(r), g = b.join(f, s);
    if (m.existsSync(g))
      return {
        toCwd: g,
        toDst: s
      };
    if (!m.existsSync(s)) throw new Error("relative srcpath does not exist");
    return {
      toCwd: s,
      toDst: b.relative(f, s)
    };
  }
  return br = {
    symlinkPaths: S(v),
    symlinkPathsSync: e
  }, br;
}
var vr, xi;
function da() {
  if (xi) return vr;
  xi = 1;
  const b = /* @__PURE__ */ Me(), m = De().fromPromise;
  async function c(v, e) {
    if (e) return e;
    let s;
    try {
      s = await b.lstat(v);
    } catch {
      return "file";
    }
    return s && s.isDirectory() ? "dir" : "file";
  }
  function S(v, e) {
    if (e) return e;
    let s;
    try {
      s = b.lstatSync(v);
    } catch {
      return "file";
    }
    return s && s.isDirectory() ? "dir" : "file";
  }
  return vr = {
    symlinkType: m(c),
    symlinkTypeSync: S
  }, vr;
}
var mr, Ri;
function ha() {
  if (Ri) return mr;
  Ri = 1;
  const b = De().fromPromise, m = Le, c = /* @__PURE__ */ Me(), { mkdirs: S, mkdirsSync: v } = /* @__PURE__ */ He(), { symlinkPaths: e, symlinkPathsSync: s } = /* @__PURE__ */ ca(), { symlinkType: r, symlinkTypeSync: f } = /* @__PURE__ */ da(), { pathExists: g } = /* @__PURE__ */ Qe(), { areIdentical: E } = /* @__PURE__ */ nt();
  async function p(d, w, _) {
    let i;
    try {
      i = await c.lstat(w);
    } catch {
    }
    if (i && i.isSymbolicLink()) {
      const [k, R] = await Promise.all([
        c.stat(d),
        c.stat(w)
      ]);
      if (E(k, R)) return;
    }
    const t = await e(d, w);
    d = t.toDst;
    const n = await r(t.toCwd, _), u = m.dirname(w);
    return await g(u) || await S(u), c.symlink(d, w, n);
  }
  function y(d, w, _) {
    let i;
    try {
      i = c.lstatSync(w);
    } catch {
    }
    if (i && i.isSymbolicLink()) {
      const k = c.statSync(d), R = c.statSync(w);
      if (E(k, R)) return;
    }
    const t = s(d, w);
    d = t.toDst, _ = f(t.toCwd, _);
    const n = m.dirname(w);
    return c.existsSync(n) || v(n), c.symlinkSync(d, w, _);
  }
  return mr = {
    createSymlink: b(p),
    createSymlinkSync: y
  }, mr;
}
var Sr, Ti;
function pa() {
  if (Ti) return Sr;
  Ti = 1;
  const { createFile: b, createFileSync: m } = /* @__PURE__ */ la(), { createLink: c, createLinkSync: S } = /* @__PURE__ */ fa(), { createSymlink: v, createSymlinkSync: e } = /* @__PURE__ */ ha();
  return Sr = {
    // file
    createFile: b,
    createFileSync: m,
    ensureFile: b,
    ensureFileSync: m,
    // link
    createLink: c,
    createLinkSync: S,
    ensureLink: c,
    ensureLinkSync: S,
    // symlink
    createSymlink: v,
    createSymlinkSync: e,
    ensureSymlink: v,
    ensureSymlinkSync: e
  }, Sr;
}
var Er, ki;
function bn() {
  if (ki) return Er;
  ki = 1;
  function b(c, { EOL: S = `
`, finalEOL: v = !0, replacer: e = null, spaces: s } = {}) {
    const r = v ? S : "";
    return JSON.stringify(c, e, s).replace(/\n/g, S) + r;
  }
  function m(c) {
    return Buffer.isBuffer(c) && (c = c.toString("utf8")), c.replace(/^\uFEFF/, "");
  }
  return Er = { stringify: b, stripBom: m }, Er;
}
var xr, Ci;
function ya() {
  if (Ci) return xr;
  Ci = 1;
  let b;
  try {
    b = rt();
  } catch {
    b = So;
  }
  const m = De(), { stringify: c, stripBom: S } = bn();
  async function v(E, p = {}) {
    typeof p == "string" && (p = { encoding: p });
    const y = p.fs || b, d = "throws" in p ? p.throws : !0;
    let w = await m.fromCallback(y.readFile)(E, p);
    w = S(w);
    let _;
    try {
      _ = JSON.parse(w, p ? p.reviver : null);
    } catch (i) {
      if (d)
        throw i.message = `${E}: ${i.message}`, i;
      return null;
    }
    return _;
  }
  const e = m.fromPromise(v);
  function s(E, p = {}) {
    typeof p == "string" && (p = { encoding: p });
    const y = p.fs || b, d = "throws" in p ? p.throws : !0;
    try {
      let w = y.readFileSync(E, p);
      return w = S(w), JSON.parse(w, p.reviver);
    } catch (w) {
      if (d)
        throw w.message = `${E}: ${w.message}`, w;
      return null;
    }
  }
  async function r(E, p, y = {}) {
    const d = y.fs || b, w = c(p, y);
    await m.fromCallback(d.writeFile)(E, w, y);
  }
  const f = m.fromPromise(r);
  function g(E, p, y = {}) {
    const d = y.fs || b, w = c(p, y);
    return d.writeFileSync(E, w, y);
  }
  return xr = {
    readFile: e,
    readFileSync: s,
    writeFile: f,
    writeFileSync: g
  }, xr;
}
var Rr, Fi;
function _a() {
  if (Fi) return Rr;
  Fi = 1;
  const b = ya();
  return Rr = {
    // jsonfile exports
    readJson: b.readFile,
    readJsonSync: b.readFileSync,
    writeJson: b.writeFile,
    writeJsonSync: b.writeFileSync
  }, Rr;
}
var Tr, Ai;
function vn() {
  if (Ai) return Tr;
  Ai = 1;
  const b = De().fromPromise, m = /* @__PURE__ */ Me(), c = Le, S = /* @__PURE__ */ He(), v = Qe().pathExists;
  async function e(r, f, g = "utf-8") {
    const E = c.dirname(r);
    return await v(E) || await S.mkdirs(E), m.writeFile(r, f, g);
  }
  function s(r, ...f) {
    const g = c.dirname(r);
    m.existsSync(g) || S.mkdirsSync(g), m.writeFileSync(r, ...f);
  }
  return Tr = {
    outputFile: b(e),
    outputFileSync: s
  }, Tr;
}
var kr, Oi;
function ga() {
  if (Oi) return kr;
  Oi = 1;
  const { stringify: b } = bn(), { outputFile: m } = /* @__PURE__ */ vn();
  async function c(S, v, e = {}) {
    const s = b(v, e);
    await m(S, s, e);
  }
  return kr = c, kr;
}
var Cr, Ii;
function wa() {
  if (Ii) return Cr;
  Ii = 1;
  const { stringify: b } = bn(), { outputFileSync: m } = /* @__PURE__ */ vn();
  function c(S, v, e) {
    const s = b(v, e);
    m(S, s, e);
  }
  return Cr = c, Cr;
}
var Fr, Di;
function ba() {
  if (Di) return Fr;
  Di = 1;
  const b = De().fromPromise, m = /* @__PURE__ */ _a();
  return m.outputJson = b(/* @__PURE__ */ ga()), m.outputJsonSync = /* @__PURE__ */ wa(), m.outputJSON = m.outputJson, m.outputJSONSync = m.outputJsonSync, m.writeJSON = m.writeJson, m.writeJSONSync = m.writeJsonSync, m.readJSON = m.readJson, m.readJSONSync = m.readJsonSync, Fr = m, Fr;
}
var Ar, Bi;
function va() {
  if (Bi) return Ar;
  Bi = 1;
  const b = /* @__PURE__ */ Me(), m = Le, { copy: c } = /* @__PURE__ */ wn(), { remove: S } = /* @__PURE__ */ Ft(), { mkdirp: v } = /* @__PURE__ */ He(), { pathExists: e } = /* @__PURE__ */ Qe(), s = /* @__PURE__ */ nt();
  async function r(E, p, y = {}) {
    const d = y.overwrite || y.clobber || !1, { srcStat: w, isChangingCase: _ = !1 } = await s.checkPaths(E, p, "move", y);
    await s.checkParentPaths(E, w, p, "move");
    const i = m.dirname(p);
    return m.parse(i).root !== i && await v(i), f(E, p, d, _);
  }
  async function f(E, p, y, d) {
    if (!d) {
      if (y)
        await S(p);
      else if (await e(p))
        throw new Error("dest already exists.");
    }
    try {
      await b.rename(E, p);
    } catch (w) {
      if (w.code !== "EXDEV")
        throw w;
      await g(E, p, y);
    }
  }
  async function g(E, p, y) {
    return await c(E, p, {
      overwrite: y,
      errorOnExist: !0,
      preserveTimestamps: !0
    }), S(E);
  }
  return Ar = r, Ar;
}
var Or, ji;
function ma() {
  if (ji) return Or;
  ji = 1;
  const b = rt(), m = Le, c = wn().copySync, S = Ft().removeSync, v = He().mkdirpSync, e = /* @__PURE__ */ nt();
  function s(p, y, d) {
    d = d || {};
    const w = d.overwrite || d.clobber || !1, { srcStat: _, isChangingCase: i = !1 } = e.checkPathsSync(p, y, "move", d);
    return e.checkParentPathsSync(p, _, y, "move"), r(y) || v(m.dirname(y)), f(p, y, w, i);
  }
  function r(p) {
    const y = m.dirname(p);
    return m.parse(y).root === y;
  }
  function f(p, y, d, w) {
    if (w) return g(p, y, d);
    if (d)
      return S(y), g(p, y, d);
    if (b.existsSync(y)) throw new Error("dest already exists.");
    return g(p, y, d);
  }
  function g(p, y, d) {
    try {
      b.renameSync(p, y);
    } catch (w) {
      if (w.code !== "EXDEV") throw w;
      return E(p, y, d);
    }
  }
  function E(p, y, d) {
    return c(p, y, {
      overwrite: d,
      errorOnExist: !0,
      preserveTimestamps: !0
    }), S(p);
  }
  return Or = s, Or;
}
var Ir, Ni;
function Sa() {
  if (Ni) return Ir;
  Ni = 1;
  const b = De().fromPromise;
  return Ir = {
    move: b(/* @__PURE__ */ va()),
    moveSync: /* @__PURE__ */ ma()
  }, Ir;
}
var Dr, Li;
function Ao() {
  return Li || (Li = 1, Dr = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ Me(),
    // Export extra methods:
    .../* @__PURE__ */ wn(),
    .../* @__PURE__ */ ua(),
    .../* @__PURE__ */ pa(),
    .../* @__PURE__ */ ba(),
    .../* @__PURE__ */ He(),
    .../* @__PURE__ */ Sa(),
    .../* @__PURE__ */ vn(),
    .../* @__PURE__ */ Qe(),
    .../* @__PURE__ */ Ft()
  }), Dr;
}
var Br, Mi;
function Ea() {
  if (Mi) return Br;
  Mi = 1, Br = e;
  const b = gn(), m = /* @__PURE__ */ Ao(), c = Le, S = Ae, v = Co();
  function e(s) {
    s.path = c.resolve(c.normalize(s.path));
    const r = new b(s), f = new S.Writable({ objectMode: !0 });
    f._write = async function(E, p, y) {
      const d = c.join(s.path, E.path.replace(/\\/g, "/"));
      if (d.indexOf(s.path) != 0)
        return y();
      if (E.type == "Directory")
        return await m.ensureDir(d), y();
      await m.ensureDir(c.dirname(d));
      const w = s.getWriter ? s.getWriter({ path: d }) : m.createWriteStream(d);
      E.pipe(w).on("error", y).on("close", y);
    };
    const g = v(r, f);
    return r.once("crx-header", function(E) {
      g.crxHeader = E;
    }), r.pipe(f).on("finish", function() {
      g.emit("close");
    }), g.promise = function() {
      return new Promise(function(E, p) {
        g.on("close", E), g.on("error", p);
      });
    }, g;
  }
  return Br;
}
var jr = { exports: {} }, Pi;
function xa() {
  if (Pi) return jr.exports;
  Pi = 1;
  for (var b = 4294967296, m = [], c = 0; c < 256; c++)
    m[c] = (c > 15 ? "" : "0") + c.toString(16);
  var S = jr.exports = function(v, e) {
    v instanceof Buffer ? (this.buffer = v, this.offset = e || 0) : Object.prototype.toString.call(v) == "[object Uint8Array]" ? (this.buffer = new Buffer(v), this.offset = e || 0) : (this.buffer = this.buffer || new Buffer(8), this.offset = 0, this.setValue.apply(this, arguments));
  };
  return S.MAX_INT = Math.pow(2, 53), S.MIN_INT = -Math.pow(2, 53), S.prototype = {
    constructor: S,
    /**
     * Do in-place 2's compliment.  See
     * http://en.wikipedia.org/wiki/Two's_complement
     */
    _2scomp: function() {
      for (var v = this.buffer, e = this.offset, s = 1, r = e + 7; r >= e; r--) {
        var f = (v[r] ^ 255) + s;
        v[r] = f & 255, s = f >> 8;
      }
    },
    /**
     * Set the value. Takes any of the following arguments:
     *
     * setValue(string) - A hexidecimal string
     * setValue(number) - Number (throws if n is outside int64 range)
     * setValue(hi, lo) - Raw bits as two 32-bit values
     */
    setValue: function(v, e) {
      var s = !1;
      if (arguments.length == 1)
        if (typeof v == "number") {
          if (s = v < 0, v = Math.abs(v), e = v % b, v = v / b, v > b) throw new RangeError(v + " is outside Int64 range");
          v = v | 0;
        } else if (typeof v == "string")
          v = (v + "").replace(/^0x/, ""), e = v.substr(-8), v = v.length > 8 ? v.substr(0, v.length - 8) : "", v = parseInt(v, 16), e = parseInt(e, 16);
        else
          throw new Error(v + " must be a Number or String");
      for (var r = this.buffer, f = this.offset, g = 7; g >= 0; g--)
        r[f + g] = e & 255, e = g == 4 ? v : e >>> 8;
      s && this._2scomp();
    },
    /**
     * Convert to a native JS number.
     *
     * WARNING: Do not expect this value to be accurate to integer precision for
     * large (positive or negative) numbers!
     *
     * @param allowImprecise If true, no check is performed to verify the
     * returned value is accurate to integer precision.  If false, imprecise
     * numbers (very large positive or negative numbers) will be forced to +/-
     * Infinity.
     */
    toNumber: function(v) {
      for (var e = this.buffer, s = this.offset, r = e[s] & 128, f = 0, g = 1, E = 7, p = 1; E >= 0; E--, p *= 256) {
        var y = e[s + E];
        r && (y = (y ^ 255) + g, g = y >> 8, y = y & 255), f += y * p;
      }
      return !v && f >= S.MAX_INT ? r ? -1 / 0 : 1 / 0 : r ? -f : f;
    },
    /**
     * Convert to a JS Number. Returns +/-Infinity for values that can't be
     * represented to integer precision.
     */
    valueOf: function() {
      return this.toNumber(!1);
    },
    /**
     * Return string value
     *
     * @param radix Just like Number#toString()'s radix
     */
    toString: function(v) {
      return this.valueOf().toString(v || 10);
    },
    /**
     * Return a string showing the buffer octets, with MSB on the left.
     *
     * @param sep separator string. default is '' (empty string)
     */
    toOctetString: function(v) {
      for (var e = new Array(8), s = this.buffer, r = this.offset, f = 0; f < 8; f++)
        e[f] = m[s[r + f]];
      return e.join(v || "");
    },
    /**
     * Returns the int64's 8 bytes in a buffer.
     *
     * @param {bool} [rawBuffer=false]  If no offset and this is true, return the internal buffer.  Should only be used if
     *                                  you're discarding the Int64 afterwards, as it breaks encapsulation.
     */
    toBuffer: function(v) {
      if (v && this.offset === 0) return this.buffer;
      var e = new Buffer(8);
      return this.buffer.copy(e, 0, this.offset, this.offset + 8), e;
    },
    /**
     * Copy 8 bytes of int64 into target buffer at target offset.
     *
     * @param {Buffer} targetBuffer       Buffer to copy into.
     * @param {number} [targetOffset=0]   Offset into target buffer.
     */
    copy: function(v, e) {
      this.buffer.copy(v, e || 0, this.offset, this.offset + 8);
    },
    /**
     * Returns a number indicating whether this comes before or after or is the
     * same as the other in sort order.
     *
     * @param {Int64} other  Other Int64 to compare.
     */
    compare: function(v) {
      if ((this.buffer[this.offset] & 128) != (v.buffer[v.offset] & 128))
        return v.buffer[v.offset] - this.buffer[this.offset];
      for (var e = 0; e < 8; e++)
        if (this.buffer[this.offset + e] !== v.buffer[v.offset + e])
          return this.buffer[this.offset + e] - v.buffer[v.offset + e];
      return 0;
    },
    /**
     * Returns a boolean indicating if this integer is equal to other.
     *
     * @param {Int64} other  Other Int64 to compare.
     */
    equals: function(v) {
      return this.compare(v) === 0;
    },
    /**
     * Pretty output in console.log
     */
    inspect: function() {
      return "[Int64 value:" + this + " octets:" + this.toOctetString(" ") + "]";
    }
  }, jr.exports;
}
var Nr = { exports: {} }, Lr = { exports: {} }, Mr, Ui;
function Fe() {
  if (Ui) return Mr;
  Ui = 1;
  class b extends Error {
    constructor(c) {
      if (!Array.isArray(c))
        throw new TypeError(`Expected input to be an Array, got ${typeof c}`);
      let S = "";
      for (let v = 0; v < c.length; v++)
        S += `    ${c[v].stack}
`;
      super(S), this.name = "AggregateError", this.errors = c;
    }
  }
  return Mr = {
    AggregateError: b,
    ArrayIsArray(m) {
      return Array.isArray(m);
    },
    ArrayPrototypeIncludes(m, c) {
      return m.includes(c);
    },
    ArrayPrototypeIndexOf(m, c) {
      return m.indexOf(c);
    },
    ArrayPrototypeJoin(m, c) {
      return m.join(c);
    },
    ArrayPrototypeMap(m, c) {
      return m.map(c);
    },
    ArrayPrototypePop(m, c) {
      return m.pop(c);
    },
    ArrayPrototypePush(m, c) {
      return m.push(c);
    },
    ArrayPrototypeSlice(m, c, S) {
      return m.slice(c, S);
    },
    Error,
    FunctionPrototypeCall(m, c, ...S) {
      return m.call(c, ...S);
    },
    FunctionPrototypeSymbolHasInstance(m, c) {
      return Function.prototype[Symbol.hasInstance].call(m, c);
    },
    MathFloor: Math.floor,
    Number,
    NumberIsInteger: Number.isInteger,
    NumberIsNaN: Number.isNaN,
    NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
    NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
    NumberParseInt: Number.parseInt,
    ObjectDefineProperties(m, c) {
      return Object.defineProperties(m, c);
    },
    ObjectDefineProperty(m, c, S) {
      return Object.defineProperty(m, c, S);
    },
    ObjectGetOwnPropertyDescriptor(m, c) {
      return Object.getOwnPropertyDescriptor(m, c);
    },
    ObjectKeys(m) {
      return Object.keys(m);
    },
    ObjectSetPrototypeOf(m, c) {
      return Object.setPrototypeOf(m, c);
    },
    Promise,
    PromisePrototypeCatch(m, c) {
      return m.catch(c);
    },
    PromisePrototypeThen(m, c, S) {
      return m.then(c, S);
    },
    PromiseReject(m) {
      return Promise.reject(m);
    },
    PromiseResolve(m) {
      return Promise.resolve(m);
    },
    ReflectApply: Reflect.apply,
    RegExpPrototypeTest(m, c) {
      return m.test(c);
    },
    SafeSet: Set,
    String,
    StringPrototypeSlice(m, c, S) {
      return m.slice(c, S);
    },
    StringPrototypeToLowerCase(m) {
      return m.toLowerCase();
    },
    StringPrototypeToUpperCase(m) {
      return m.toUpperCase();
    },
    StringPrototypeTrim(m) {
      return m.trim();
    },
    Symbol,
    SymbolFor: Symbol.for,
    SymbolAsyncIterator: Symbol.asyncIterator,
    SymbolHasInstance: Symbol.hasInstance,
    SymbolIterator: Symbol.iterator,
    SymbolDispose: Symbol.dispose || Symbol("Symbol.dispose"),
    SymbolAsyncDispose: Symbol.asyncDispose || Symbol("Symbol.asyncDispose"),
    TypedArrayPrototypeSet(m, c, S) {
      return m.set(c, S);
    },
    Boolean,
    Uint8Array
  }, Mr;
}
var Pr = { exports: {} }, Ur, Wi;
function Oo() {
  return Wi || (Wi = 1, Ur = {
    format(b, ...m) {
      return b.replace(/%([sdifj])/g, function(...[c, S]) {
        const v = m.shift();
        return S === "f" ? v.toFixed(6) : S === "j" ? JSON.stringify(v) : S === "s" && typeof v == "object" ? `${v.constructor !== Object ? v.constructor.name : ""} {}`.trim() : v.toString();
      });
    },
    inspect(b) {
      switch (typeof b) {
        case "string":
          if (b.includes("'"))
            if (b.includes('"')) {
              if (!b.includes("`") && !b.includes("${"))
                return `\`${b}\``;
            } else return `"${b}"`;
          return `'${b}'`;
        case "number":
          return isNaN(b) ? "NaN" : Object.is(b, -0) ? String(b) : b;
        case "bigint":
          return `${String(b)}n`;
        case "boolean":
        case "undefined":
          return String(b);
        case "object":
          return "{}";
      }
    }
  }), Ur;
}
var Wr, qi;
function je() {
  if (qi) return Wr;
  qi = 1;
  const { format: b, inspect: m } = Oo(), { AggregateError: c } = Fe(), S = globalThis.AggregateError || c, v = Symbol("kIsNodeError"), e = [
    "string",
    "function",
    "number",
    "object",
    // Accept 'Function' and 'Object' as alternative to the lower cased version.
    "Function",
    "Object",
    "boolean",
    "bigint",
    "symbol"
  ], s = /^([A-Z][a-z0-9]*)+$/, r = "__node_internal_", f = {};
  function g(i, t) {
    if (!i)
      throw new f.ERR_INTERNAL_ASSERTION(t);
  }
  function E(i) {
    let t = "", n = i.length;
    const u = i[0] === "-" ? 1 : 0;
    for (; n >= u + 4; n -= 3)
      t = `_${i.slice(n - 3, n)}${t}`;
    return `${i.slice(0, n)}${t}`;
  }
  function p(i, t, n) {
    if (typeof t == "function")
      return g(
        t.length <= n.length,
        // Default options do not count.
        `Code: ${i}; The provided arguments length (${n.length}) does not match the required ones (${t.length}).`
      ), t(...n);
    const u = (t.match(/%[dfijoOs]/g) || []).length;
    return g(
      u === n.length,
      `Code: ${i}; The provided arguments length (${n.length}) does not match the required ones (${u}).`
    ), n.length === 0 ? t : b(t, ...n);
  }
  function y(i, t, n) {
    n || (n = Error);
    class u extends n {
      constructor(...R) {
        super(p(i, t, R));
      }
      toString() {
        return `${this.name} [${i}]: ${this.message}`;
      }
    }
    Object.defineProperties(u.prototype, {
      name: {
        value: n.name,
        writable: !0,
        enumerable: !1,
        configurable: !0
      },
      toString: {
        value() {
          return `${this.name} [${i}]: ${this.message}`;
        },
        writable: !0,
        enumerable: !1,
        configurable: !0
      }
    }), u.prototype.code = i, u.prototype[v] = !0, f[i] = u;
  }
  function d(i) {
    const t = r + i.name;
    return Object.defineProperty(i, "name", {
      value: t
    }), i;
  }
  function w(i, t) {
    if (i && t && i !== t) {
      if (Array.isArray(t.errors))
        return t.errors.push(i), t;
      const n = new S([t, i], t.message);
      return n.code = t.code, n;
    }
    return i || t;
  }
  class _ extends Error {
    constructor(t = "The operation was aborted", n = void 0) {
      if (n !== void 0 && typeof n != "object")
        throw new f.ERR_INVALID_ARG_TYPE("options", "Object", n);
      super(t, n), this.code = "ABORT_ERR", this.name = "AbortError";
    }
  }
  return y("ERR_ASSERTION", "%s", Error), y(
    "ERR_INVALID_ARG_TYPE",
    (i, t, n) => {
      g(typeof i == "string", "'name' must be a string"), Array.isArray(t) || (t = [t]);
      let u = "The ";
      i.endsWith(" argument") ? u += `${i} ` : u += `"${i}" ${i.includes(".") ? "property" : "argument"} `, u += "must be ";
      const k = [], R = [], j = [];
      for (const M of t)
        g(typeof M == "string", "All expected entries have to be of type string"), e.includes(M) ? k.push(M.toLowerCase()) : s.test(M) ? R.push(M) : (g(M !== "object", 'The value "object" should be written as "Object"'), j.push(M));
      if (R.length > 0) {
        const M = k.indexOf("object");
        M !== -1 && (k.splice(k, M, 1), R.push("Object"));
      }
      if (k.length > 0) {
        switch (k.length) {
          case 1:
            u += `of type ${k[0]}`;
            break;
          case 2:
            u += `one of type ${k[0]} or ${k[1]}`;
            break;
          default: {
            const M = k.pop();
            u += `one of type ${k.join(", ")}, or ${M}`;
          }
        }
        (R.length > 0 || j.length > 0) && (u += " or ");
      }
      if (R.length > 0) {
        switch (R.length) {
          case 1:
            u += `an instance of ${R[0]}`;
            break;
          case 2:
            u += `an instance of ${R[0]} or ${R[1]}`;
            break;
          default: {
            const M = R.pop();
            u += `an instance of ${R.join(", ")}, or ${M}`;
          }
        }
        j.length > 0 && (u += " or ");
      }
      switch (j.length) {
        case 0:
          break;
        case 1:
          j[0].toLowerCase() !== j[0] && (u += "an "), u += `${j[0]}`;
          break;
        case 2:
          u += `one of ${j[0]} or ${j[1]}`;
          break;
        default: {
          const M = j.pop();
          u += `one of ${j.join(", ")}, or ${M}`;
        }
      }
      if (n == null)
        u += `. Received ${n}`;
      else if (typeof n == "function" && n.name)
        u += `. Received function ${n.name}`;
      else if (typeof n == "object") {
        var U;
        if ((U = n.constructor) !== null && U !== void 0 && U.name)
          u += `. Received an instance of ${n.constructor.name}`;
        else {
          const M = m(n, {
            depth: -1
          });
          u += `. Received ${M}`;
        }
      } else {
        let M = m(n, {
          colors: !1
        });
        M.length > 25 && (M = `${M.slice(0, 25)}...`), u += `. Received type ${typeof n} (${M})`;
      }
      return u;
    },
    TypeError
  ), y(
    "ERR_INVALID_ARG_VALUE",
    (i, t, n = "is invalid") => {
      let u = m(t);
      return u.length > 128 && (u = u.slice(0, 128) + "..."), `The ${i.includes(".") ? "property" : "argument"} '${i}' ${n}. Received ${u}`;
    },
    TypeError
  ), y(
    "ERR_INVALID_RETURN_VALUE",
    (i, t, n) => {
      var u;
      const k = n != null && (u = n.constructor) !== null && u !== void 0 && u.name ? `instance of ${n.constructor.name}` : `type ${typeof n}`;
      return `Expected ${i} to be returned from the "${t}" function but got ${k}.`;
    },
    TypeError
  ), y(
    "ERR_MISSING_ARGS",
    (...i) => {
      g(i.length > 0, "At least one arg needs to be specified");
      let t;
      const n = i.length;
      switch (i = (Array.isArray(i) ? i : [i]).map((u) => `"${u}"`).join(" or "), n) {
        case 1:
          t += `The ${i[0]} argument`;
          break;
        case 2:
          t += `The ${i[0]} and ${i[1]} arguments`;
          break;
        default:
          {
            const u = i.pop();
            t += `The ${i.join(", ")}, and ${u} arguments`;
          }
          break;
      }
      return `${t} must be specified`;
    },
    TypeError
  ), y(
    "ERR_OUT_OF_RANGE",
    (i, t, n) => {
      g(t, 'Missing "range" argument');
      let u;
      if (Number.isInteger(n) && Math.abs(n) > 2 ** 32)
        u = E(String(n));
      else if (typeof n == "bigint") {
        u = String(n);
        const k = BigInt(2) ** BigInt(32);
        (n > k || n < -k) && (u = E(u)), u += "n";
      } else
        u = m(n);
      return `The value of "${i}" is out of range. It must be ${t}. Received ${u}`;
    },
    RangeError
  ), y("ERR_MULTIPLE_CALLBACK", "Callback called multiple times", Error), y("ERR_METHOD_NOT_IMPLEMENTED", "The %s method is not implemented", Error), y("ERR_STREAM_ALREADY_FINISHED", "Cannot call %s after a stream was finished", Error), y("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable", Error), y("ERR_STREAM_DESTROYED", "Cannot call %s after a stream was destroyed", Error), y("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), y("ERR_STREAM_PREMATURE_CLOSE", "Premature close", Error), y("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF", Error), y("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event", Error), y("ERR_STREAM_WRITE_AFTER_END", "write after end", Error), y("ERR_UNKNOWN_ENCODING", "Unknown encoding: %s", TypeError), Wr = {
    AbortError: _,
    aggregateTwoErrors: d(w),
    hideStackFrames: d,
    codes: f
  }, Wr;
}
var ut = { exports: {} }, $i;
function lt() {
  if ($i) return ut.exports;
  $i = 1;
  const { AbortController: b, AbortSignal: m } = typeof self < "u" ? self : typeof window < "u" ? window : (
    /* otherwise */
    void 0
  );
  return ut.exports = b, ut.exports.AbortSignal = m, ut.exports.default = b, ut.exports;
}
var Hi;
function Ne() {
  return Hi || (Hi = 1, (function(b) {
    const m = $e(), { format: c, inspect: S } = Oo(), {
      codes: { ERR_INVALID_ARG_TYPE: v }
    } = je(), { kResistStopPropagation: e, AggregateError: s, SymbolDispose: r } = Fe(), f = globalThis.AbortSignal || lt().AbortSignal, g = globalThis.AbortController || lt().AbortController, E = Object.getPrototypeOf(async function() {
    }).constructor, p = globalThis.Blob || m.Blob, y = typeof p < "u" ? function(i) {
      return i instanceof p;
    } : function(i) {
      return !1;
    }, d = (_, i) => {
      if (_ !== void 0 && (_ === null || typeof _ != "object" || !("aborted" in _)))
        throw new v(i, "AbortSignal", _);
    }, w = (_, i) => {
      if (typeof _ != "function")
        throw new v(i, "Function", _);
    };
    b.exports = {
      AggregateError: s,
      kEmptyObject: Object.freeze({}),
      once(_) {
        let i = !1;
        return function(...t) {
          i || (i = !0, _.apply(this, t));
        };
      },
      createDeferredPromise: function() {
        let _, i;
        return {
          promise: new Promise((n, u) => {
            _ = n, i = u;
          }),
          resolve: _,
          reject: i
        };
      },
      promisify(_) {
        return new Promise((i, t) => {
          _((n, ...u) => n ? t(n) : i(...u));
        });
      },
      debuglog() {
        return function() {
        };
      },
      format: c,
      inspect: S,
      types: {
        isAsyncFunction(_) {
          return _ instanceof E;
        },
        isArrayBufferView(_) {
          return ArrayBuffer.isView(_);
        }
      },
      isBlob: y,
      deprecate(_, i) {
        return _;
      },
      addAbortListener: tt.addAbortListener || function(i, t) {
        if (i === void 0)
          throw new v("signal", "AbortSignal", i);
        d(i, "signal"), w(t, "listener");
        let n;
        return i.aborted ? queueMicrotask(() => t()) : (i.addEventListener("abort", t, {
          __proto__: null,
          once: !0,
          [e]: !0
        }), n = () => {
          i.removeEventListener("abort", t);
        }), {
          __proto__: null,
          [r]() {
            var u;
            (u = n) === null || u === void 0 || u();
          }
        };
      },
      AbortSignalAny: f.any || function(i) {
        if (i.length === 1)
          return i[0];
        const t = new g(), n = () => t.abort();
        return i.forEach((u) => {
          d(u, "signals"), u.addEventListener("abort", n, {
            once: !0
          });
        }), t.signal.addEventListener(
          "abort",
          () => {
            i.forEach((u) => u.removeEventListener("abort", n));
          },
          {
            once: !0
          }
        ), t.signal;
      }
    }, b.exports.promisify.custom = Symbol.for("nodejs.util.promisify.custom");
  })(Pr)), Pr.exports;
}
var Et = {}, qr, Vi;
function dt() {
  if (Vi) return qr;
  Vi = 1;
  const {
    ArrayIsArray: b,
    ArrayPrototypeIncludes: m,
    ArrayPrototypeJoin: c,
    ArrayPrototypeMap: S,
    NumberIsInteger: v,
    NumberIsNaN: e,
    NumberMAX_SAFE_INTEGER: s,
    NumberMIN_SAFE_INTEGER: r,
    NumberParseInt: f,
    ObjectPrototypeHasOwnProperty: g,
    RegExpPrototypeExec: E,
    String: p,
    StringPrototypeToUpperCase: y,
    StringPrototypeTrim: d
  } = Fe(), {
    hideStackFrames: w,
    codes: { ERR_SOCKET_BAD_PORT: _, ERR_INVALID_ARG_TYPE: i, ERR_INVALID_ARG_VALUE: t, ERR_OUT_OF_RANGE: n, ERR_UNKNOWN_SIGNAL: u }
  } = je(), { normalizeEncoding: k } = Ne(), { isAsyncFunction: R, isArrayBufferView: j } = Ne().types, U = {};
  function M(z) {
    return z === (z | 0);
  }
  function Z(z) {
    return z === z >>> 0;
  }
  const q = /^[0-7]+$/, Q = "must be a 32-bit unsigned integer or an octal string";
  function re(z, le, ye) {
    if (typeof z > "u" && (z = ye), typeof z == "string") {
      if (E(q, z) === null)
        throw new t(le, z, Q);
      z = f(z, 8);
    }
    return ue(z, le), z;
  }
  const H = w((z, le, ye = r, ie = s) => {
    if (typeof z != "number") throw new i(le, "number", z);
    if (!v(z)) throw new n(le, "an integer", z);
    if (z < ye || z > ie) throw new n(le, `>= ${ye} && <= ${ie}`, z);
  }), te = w((z, le, ye = -2147483648, ie = 2147483647) => {
    if (typeof z != "number")
      throw new i(le, "number", z);
    if (!v(z))
      throw new n(le, "an integer", z);
    if (z < ye || z > ie)
      throw new n(le, `>= ${ye} && <= ${ie}`, z);
  }), ue = w((z, le, ye = !1) => {
    if (typeof z != "number")
      throw new i(le, "number", z);
    if (!v(z))
      throw new n(le, "an integer", z);
    const ie = ye ? 1 : 0, Ee = 4294967295;
    if (z < ie || z > Ee)
      throw new n(le, `>= ${ie} && <= ${Ee}`, z);
  });
  function fe(z, le) {
    if (typeof z != "string") throw new i(le, "string", z);
  }
  function W(z, le, ye = void 0, ie) {
    if (typeof z != "number") throw new i(le, "number", z);
    if (ye != null && z < ye || ie != null && z > ie || (ye != null || ie != null) && e(z))
      throw new n(
        le,
        `${ye != null ? `>= ${ye}` : ""}${ye != null && ie != null ? " && " : ""}${ie != null ? `<= ${ie}` : ""}`,
        z
      );
  }
  const B = w((z, le, ye) => {
    if (!m(ye, z)) {
      const Ee = "must be one of: " + c(
        S(ye, (ke) => typeof ke == "string" ? `'${ke}'` : p(ke)),
        ", "
      );
      throw new t(le, z, Ee);
    }
  });
  function Y(z, le) {
    if (typeof z != "boolean") throw new i(le, "boolean", z);
  }
  function C(z, le, ye) {
    return z == null || !g(z, le) ? ye : z[le];
  }
  const G = w((z, le, ye = null) => {
    const ie = C(ye, "allowArray", !1), Ee = C(ye, "allowFunction", !1);
    if (!C(ye, "nullable", !1) && z === null || !ie && b(z) || typeof z != "object" && (!Ee || typeof z != "function"))
      throw new i(le, "Object", z);
  }), ne = w((z, le) => {
    if (z != null && typeof z != "object" && typeof z != "function")
      throw new i(le, "a dictionary", z);
  }), D = w((z, le, ye = 0) => {
    if (!b(z))
      throw new i(le, "Array", z);
    if (z.length < ye) {
      const ie = `must be longer than ${ye}`;
      throw new t(le, z, ie);
    }
  });
  function he(z, le) {
    D(z, le);
    for (let ye = 0; ye < z.length; ye++)
      fe(z[ye], `${le}[${ye}]`);
  }
  function se(z, le) {
    D(z, le);
    for (let ye = 0; ye < z.length; ye++)
      Y(z[ye], `${le}[${ye}]`);
  }
  function _e(z, le) {
    D(z, le);
    for (let ye = 0; ye < z.length; ye++) {
      const ie = z[ye], Ee = `${le}[${ye}]`;
      if (ie == null)
        throw new i(Ee, "AbortSignal", ie);
      J(ie, Ee);
    }
  }
  function h(z, le = "signal") {
    if (fe(z, le), U[z] === void 0)
      throw U[y(z)] !== void 0 ? new u(z + " (signals must use all capital letters)") : new u(z);
  }
  const a = w((z, le = "buffer") => {
    if (!j(z))
      throw new i(le, ["Buffer", "TypedArray", "DataView"], z);
  });
  function T(z, le) {
    const ye = k(le), ie = z.length;
    if (ye === "hex" && ie % 2 !== 0)
      throw new t("encoding", le, `is invalid for data of length ${ie}`);
  }
  function N(z, le = "Port", ye = !0) {
    if (typeof z != "number" && typeof z != "string" || typeof z == "string" && d(z).length === 0 || +z !== +z >>> 0 || z > 65535 || z === 0 && !ye)
      throw new _(le, z, ye);
    return z | 0;
  }
  const J = w((z, le) => {
    if (z !== void 0 && (z === null || typeof z != "object" || !("aborted" in z)))
      throw new i(le, "AbortSignal", z);
  }), $ = w((z, le) => {
    if (typeof z != "function") throw new i(le, "Function", z);
  }), F = w((z, le) => {
    if (typeof z != "function" || R(z)) throw new i(le, "Function", z);
  }), P = w((z, le) => {
    if (z !== void 0) throw new i(le, "undefined", z);
  });
  function X(z, le, ye) {
    if (!m(ye, z))
      throw new i(le, `('${c(ye, "|")}')`, z);
  }
  const pe = /^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/;
  function de(z, le) {
    if (typeof z > "u" || !E(pe, z))
      throw new t(
        le,
        z,
        'must be an array or string of format "</styles.css>; rel=preload; as=style"'
      );
  }
  function ce(z) {
    if (typeof z == "string")
      return de(z, "hints"), z;
    if (b(z)) {
      const le = z.length;
      let ye = "";
      if (le === 0)
        return ye;
      for (let ie = 0; ie < le; ie++) {
        const Ee = z[ie];
        de(Ee, "hints"), ye += Ee, ie !== le - 1 && (ye += ", ");
      }
      return ye;
    }
    throw new t(
      "hints",
      z,
      'must be an array or string of format "</styles.css>; rel=preload; as=style"'
    );
  }
  return qr = {
    isInt32: M,
    isUint32: Z,
    parseFileMode: re,
    validateArray: D,
    validateStringArray: he,
    validateBooleanArray: se,
    validateAbortSignalArray: _e,
    validateBoolean: Y,
    validateBuffer: a,
    validateDictionary: ne,
    validateEncoding: T,
    validateFunction: $,
    validateInt32: te,
    validateInteger: H,
    validateNumber: W,
    validateObject: G,
    validateOneOf: B,
    validatePlainFunction: F,
    validatePort: N,
    validateSignalName: h,
    validateString: fe,
    validateUint32: ue,
    validateUndefined: P,
    validateUnion: X,
    validateAbortSignal: J,
    validateLinkHeaderValue: ce
  }, qr;
}
var xt = { exports: {} }, $r = { exports: {} }, zi;
function Xe() {
  if (zi) return $r.exports;
  zi = 1;
  var b = $r.exports = {}, m, c;
  function S() {
    throw new Error("setTimeout has not been defined");
  }
  function v() {
    throw new Error("clearTimeout has not been defined");
  }
  (function() {
    try {
      typeof setTimeout == "function" ? m = setTimeout : m = S;
    } catch {
      m = S;
    }
    try {
      typeof clearTimeout == "function" ? c = clearTimeout : c = v;
    } catch {
      c = v;
    }
  })();
  function e(_) {
    if (m === setTimeout)
      return setTimeout(_, 0);
    if ((m === S || !m) && setTimeout)
      return m = setTimeout, setTimeout(_, 0);
    try {
      return m(_, 0);
    } catch {
      try {
        return m.call(null, _, 0);
      } catch {
        return m.call(this, _, 0);
      }
    }
  }
  function s(_) {
    if (c === clearTimeout)
      return clearTimeout(_);
    if ((c === v || !c) && clearTimeout)
      return c = clearTimeout, clearTimeout(_);
    try {
      return c(_);
    } catch {
      try {
        return c.call(null, _);
      } catch {
        return c.call(this, _);
      }
    }
  }
  var r = [], f = !1, g, E = -1;
  function p() {
    !f || !g || (f = !1, g.length ? r = g.concat(r) : E = -1, r.length && y());
  }
  function y() {
    if (!f) {
      var _ = e(p);
      f = !0;
      for (var i = r.length; i; ) {
        for (g = r, r = []; ++E < i; )
          g && g[E].run();
        E = -1, i = r.length;
      }
      g = null, f = !1, s(_);
    }
  }
  b.nextTick = function(_) {
    var i = new Array(arguments.length - 1);
    if (arguments.length > 1)
      for (var t = 1; t < arguments.length; t++)
        i[t - 1] = arguments[t];
    r.push(new d(_, i)), r.length === 1 && !f && e(y);
  };
  function d(_, i) {
    this.fun = _, this.array = i;
  }
  d.prototype.run = function() {
    this.fun.apply(null, this.array);
  }, b.title = "browser", b.browser = !0, b.env = {}, b.argv = [], b.version = "", b.versions = {};
  function w() {
  }
  return b.on = w, b.addListener = w, b.once = w, b.off = w, b.removeListener = w, b.removeAllListeners = w, b.emit = w, b.prependListener = w, b.prependOnceListener = w, b.listeners = function(_) {
    return [];
  }, b.binding = function(_) {
    throw new Error("process.binding is not supported");
  }, b.cwd = function() {
    return "/";
  }, b.chdir = function(_) {
    throw new Error("process.chdir is not supported");
  }, b.umask = function() {
    return 0;
  }, $r.exports;
}
var Hr, Gi;
function Ge() {
  if (Gi) return Hr;
  Gi = 1;
  const { SymbolAsyncIterator: b, SymbolIterator: m, SymbolFor: c } = Fe(), S = c("nodejs.stream.destroyed"), v = c("nodejs.stream.errored"), e = c("nodejs.stream.readable"), s = c("nodejs.stream.writable"), r = c("nodejs.stream.disturbed"), f = c("nodejs.webstream.isClosedPromise"), g = c("nodejs.webstream.controllerErrorFunction");
  function E(C, G = !1) {
    var ne;
    return !!(C && typeof C.pipe == "function" && typeof C.on == "function" && (!G || typeof C.pause == "function" && typeof C.resume == "function") && (!C._writableState || ((ne = C._readableState) === null || ne === void 0 ? void 0 : ne.readable) !== !1) && // Duplex
    (!C._writableState || C._readableState));
  }
  function p(C) {
    var G;
    return !!(C && typeof C.write == "function" && typeof C.on == "function" && (!C._readableState || ((G = C._writableState) === null || G === void 0 ? void 0 : G.writable) !== !1));
  }
  function y(C) {
    return !!(C && typeof C.pipe == "function" && C._readableState && typeof C.on == "function" && typeof C.write == "function");
  }
  function d(C) {
    return C && (C._readableState || C._writableState || typeof C.write == "function" && typeof C.on == "function" || typeof C.pipe == "function" && typeof C.on == "function");
  }
  function w(C) {
    return !!(C && !d(C) && typeof C.pipeThrough == "function" && typeof C.getReader == "function" && typeof C.cancel == "function");
  }
  function _(C) {
    return !!(C && !d(C) && typeof C.getWriter == "function" && typeof C.abort == "function");
  }
  function i(C) {
    return !!(C && !d(C) && typeof C.readable == "object" && typeof C.writable == "object");
  }
  function t(C) {
    return w(C) || _(C) || i(C);
  }
  function n(C, G) {
    return C == null ? !1 : G === !0 ? typeof C[b] == "function" : G === !1 ? typeof C[m] == "function" : typeof C[b] == "function" || typeof C[m] == "function";
  }
  function u(C) {
    if (!d(C)) return null;
    const G = C._writableState, ne = C._readableState, D = G || ne;
    return !!(C.destroyed || C[S] || D != null && D.destroyed);
  }
  function k(C) {
    if (!p(C)) return null;
    if (C.writableEnded === !0) return !0;
    const G = C._writableState;
    return G != null && G.errored ? !1 : typeof G?.ended != "boolean" ? null : G.ended;
  }
  function R(C, G) {
    if (!p(C)) return null;
    if (C.writableFinished === !0) return !0;
    const ne = C._writableState;
    return ne != null && ne.errored ? !1 : typeof ne?.finished != "boolean" ? null : !!(ne.finished || G === !1 && ne.ended === !0 && ne.length === 0);
  }
  function j(C) {
    if (!E(C)) return null;
    if (C.readableEnded === !0) return !0;
    const G = C._readableState;
    return !G || G.errored ? !1 : typeof G?.ended != "boolean" ? null : G.ended;
  }
  function U(C, G) {
    if (!E(C)) return null;
    const ne = C._readableState;
    return ne != null && ne.errored ? !1 : typeof ne?.endEmitted != "boolean" ? null : !!(ne.endEmitted || G === !1 && ne.ended === !0 && ne.length === 0);
  }
  function M(C) {
    return C && C[e] != null ? C[e] : typeof C?.readable != "boolean" ? null : u(C) ? !1 : E(C) && C.readable && !U(C);
  }
  function Z(C) {
    return C && C[s] != null ? C[s] : typeof C?.writable != "boolean" ? null : u(C) ? !1 : p(C) && C.writable && !k(C);
  }
  function q(C, G) {
    return d(C) ? u(C) ? !0 : !(G?.readable !== !1 && M(C) || G?.writable !== !1 && Z(C)) : null;
  }
  function Q(C) {
    var G, ne;
    return d(C) ? C.writableErrored ? C.writableErrored : (G = (ne = C._writableState) === null || ne === void 0 ? void 0 : ne.errored) !== null && G !== void 0 ? G : null : null;
  }
  function re(C) {
    var G, ne;
    return d(C) ? C.readableErrored ? C.readableErrored : (G = (ne = C._readableState) === null || ne === void 0 ? void 0 : ne.errored) !== null && G !== void 0 ? G : null : null;
  }
  function H(C) {
    if (!d(C))
      return null;
    if (typeof C.closed == "boolean")
      return C.closed;
    const G = C._writableState, ne = C._readableState;
    return typeof G?.closed == "boolean" || typeof ne?.closed == "boolean" ? G?.closed || ne?.closed : typeof C._closed == "boolean" && te(C) ? C._closed : null;
  }
  function te(C) {
    return typeof C._closed == "boolean" && typeof C._defaultKeepAlive == "boolean" && typeof C._removedConnection == "boolean" && typeof C._removedContLen == "boolean";
  }
  function ue(C) {
    return typeof C._sent100 == "boolean" && te(C);
  }
  function fe(C) {
    var G;
    return typeof C._consuming == "boolean" && typeof C._dumped == "boolean" && ((G = C.req) === null || G === void 0 ? void 0 : G.upgradeOrConnect) === void 0;
  }
  function W(C) {
    if (!d(C)) return null;
    const G = C._writableState, ne = C._readableState, D = G || ne;
    return !D && ue(C) || !!(D && D.autoDestroy && D.emitClose && D.closed === !1);
  }
  function B(C) {
    var G;
    return !!(C && ((G = C[r]) !== null && G !== void 0 ? G : C.readableDidRead || C.readableAborted));
  }
  function Y(C) {
    var G, ne, D, he, se, _e, h, a, T, N;
    return !!(C && ((G = (ne = (D = (he = (se = (_e = C[v]) !== null && _e !== void 0 ? _e : C.readableErrored) !== null && se !== void 0 ? se : C.writableErrored) !== null && he !== void 0 ? he : (h = C._readableState) === null || h === void 0 ? void 0 : h.errorEmitted) !== null && D !== void 0 ? D : (a = C._writableState) === null || a === void 0 ? void 0 : a.errorEmitted) !== null && ne !== void 0 ? ne : (T = C._readableState) === null || T === void 0 ? void 0 : T.errored) !== null && G !== void 0 ? G : !((N = C._writableState) === null || N === void 0) && N.errored));
  }
  return Hr = {
    isDestroyed: u,
    kIsDestroyed: S,
    isDisturbed: B,
    kIsDisturbed: r,
    isErrored: Y,
    kIsErrored: v,
    isReadable: M,
    kIsReadable: e,
    kIsClosedPromise: f,
    kControllerErrorFunction: g,
    kIsWritable: s,
    isClosed: H,
    isDuplexNodeStream: y,
    isFinished: q,
    isIterable: n,
    isReadableNodeStream: E,
    isReadableStream: w,
    isReadableEnded: j,
    isReadableFinished: U,
    isReadableErrored: re,
    isNodeStream: d,
    isWebStream: t,
    isWritable: Z,
    isWritableNodeStream: p,
    isWritableStream: _,
    isWritableEnded: k,
    isWritableFinished: R,
    isWritableErrored: Q,
    isServerRequest: fe,
    isServerResponse: ue,
    willEmitClose: W,
    isTransformStream: i
  }, Hr;
}
var Ji;
function Je() {
  if (Ji) return xt.exports;
  Ji = 1;
  const b = Xe(), { AbortError: m, codes: c } = je(), { ERR_INVALID_ARG_TYPE: S, ERR_STREAM_PREMATURE_CLOSE: v } = c, { kEmptyObject: e, once: s } = Ne(), { validateAbortSignal: r, validateFunction: f, validateObject: g, validateBoolean: E } = dt(), { Promise: p, PromisePrototypeThen: y, SymbolDispose: d } = Fe(), {
    isClosed: w,
    isReadable: _,
    isReadableNodeStream: i,
    isReadableStream: t,
    isReadableFinished: n,
    isReadableErrored: u,
    isWritable: k,
    isWritableNodeStream: R,
    isWritableStream: j,
    isWritableFinished: U,
    isWritableErrored: M,
    isNodeStream: Z,
    willEmitClose: q,
    kIsClosedPromise: Q
  } = Ge();
  let re;
  function H(B) {
    return B.setHeader && typeof B.abort == "function";
  }
  const te = () => {
  };
  function ue(B, Y, C) {
    var G, ne;
    if (arguments.length === 2 ? (C = Y, Y = e) : Y == null ? Y = e : g(Y, "options"), f(C, "callback"), r(Y.signal, "options.signal"), C = s(C), t(B) || j(B))
      return fe(B, Y, C);
    if (!Z(B))
      throw new S("stream", ["ReadableStream", "WritableStream", "Stream"], B);
    const D = (G = Y.readable) !== null && G !== void 0 ? G : i(B), he = (ne = Y.writable) !== null && ne !== void 0 ? ne : R(B), se = B._writableState, _e = B._readableState, h = () => {
      B.writable || N();
    };
    let a = q(B) && i(B) === D && R(B) === he, T = U(B, !1);
    const N = () => {
      T = !0, B.destroyed && (a = !1), !(a && (!B.readable || D)) && (!D || J) && C.call(B);
    };
    let J = n(B, !1);
    const $ = () => {
      J = !0, B.destroyed && (a = !1), !(a && (!B.writable || he)) && (!he || T) && C.call(B);
    }, F = (z) => {
      C.call(B, z);
    };
    let P = w(B);
    const X = () => {
      P = !0;
      const z = M(B) || u(B);
      if (z && typeof z != "boolean")
        return C.call(B, z);
      if (D && !J && i(B, !0) && !n(B, !1))
        return C.call(B, new v());
      if (he && !T && !U(B, !1))
        return C.call(B, new v());
      C.call(B);
    }, pe = () => {
      P = !0;
      const z = M(B) || u(B);
      if (z && typeof z != "boolean")
        return C.call(B, z);
      C.call(B);
    }, de = () => {
      B.req.on("finish", N);
    };
    H(B) ? (B.on("complete", N), a || B.on("abort", X), B.req ? de() : B.on("request", de)) : he && !se && (B.on("end", h), B.on("close", h)), !a && typeof B.aborted == "boolean" && B.on("aborted", X), B.on("end", $), B.on("finish", N), Y.error !== !1 && B.on("error", F), B.on("close", X), P ? b.nextTick(X) : se != null && se.errorEmitted || _e != null && _e.errorEmitted ? a || b.nextTick(pe) : (!D && (!a || _(B)) && (T || k(B) === !1) || !he && (!a || k(B)) && (J || _(B) === !1) || _e && B.req && B.aborted) && b.nextTick(pe);
    const ce = () => {
      C = te, B.removeListener("aborted", X), B.removeListener("complete", N), B.removeListener("abort", X), B.removeListener("request", de), B.req && B.req.removeListener("finish", N), B.removeListener("end", h), B.removeListener("close", h), B.removeListener("finish", N), B.removeListener("end", $), B.removeListener("error", F), B.removeListener("close", X);
    };
    if (Y.signal && !P) {
      const z = () => {
        const le = C;
        ce(), le.call(
          B,
          new m(void 0, {
            cause: Y.signal.reason
          })
        );
      };
      if (Y.signal.aborted)
        b.nextTick(z);
      else {
        re = re || Ne().addAbortListener;
        const le = re(Y.signal, z), ye = C;
        C = s((...ie) => {
          le[d](), ye.apply(B, ie);
        });
      }
    }
    return ce;
  }
  function fe(B, Y, C) {
    let G = !1, ne = te;
    if (Y.signal)
      if (ne = () => {
        G = !0, C.call(
          B,
          new m(void 0, {
            cause: Y.signal.reason
          })
        );
      }, Y.signal.aborted)
        b.nextTick(ne);
      else {
        re = re || Ne().addAbortListener;
        const he = re(Y.signal, ne), se = C;
        C = s((..._e) => {
          he[d](), se.apply(B, _e);
        });
      }
    const D = (...he) => {
      G || b.nextTick(() => C.apply(B, he));
    };
    return y(B[Q].promise, D, D), te;
  }
  function W(B, Y) {
    var C;
    let G = !1;
    return Y === null && (Y = e), (C = Y) !== null && C !== void 0 && C.cleanup && (E(Y.cleanup, "cleanup"), G = Y.cleanup), new p((ne, D) => {
      const he = ue(B, Y, (se) => {
        G && he(), se ? D(se) : ne();
      });
    });
  }
  return xt.exports = ue, xt.exports.finished = W, xt.exports;
}
var Vr, Ki;
function it() {
  if (Ki) return Vr;
  Ki = 1;
  const b = Xe(), {
    aggregateTwoErrors: m,
    codes: { ERR_MULTIPLE_CALLBACK: c },
    AbortError: S
  } = je(), { Symbol: v } = Fe(), { kIsDestroyed: e, isDestroyed: s, isFinished: r, isServerRequest: f } = Ge(), g = v("kDestroy"), E = v("kConstruct");
  function p(q, Q, re) {
    q && (q.stack, Q && !Q.errored && (Q.errored = q), re && !re.errored && (re.errored = q));
  }
  function y(q, Q) {
    const re = this._readableState, H = this._writableState, te = H || re;
    return H != null && H.destroyed || re != null && re.destroyed ? (typeof Q == "function" && Q(), this) : (p(q, H, re), H && (H.destroyed = !0), re && (re.destroyed = !0), te.constructed ? d(this, q, Q) : this.once(g, function(ue) {
      d(this, m(ue, q), Q);
    }), this);
  }
  function d(q, Q, re) {
    let H = !1;
    function te(ue) {
      if (H)
        return;
      H = !0;
      const fe = q._readableState, W = q._writableState;
      p(ue, W, fe), W && (W.closed = !0), fe && (fe.closed = !0), typeof re == "function" && re(ue), ue ? b.nextTick(w, q, ue) : b.nextTick(_, q);
    }
    try {
      q._destroy(Q || null, te);
    } catch (ue) {
      te(ue);
    }
  }
  function w(q, Q) {
    i(q, Q), _(q);
  }
  function _(q) {
    const Q = q._readableState, re = q._writableState;
    re && (re.closeEmitted = !0), Q && (Q.closeEmitted = !0), (re != null && re.emitClose || Q != null && Q.emitClose) && q.emit("close");
  }
  function i(q, Q) {
    const re = q._readableState, H = q._writableState;
    H != null && H.errorEmitted || re != null && re.errorEmitted || (H && (H.errorEmitted = !0), re && (re.errorEmitted = !0), q.emit("error", Q));
  }
  function t() {
    const q = this._readableState, Q = this._writableState;
    q && (q.constructed = !0, q.closed = !1, q.closeEmitted = !1, q.destroyed = !1, q.errored = null, q.errorEmitted = !1, q.reading = !1, q.ended = q.readable === !1, q.endEmitted = q.readable === !1), Q && (Q.constructed = !0, Q.destroyed = !1, Q.closed = !1, Q.closeEmitted = !1, Q.errored = null, Q.errorEmitted = !1, Q.finalCalled = !1, Q.prefinished = !1, Q.ended = Q.writable === !1, Q.ending = Q.writable === !1, Q.finished = Q.writable === !1);
  }
  function n(q, Q, re) {
    const H = q._readableState, te = q._writableState;
    if (te != null && te.destroyed || H != null && H.destroyed)
      return this;
    H != null && H.autoDestroy || te != null && te.autoDestroy ? q.destroy(Q) : Q && (Q.stack, te && !te.errored && (te.errored = Q), H && !H.errored && (H.errored = Q), re ? b.nextTick(i, q, Q) : i(q, Q));
  }
  function u(q, Q) {
    if (typeof q._construct != "function")
      return;
    const re = q._readableState, H = q._writableState;
    re && (re.constructed = !1), H && (H.constructed = !1), q.once(E, Q), !(q.listenerCount(E) > 1) && b.nextTick(k, q);
  }
  function k(q) {
    let Q = !1;
    function re(H) {
      if (Q) {
        n(q, H ?? new c());
        return;
      }
      Q = !0;
      const te = q._readableState, ue = q._writableState, fe = ue || te;
      te && (te.constructed = !0), ue && (ue.constructed = !0), fe.destroyed ? q.emit(g, H) : H ? n(q, H, !0) : b.nextTick(R, q);
    }
    try {
      q._construct((H) => {
        b.nextTick(re, H);
      });
    } catch (H) {
      b.nextTick(re, H);
    }
  }
  function R(q) {
    q.emit(E);
  }
  function j(q) {
    return q?.setHeader && typeof q.abort == "function";
  }
  function U(q) {
    q.emit("close");
  }
  function M(q, Q) {
    q.emit("error", Q), b.nextTick(U, q);
  }
  function Z(q, Q) {
    !q || s(q) || (!Q && !r(q) && (Q = new S()), f(q) ? (q.socket = null, q.destroy(Q)) : j(q) ? q.abort() : j(q.req) ? q.req.abort() : typeof q.destroy == "function" ? q.destroy(Q) : typeof q.close == "function" ? q.close() : Q ? b.nextTick(M, q, Q) : b.nextTick(U, q), q.destroyed || (q[e] = !0));
  }
  return Vr = {
    construct: u,
    destroyer: Z,
    destroy: y,
    undestroy: t,
    errorOrDestroy: n
  }, Vr;
}
var zr, Yi;
function mn() {
  if (Yi) return zr;
  Yi = 1;
  const { ArrayIsArray: b, ObjectSetPrototypeOf: m } = Fe(), { EventEmitter: c } = tt;
  function S(e) {
    c.call(this, e);
  }
  m(S.prototype, c.prototype), m(S, c), S.prototype.pipe = function(e, s) {
    const r = this;
    function f(_) {
      e.writable && e.write(_) === !1 && r.pause && r.pause();
    }
    r.on("data", f);
    function g() {
      r.readable && r.resume && r.resume();
    }
    e.on("drain", g), !e._isStdio && (!s || s.end !== !1) && (r.on("end", p), r.on("close", y));
    let E = !1;
    function p() {
      E || (E = !0, e.end());
    }
    function y() {
      E || (E = !0, typeof e.destroy == "function" && e.destroy());
    }
    function d(_) {
      w(), c.listenerCount(this, "error") === 0 && this.emit("error", _);
    }
    v(r, "error", d), v(e, "error", d);
    function w() {
      r.removeListener("data", f), e.removeListener("drain", g), r.removeListener("end", p), r.removeListener("close", y), r.removeListener("error", d), e.removeListener("error", d), r.removeListener("end", w), r.removeListener("close", w), e.removeListener("close", w);
    }
    return r.on("end", w), r.on("close", w), e.on("close", w), e.emit("pipe", r), e;
  };
  function v(e, s, r) {
    if (typeof e.prependListener == "function") return e.prependListener(s, r);
    !e._events || !e._events[s] ? e.on(s, r) : b(e._events[s]) ? e._events[s].unshift(r) : e._events[s] = [r, e._events[s]];
  }
  return zr = {
    Stream: S,
    prependListener: v
  }, zr;
}
var Gr = { exports: {} }, Qi;
function At() {
  return Qi || (Qi = 1, (function(b) {
    const { SymbolDispose: m } = Fe(), { AbortError: c, codes: S } = je(), { isNodeStream: v, isWebStream: e, kControllerErrorFunction: s } = Ge(), r = Je(), { ERR_INVALID_ARG_TYPE: f } = S;
    let g;
    const E = (p, y) => {
      if (typeof p != "object" || !("aborted" in p))
        throw new f(y, "AbortSignal", p);
    };
    b.exports.addAbortSignal = function(y, d) {
      if (E(y, "signal"), !v(d) && !e(d))
        throw new f("stream", ["ReadableStream", "WritableStream", "Stream"], d);
      return b.exports.addAbortSignalNoValidate(y, d);
    }, b.exports.addAbortSignalNoValidate = function(p, y) {
      if (typeof p != "object" || !("aborted" in p))
        return y;
      const d = v(y) ? () => {
        y.destroy(
          new c(void 0, {
            cause: p.reason
          })
        );
      } : () => {
        y[s](
          new c(void 0, {
            cause: p.reason
          })
        );
      };
      if (p.aborted)
        d();
      else {
        g = g || Ne().addAbortListener;
        const w = g(p, d);
        r(y, w[m]);
      }
      return y;
    };
  })(Gr)), Gr.exports;
}
var Jr, Xi;
function Ra() {
  if (Xi) return Jr;
  Xi = 1;
  const { StringPrototypeSlice: b, SymbolIterator: m, TypedArrayPrototypeSet: c, Uint8Array: S } = Fe(), { Buffer: v } = $e(), { inspect: e } = Ne();
  return Jr = class {
    constructor() {
      this.head = null, this.tail = null, this.length = 0;
    }
    push(r) {
      const f = {
        data: r,
        next: null
      };
      this.length > 0 ? this.tail.next = f : this.head = f, this.tail = f, ++this.length;
    }
    unshift(r) {
      const f = {
        data: r,
        next: this.head
      };
      this.length === 0 && (this.tail = f), this.head = f, ++this.length;
    }
    shift() {
      if (this.length === 0) return;
      const r = this.head.data;
      return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, r;
    }
    clear() {
      this.head = this.tail = null, this.length = 0;
    }
    join(r) {
      if (this.length === 0) return "";
      let f = this.head, g = "" + f.data;
      for (; (f = f.next) !== null; ) g += r + f.data;
      return g;
    }
    concat(r) {
      if (this.length === 0) return v.alloc(0);
      const f = v.allocUnsafe(r >>> 0);
      let g = this.head, E = 0;
      for (; g; )
        c(f, g.data, E), E += g.data.length, g = g.next;
      return f;
    }
    // Consumes a specified amount of bytes or characters from the buffered data.
    consume(r, f) {
      const g = this.head.data;
      if (r < g.length) {
        const E = g.slice(0, r);
        return this.head.data = g.slice(r), E;
      }
      return r === g.length ? this.shift() : f ? this._getString(r) : this._getBuffer(r);
    }
    first() {
      return this.head.data;
    }
    *[m]() {
      for (let r = this.head; r; r = r.next)
        yield r.data;
    }
    // Consumes a specified amount of characters from the buffered data.
    _getString(r) {
      let f = "", g = this.head, E = 0;
      do {
        const p = g.data;
        if (r > p.length)
          f += p, r -= p.length;
        else {
          r === p.length ? (f += p, ++E, g.next ? this.head = g.next : this.head = this.tail = null) : (f += b(p, 0, r), this.head = g, g.data = b(p, r));
          break;
        }
        ++E;
      } while ((g = g.next) !== null);
      return this.length -= E, f;
    }
    // Consumes a specified amount of bytes from the buffered data.
    _getBuffer(r) {
      const f = v.allocUnsafe(r), g = r;
      let E = this.head, p = 0;
      do {
        const y = E.data;
        if (r > y.length)
          c(f, y, g - r), r -= y.length;
        else {
          r === y.length ? (c(f, y, g - r), ++p, E.next ? this.head = E.next : this.head = this.tail = null) : (c(f, new S(y.buffer, y.byteOffset, r), g - r), this.head = E, E.data = y.slice(r));
          break;
        }
        ++p;
      } while ((E = E.next) !== null);
      return this.length -= p, f;
    }
    // Make sure the linked list only shows the minimal necessary information.
    [Symbol.for("nodejs.util.inspect.custom")](r, f) {
      return e(this, {
        ...f,
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: !1
      });
    }
  }, Jr;
}
var Kr, Zi;
function Ot() {
  if (Zi) return Kr;
  Zi = 1;
  const { MathFloor: b, NumberIsInteger: m } = Fe(), { validateInteger: c } = dt(), { ERR_INVALID_ARG_VALUE: S } = je().codes;
  let v = 16 * 1024, e = 16;
  function s(E, p, y) {
    return E.highWaterMark != null ? E.highWaterMark : p ? E[y] : null;
  }
  function r(E) {
    return E ? e : v;
  }
  function f(E, p) {
    c(p, "value", 0), E ? e = p : v = p;
  }
  function g(E, p, y, d) {
    const w = s(p, d, y);
    if (w != null) {
      if (!m(w) || w < 0) {
        const _ = d ? `options.${y}` : "options.highWaterMark";
        throw new S(_, w);
      }
      return b(w);
    }
    return r(E.objectMode);
  }
  return Kr = {
    getHighWaterMark: g,
    getDefaultHighWaterMark: r,
    setDefaultHighWaterMark: f
  }, Kr;
}
var Yr = {}, Rt = { exports: {} };
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var eo;
function Ta() {
  return eo || (eo = 1, (function(b, m) {
    var c = $e(), S = c.Buffer;
    function v(s, r) {
      for (var f in s)
        r[f] = s[f];
    }
    S.from && S.alloc && S.allocUnsafe && S.allocUnsafeSlow ? b.exports = c : (v(c, m), m.Buffer = e);
    function e(s, r, f) {
      return S(s, r, f);
    }
    e.prototype = Object.create(S.prototype), v(S, e), e.from = function(s, r, f) {
      if (typeof s == "number")
        throw new TypeError("Argument must not be a number");
      return S(s, r, f);
    }, e.alloc = function(s, r, f) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      var g = S(s);
      return r !== void 0 ? typeof f == "string" ? g.fill(r, f) : g.fill(r) : g.fill(0), g;
    }, e.allocUnsafe = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return S(s);
    }, e.allocUnsafeSlow = function(s) {
      if (typeof s != "number")
        throw new TypeError("Argument must be a number");
      return c.SlowBuffer(s);
    };
  })(Rt, Rt.exports)), Rt.exports;
}
var to;
function ka() {
  if (to) return Yr;
  to = 1;
  var b = Ta().Buffer, m = b.isEncoding || function(t) {
    switch (t = "" + t, t && t.toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
      case "raw":
        return !0;
      default:
        return !1;
    }
  };
  function c(t) {
    if (!t) return "utf8";
    for (var n; ; )
      switch (t) {
        case "utf8":
        case "utf-8":
          return "utf8";
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return "utf16le";
        case "latin1":
        case "binary":
          return "latin1";
        case "base64":
        case "ascii":
        case "hex":
          return t;
        default:
          if (n) return;
          t = ("" + t).toLowerCase(), n = !0;
      }
  }
  function S(t) {
    var n = c(t);
    if (typeof n != "string" && (b.isEncoding === m || !m(t))) throw new Error("Unknown encoding: " + t);
    return n || t;
  }
  Yr.StringDecoder = v;
  function v(t) {
    this.encoding = S(t);
    var n;
    switch (this.encoding) {
      case "utf16le":
        this.text = p, this.end = y, n = 4;
        break;
      case "utf8":
        this.fillLast = f, n = 4;
        break;
      case "base64":
        this.text = d, this.end = w, n = 3;
        break;
      default:
        this.write = _, this.end = i;
        return;
    }
    this.lastNeed = 0, this.lastTotal = 0, this.lastChar = b.allocUnsafe(n);
  }
  v.prototype.write = function(t) {
    if (t.length === 0) return "";
    var n, u;
    if (this.lastNeed) {
      if (n = this.fillLast(t), n === void 0) return "";
      u = this.lastNeed, this.lastNeed = 0;
    } else
      u = 0;
    return u < t.length ? n ? n + this.text(t, u) : this.text(t, u) : n || "";
  }, v.prototype.end = E, v.prototype.text = g, v.prototype.fillLast = function(t) {
    if (this.lastNeed <= t.length)
      return t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    t.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, t.length), this.lastNeed -= t.length;
  };
  function e(t) {
    return t <= 127 ? 0 : t >> 5 === 6 ? 2 : t >> 4 === 14 ? 3 : t >> 3 === 30 ? 4 : t >> 6 === 2 ? -1 : -2;
  }
  function s(t, n, u) {
    var k = n.length - 1;
    if (k < u) return 0;
    var R = e(n[k]);
    return R >= 0 ? (R > 0 && (t.lastNeed = R - 1), R) : --k < u || R === -2 ? 0 : (R = e(n[k]), R >= 0 ? (R > 0 && (t.lastNeed = R - 2), R) : --k < u || R === -2 ? 0 : (R = e(n[k]), R >= 0 ? (R > 0 && (R === 2 ? R = 0 : t.lastNeed = R - 3), R) : 0));
  }
  function r(t, n, u) {
    if ((n[0] & 192) !== 128)
      return t.lastNeed = 0, "�";
    if (t.lastNeed > 1 && n.length > 1) {
      if ((n[1] & 192) !== 128)
        return t.lastNeed = 1, "�";
      if (t.lastNeed > 2 && n.length > 2 && (n[2] & 192) !== 128)
        return t.lastNeed = 2, "�";
    }
  }
  function f(t) {
    var n = this.lastTotal - this.lastNeed, u = r(this, t);
    if (u !== void 0) return u;
    if (this.lastNeed <= t.length)
      return t.copy(this.lastChar, n, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
    t.copy(this.lastChar, n, 0, t.length), this.lastNeed -= t.length;
  }
  function g(t, n) {
    var u = s(this, t, n);
    if (!this.lastNeed) return t.toString("utf8", n);
    this.lastTotal = u;
    var k = t.length - (u - this.lastNeed);
    return t.copy(this.lastChar, 0, k), t.toString("utf8", n, k);
  }
  function E(t) {
    var n = t && t.length ? this.write(t) : "";
    return this.lastNeed ? n + "�" : n;
  }
  function p(t, n) {
    if ((t.length - n) % 2 === 0) {
      var u = t.toString("utf16le", n);
      if (u) {
        var k = u.charCodeAt(u.length - 1);
        if (k >= 55296 && k <= 56319)
          return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1], u.slice(0, -1);
      }
      return u;
    }
    return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = t[t.length - 1], t.toString("utf16le", n, t.length - 1);
  }
  function y(t) {
    var n = t && t.length ? this.write(t) : "";
    if (this.lastNeed) {
      var u = this.lastTotal - this.lastNeed;
      return n + this.lastChar.toString("utf16le", 0, u);
    }
    return n;
  }
  function d(t, n) {
    var u = (t.length - n) % 3;
    return u === 0 ? t.toString("base64", n) : (this.lastNeed = 3 - u, this.lastTotal = 3, u === 1 ? this.lastChar[0] = t[t.length - 1] : (this.lastChar[0] = t[t.length - 2], this.lastChar[1] = t[t.length - 1]), t.toString("base64", n, t.length - u));
  }
  function w(t) {
    var n = t && t.length ? this.write(t) : "";
    return this.lastNeed ? n + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : n;
  }
  function _(t) {
    return t.toString(this.encoding);
  }
  function i(t) {
    return t && t.length ? this.write(t) : "";
  }
  return Yr;
}
var Qr, ro;
function Io() {
  if (ro) return Qr;
  ro = 1;
  const b = Xe(), { PromisePrototypeThen: m, SymbolAsyncIterator: c, SymbolIterator: S } = Fe(), { Buffer: v } = $e(), { ERR_INVALID_ARG_TYPE: e, ERR_STREAM_NULL_VALUES: s } = je().codes;
  function r(f, g, E) {
    let p;
    if (typeof g == "string" || g instanceof v)
      return new f({
        objectMode: !0,
        ...E,
        read() {
          this.push(g), this.push(null);
        }
      });
    let y;
    if (g && g[c])
      y = !0, p = g[c]();
    else if (g && g[S])
      y = !1, p = g[S]();
    else
      throw new e("iterable", ["Iterable"], g);
    const d = new f({
      objectMode: !0,
      highWaterMark: 1,
      // TODO(ronag): What options should be allowed?
      ...E
    });
    let w = !1;
    d._read = function() {
      w || (w = !0, i());
    }, d._destroy = function(t, n) {
      m(
        _(t),
        () => b.nextTick(n, t),
        // nextTick is here in case cb throws
        (u) => b.nextTick(n, u || t)
      );
    };
    async function _(t) {
      const n = t != null, u = typeof p.throw == "function";
      if (n && u) {
        const { value: k, done: R } = await p.throw(t);
        if (await k, R)
          return;
      }
      if (typeof p.return == "function") {
        const { value: k } = await p.return();
        await k;
      }
    }
    async function i() {
      for (; ; ) {
        try {
          const { value: t, done: n } = y ? await p.next() : p.next();
          if (n)
            d.push(null);
          else {
            const u = t && typeof t.then == "function" ? await t : t;
            if (u === null)
              throw w = !1, new s();
            if (d.push(u))
              continue;
            w = !1;
          }
        } catch (t) {
          d.destroy(t);
        }
        break;
      }
    }
    return d;
  }
  return Qr = r, Qr;
}
var Xr, no;
function It() {
  if (no) return Xr;
  no = 1;
  const b = Xe(), {
    ArrayPrototypeIndexOf: m,
    NumberIsInteger: c,
    NumberIsNaN: S,
    NumberParseInt: v,
    ObjectDefineProperties: e,
    ObjectKeys: s,
    ObjectSetPrototypeOf: r,
    Promise: f,
    SafeSet: g,
    SymbolAsyncDispose: E,
    SymbolAsyncIterator: p,
    Symbol: y
  } = Fe();
  Xr = ie, ie.ReadableState = ye;
  const { EventEmitter: d } = tt, { Stream: w, prependListener: _ } = mn(), { Buffer: i } = $e(), { addAbortSignal: t } = At(), n = Je();
  let u = Ne().debuglog("stream", (I) => {
    u = I;
  });
  const k = Ra(), R = it(), { getHighWaterMark: j, getDefaultHighWaterMark: U } = Ot(), {
    aggregateTwoErrors: M,
    codes: {
      ERR_INVALID_ARG_TYPE: Z,
      ERR_METHOD_NOT_IMPLEMENTED: q,
      ERR_OUT_OF_RANGE: Q,
      ERR_STREAM_PUSH_AFTER_EOF: re,
      ERR_STREAM_UNSHIFT_AFTER_END_EVENT: H
    },
    AbortError: te
  } = je(), { validateObject: ue } = dt(), fe = y("kPaused"), { StringDecoder: W } = ka(), B = Io();
  r(ie.prototype, w.prototype), r(ie, w);
  const Y = () => {
  }, { errorOrDestroy: C } = R, G = 1, ne = 2, D = 4, he = 8, se = 16, _e = 32, h = 64, a = 128, T = 256, N = 512, J = 1024, $ = 2048, F = 4096, P = 8192, X = 16384, pe = 32768, de = 65536, ce = 1 << 17, z = 1 << 18;
  function le(I) {
    return {
      enumerable: !1,
      get() {
        return (this.state & I) !== 0;
      },
      set(L) {
        L ? this.state |= I : this.state &= ~I;
      }
    };
  }
  e(ye.prototype, {
    objectMode: le(G),
    ended: le(ne),
    endEmitted: le(D),
    reading: le(he),
    // Stream is still being constructed and cannot be
    // destroyed until construction finished or failed.
    // Async construction is opt in, therefore we start as
    // constructed.
    constructed: le(se),
    // A flag to be able to tell if the event 'readable'/'data' is emitted
    // immediately, or on a later tick.  We set this to true at first, because
    // any actions that shouldn't happen until "later" should generally also
    // not happen before the first read call.
    sync: le(_e),
    // Whenever we return null, then we set a flag to say
    // that we're awaiting a 'readable' event emission.
    needReadable: le(h),
    emittedReadable: le(a),
    readableListening: le(T),
    resumeScheduled: le(N),
    // True if the error was already emitted and should not be thrown again.
    errorEmitted: le(J),
    emitClose: le($),
    autoDestroy: le(F),
    // Has it been destroyed.
    destroyed: le(P),
    // Indicates whether the stream has finished destroying.
    closed: le(X),
    // True if close has been emitted or would have been emitted
    // depending on emitClose.
    closeEmitted: le(pe),
    multiAwaitDrain: le(de),
    // If true, a maybeReadMore has been scheduled.
    readingMore: le(ce),
    dataEmitted: le(z)
  });
  function ye(I, L, ge) {
    typeof ge != "boolean" && (ge = L instanceof ze()), this.state = $ | F | se | _e, I && I.objectMode && (this.state |= G), ge && I && I.readableObjectMode && (this.state |= G), this.highWaterMark = I ? j(this, I, "readableHighWaterMark", ge) : U(!1), this.buffer = new k(), this.length = 0, this.pipes = [], this.flowing = null, this[fe] = null, I && I.emitClose === !1 && (this.state &= ~$), I && I.autoDestroy === !1 && (this.state &= ~F), this.errored = null, this.defaultEncoding = I && I.defaultEncoding || "utf8", this.awaitDrainWriters = null, this.decoder = null, this.encoding = null, I && I.encoding && (this.decoder = new W(I.encoding), this.encoding = I.encoding);
  }
  function ie(I) {
    if (!(this instanceof ie)) return new ie(I);
    const L = this instanceof ze();
    this._readableState = new ye(I, this, L), I && (typeof I.read == "function" && (this._read = I.read), typeof I.destroy == "function" && (this._destroy = I.destroy), typeof I.construct == "function" && (this._construct = I.construct), I.signal && !L && t(I.signal, this)), w.call(this, I), R.construct(this, () => {
      this._readableState.needReadable && V(this, this._readableState);
    });
  }
  ie.prototype.destroy = R.destroy, ie.prototype._undestroy = R.undestroy, ie.prototype._destroy = function(I, L) {
    L(I);
  }, ie.prototype[d.captureRejectionSymbol] = function(I) {
    this.destroy(I);
  }, ie.prototype[E] = function() {
    let I;
    return this.destroyed || (I = this.readableEnded ? null : new te(), this.destroy(I)), new f((L, ge) => n(this, (we) => we && we !== I ? ge(we) : L(null)));
  }, ie.prototype.push = function(I, L) {
    return Ee(this, I, L, !1);
  }, ie.prototype.unshift = function(I, L) {
    return Ee(this, I, L, !0);
  };
  function Ee(I, L, ge, we) {
    u("readableAddChunk", L);
    const me = I._readableState;
    let Be;
    if ((me.state & G) === 0 && (typeof L == "string" ? (ge = ge || me.defaultEncoding, me.encoding !== ge && (we && me.encoding ? L = i.from(L, ge).toString(me.encoding) : (L = i.from(L, ge), ge = ""))) : L instanceof i ? ge = "" : w._isUint8Array(L) ? (L = w._uint8ArrayToBuffer(L), ge = "") : L != null && (Be = new Z("chunk", ["string", "Buffer", "Uint8Array"], L))), Be)
      C(I, Be);
    else if (L === null)
      me.state &= ~he, o(I, me);
    else if ((me.state & G) !== 0 || L && L.length > 0)
      if (we)
        if ((me.state & D) !== 0) C(I, new H());
        else {
          if (me.destroyed || me.errored) return !1;
          ke(I, me, L, !0);
        }
      else if (me.ended)
        C(I, new re());
      else {
        if (me.destroyed || me.errored)
          return !1;
        me.state &= ~he, me.decoder && !ge ? (L = me.decoder.write(L), me.objectMode || L.length !== 0 ? ke(I, me, L, !1) : V(I, me)) : ke(I, me, L, !1);
      }
    else we || (me.state &= ~he, V(I, me));
    return !me.ended && (me.length < me.highWaterMark || me.length === 0);
  }
  function ke(I, L, ge, we) {
    L.flowing && L.length === 0 && !L.sync && I.listenerCount("data") > 0 ? ((L.state & de) !== 0 ? L.awaitDrainWriters.clear() : L.awaitDrainWriters = null, L.dataEmitted = !0, I.emit("data", ge)) : (L.length += L.objectMode ? 1 : ge.length, we ? L.buffer.unshift(ge) : L.buffer.push(ge), (L.state & h) !== 0 && l(I)), V(I, L);
  }
  ie.prototype.isPaused = function() {
    const I = this._readableState;
    return I[fe] === !0 || I.flowing === !1;
  }, ie.prototype.setEncoding = function(I) {
    const L = new W(I);
    this._readableState.decoder = L, this._readableState.encoding = this._readableState.decoder.encoding;
    const ge = this._readableState.buffer;
    let we = "";
    for (const me of ge)
      we += L.write(me);
    return ge.clear(), we !== "" && ge.push(we), this._readableState.length = we.length, this;
  };
  const Se = 1073741824;
  function Oe(I) {
    if (I > Se)
      throw new Q("size", "<= 1GiB", I);
    return I--, I |= I >>> 1, I |= I >>> 2, I |= I >>> 4, I |= I >>> 8, I |= I >>> 16, I++, I;
  }
  function x(I, L) {
    return I <= 0 || L.length === 0 && L.ended ? 0 : (L.state & G) !== 0 ? 1 : S(I) ? L.flowing && L.length ? L.buffer.first().length : L.length : I <= L.length ? I : L.ended ? L.length : 0;
  }
  ie.prototype.read = function(I) {
    u("read", I), I === void 0 ? I = NaN : c(I) || (I = v(I, 10));
    const L = this._readableState, ge = I;
    if (I > L.highWaterMark && (L.highWaterMark = Oe(I)), I !== 0 && (L.state &= ~a), I === 0 && L.needReadable && ((L.highWaterMark !== 0 ? L.length >= L.highWaterMark : L.length > 0) || L.ended))
      return u("read: emitReadable", L.length, L.ended), L.length === 0 && L.ended ? Ce(this) : l(this), null;
    if (I = x(I, L), I === 0 && L.ended)
      return L.length === 0 && Ce(this), null;
    let we = (L.state & h) !== 0;
    if (u("need readable", we), (L.length === 0 || L.length - I < L.highWaterMark) && (we = !0, u("length less than watermark", we)), L.ended || L.reading || L.destroyed || L.errored || !L.constructed)
      we = !1, u("reading, ended or constructing", we);
    else if (we) {
      u("do read"), L.state |= he | _e, L.length === 0 && (L.state |= h);
      try {
        this._read(L.highWaterMark);
      } catch (Be) {
        C(this, Be);
      }
      L.state &= ~_e, L.reading || (I = x(ge, L));
    }
    let me;
    return I > 0 ? me = Te(I, L) : me = null, me === null ? (L.needReadable = L.length <= L.highWaterMark, I = 0) : (L.length -= I, L.multiAwaitDrain ? L.awaitDrainWriters.clear() : L.awaitDrainWriters = null), L.length === 0 && (L.ended || (L.needReadable = !0), ge !== I && L.ended && Ce(this)), me !== null && !L.errorEmitted && !L.closeEmitted && (L.dataEmitted = !0, this.emit("data", me)), me;
  };
  function o(I, L) {
    if (u("onEofChunk"), !L.ended) {
      if (L.decoder) {
        const ge = L.decoder.end();
        ge && ge.length && (L.buffer.push(ge), L.length += L.objectMode ? 1 : ge.length);
      }
      L.ended = !0, L.sync ? l(I) : (L.needReadable = !1, L.emittedReadable = !0, A(I));
    }
  }
  function l(I) {
    const L = I._readableState;
    u("emitReadable", L.needReadable, L.emittedReadable), L.needReadable = !1, L.emittedReadable || (u("emitReadable", L.flowing), L.emittedReadable = !0, b.nextTick(A, I));
  }
  function A(I) {
    const L = I._readableState;
    u("emitReadable_", L.destroyed, L.length, L.ended), !L.destroyed && !L.errored && (L.length || L.ended) && (I.emit("readable"), L.emittedReadable = !1), L.needReadable = !L.flowing && !L.ended && L.length <= L.highWaterMark, ve(I);
  }
  function V(I, L) {
    !L.readingMore && L.constructed && (L.readingMore = !0, b.nextTick(ee, I, L));
  }
  function ee(I, L) {
    for (; !L.reading && !L.ended && (L.length < L.highWaterMark || L.flowing && L.length === 0); ) {
      const ge = L.length;
      if (u("maybeReadMore read 0"), I.read(0), ge === L.length)
        break;
    }
    L.readingMore = !1;
  }
  ie.prototype._read = function(I) {
    throw new q("_read()");
  }, ie.prototype.pipe = function(I, L) {
    const ge = this, we = this._readableState;
    we.pipes.length === 1 && (we.multiAwaitDrain || (we.multiAwaitDrain = !0, we.awaitDrainWriters = new g(we.awaitDrainWriters ? [we.awaitDrainWriters] : []))), we.pipes.push(I), u("pipe count=%d opts=%j", we.pipes.length, L);
    const Be = (!L || L.end !== !1) && I !== b.stdout && I !== b.stderr ? xn : at;
    we.endEmitted ? b.nextTick(Be) : ge.once("end", Be), I.on("unpipe", Ue);
    function Ue(Ye, Ve) {
      u("onunpipe"), Ye === ge && Ve && Ve.hasUnpiped === !1 && (Ve.hasUnpiped = !0, Po());
    }
    function xn() {
      u("onend"), I.end();
    }
    let Ke, Rn = !1;
    function Po() {
      u("cleanup"), I.removeListener("close", Bt), I.removeListener("finish", jt), Ke && I.removeListener("drain", Ke), I.removeListener("error", Dt), I.removeListener("unpipe", Ue), ge.removeListener("end", xn), ge.removeListener("end", at), ge.removeListener("data", kn), Rn = !0, Ke && we.awaitDrainWriters && (!I._writableState || I._writableState.needDrain) && Ke();
    }
    function Tn() {
      Rn || (we.pipes.length === 1 && we.pipes[0] === I ? (u("false write response, pause", 0), we.awaitDrainWriters = I, we.multiAwaitDrain = !1) : we.pipes.length > 1 && we.pipes.includes(I) && (u("false write response, pause", we.awaitDrainWriters.size), we.awaitDrainWriters.add(I)), ge.pause()), Ke || (Ke = O(ge, I), I.on("drain", Ke));
    }
    ge.on("data", kn);
    function kn(Ye) {
      u("ondata");
      const Ve = I.write(Ye);
      u("dest.write", Ve), Ve === !1 && Tn();
    }
    function Dt(Ye) {
      if (u("onerror", Ye), at(), I.removeListener("error", Dt), I.listenerCount("error") === 0) {
        const Ve = I._writableState || I._readableState;
        Ve && !Ve.errorEmitted ? C(I, Ye) : I.emit("error", Ye);
      }
    }
    _(I, "error", Dt);
    function Bt() {
      I.removeListener("finish", jt), at();
    }
    I.once("close", Bt);
    function jt() {
      u("onfinish"), I.removeListener("close", Bt), at();
    }
    I.once("finish", jt);
    function at() {
      u("unpipe"), ge.unpipe(I);
    }
    return I.emit("pipe", ge), I.writableNeedDrain === !0 ? Tn() : we.flowing || (u("pipe resume"), ge.resume()), I;
  };
  function O(I, L) {
    return function() {
      const we = I._readableState;
      we.awaitDrainWriters === L ? (u("pipeOnDrain", 1), we.awaitDrainWriters = null) : we.multiAwaitDrain && (u("pipeOnDrain", we.awaitDrainWriters.size), we.awaitDrainWriters.delete(L)), (!we.awaitDrainWriters || we.awaitDrainWriters.size === 0) && I.listenerCount("data") && I.resume();
    };
  }
  ie.prototype.unpipe = function(I) {
    const L = this._readableState, ge = {
      hasUnpiped: !1
    };
    if (L.pipes.length === 0) return this;
    if (!I) {
      const me = L.pipes;
      L.pipes = [], this.pause();
      for (let Be = 0; Be < me.length; Be++)
        me[Be].emit("unpipe", this, {
          hasUnpiped: !1
        });
      return this;
    }
    const we = m(L.pipes, I);
    return we === -1 ? this : (L.pipes.splice(we, 1), L.pipes.length === 0 && this.pause(), I.emit("unpipe", this, ge), this);
  }, ie.prototype.on = function(I, L) {
    const ge = w.prototype.on.call(this, I, L), we = this._readableState;
    return I === "data" ? (we.readableListening = this.listenerCount("readable") > 0, we.flowing !== !1 && this.resume()) : I === "readable" && !we.endEmitted && !we.readableListening && (we.readableListening = we.needReadable = !0, we.flowing = !1, we.emittedReadable = !1, u("on readable", we.length, we.reading), we.length ? l(this) : we.reading || b.nextTick(ae, this)), ge;
  }, ie.prototype.addListener = ie.prototype.on, ie.prototype.removeListener = function(I, L) {
    const ge = w.prototype.removeListener.call(this, I, L);
    return I === "readable" && b.nextTick(K, this), ge;
  }, ie.prototype.off = ie.prototype.removeListener, ie.prototype.removeAllListeners = function(I) {
    const L = w.prototype.removeAllListeners.apply(this, arguments);
    return (I === "readable" || I === void 0) && b.nextTick(K, this), L;
  };
  function K(I) {
    const L = I._readableState;
    L.readableListening = I.listenerCount("readable") > 0, L.resumeScheduled && L[fe] === !1 ? L.flowing = !0 : I.listenerCount("data") > 0 ? I.resume() : L.readableListening || (L.flowing = null);
  }
  function ae(I) {
    u("readable nexttick read 0"), I.read(0);
  }
  ie.prototype.resume = function() {
    const I = this._readableState;
    return I.flowing || (u("resume"), I.flowing = !I.readableListening, oe(this, I)), I[fe] = !1, this;
  };
  function oe(I, L) {
    L.resumeScheduled || (L.resumeScheduled = !0, b.nextTick(be, I, L));
  }
  function be(I, L) {
    u("resume", L.reading), L.reading || I.read(0), L.resumeScheduled = !1, I.emit("resume"), ve(I), L.flowing && !L.reading && I.read(0);
  }
  ie.prototype.pause = function() {
    return u("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (u("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState[fe] = !0, this;
  };
  function ve(I) {
    const L = I._readableState;
    for (u("flow", L.flowing); L.flowing && I.read() !== null; ) ;
  }
  ie.prototype.wrap = function(I) {
    let L = !1;
    I.on("data", (we) => {
      !this.push(we) && I.pause && (L = !0, I.pause());
    }), I.on("end", () => {
      this.push(null);
    }), I.on("error", (we) => {
      C(this, we);
    }), I.on("close", () => {
      this.destroy();
    }), I.on("destroy", () => {
      this.destroy();
    }), this._read = () => {
      L && I.resume && (L = !1, I.resume());
    };
    const ge = s(I);
    for (let we = 1; we < ge.length; we++) {
      const me = ge[we];
      this[me] === void 0 && typeof I[me] == "function" && (this[me] = I[me].bind(I));
    }
    return this;
  }, ie.prototype[p] = function() {
    return Re(this);
  }, ie.prototype.iterator = function(I) {
    return I !== void 0 && ue(I, "options"), Re(this, I);
  };
  function Re(I, L) {
    typeof I.read != "function" && (I = ie.wrap(I, {
      objectMode: !0
    }));
    const ge = xe(I, L);
    return ge.stream = I, ge;
  }
  async function* xe(I, L) {
    let ge = Y;
    function we(Ue) {
      this === I ? (ge(), ge = Y) : ge = Ue;
    }
    I.on("readable", we);
    let me;
    const Be = n(
      I,
      {
        writable: !1
      },
      (Ue) => {
        me = Ue ? M(me, Ue) : null, ge(), ge = Y;
      }
    );
    try {
      for (; ; ) {
        const Ue = I.destroyed ? null : I.read();
        if (Ue !== null)
          yield Ue;
        else {
          if (me)
            throw me;
          if (me === null)
            return;
          await new f(we);
        }
      }
    } catch (Ue) {
      throw me = M(me, Ue), me;
    } finally {
      (me || L?.destroyOnReturn !== !1) && (me === void 0 || I._readableState.autoDestroy) ? R.destroyer(I, null) : (I.off("readable", we), Be());
    }
  }
  e(ie.prototype, {
    readable: {
      __proto__: null,
      get() {
        const I = this._readableState;
        return !!I && I.readable !== !1 && !I.destroyed && !I.errorEmitted && !I.endEmitted;
      },
      set(I) {
        this._readableState && (this._readableState.readable = !!I);
      }
    },
    readableDidRead: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return this._readableState.dataEmitted;
      }
    },
    readableAborted: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return !!(this._readableState.readable !== !1 && (this._readableState.destroyed || this._readableState.errored) && !this._readableState.endEmitted);
      }
    },
    readableHighWaterMark: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return this._readableState.highWaterMark;
      }
    },
    readableBuffer: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return this._readableState && this._readableState.buffer;
      }
    },
    readableFlowing: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return this._readableState.flowing;
      },
      set: function(I) {
        this._readableState && (this._readableState.flowing = I);
      }
    },
    readableLength: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState.length;
      }
    },
    readableObjectMode: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState ? this._readableState.objectMode : !1;
      }
    },
    readableEncoding: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState ? this._readableState.encoding : null;
      }
    },
    errored: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState ? this._readableState.errored : null;
      }
    },
    closed: {
      __proto__: null,
      get() {
        return this._readableState ? this._readableState.closed : !1;
      }
    },
    destroyed: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState ? this._readableState.destroyed : !1;
      },
      set(I) {
        this._readableState && (this._readableState.destroyed = I);
      }
    },
    readableEnded: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._readableState ? this._readableState.endEmitted : !1;
      }
    }
  }), e(ye.prototype, {
    // Legacy getter for `pipesCount`.
    pipesCount: {
      __proto__: null,
      get() {
        return this.pipes.length;
      }
    },
    // Legacy property for `paused`.
    paused: {
      __proto__: null,
      get() {
        return this[fe] !== !1;
      },
      set(I) {
        this[fe] = !!I;
      }
    }
  }), ie._fromList = Te;
  function Te(I, L) {
    if (L.length === 0) return null;
    let ge;
    return L.objectMode ? ge = L.buffer.shift() : !I || I >= L.length ? (L.decoder ? ge = L.buffer.join("") : L.buffer.length === 1 ? ge = L.buffer.first() : ge = L.buffer.concat(L.length), L.buffer.clear()) : ge = L.buffer.consume(I, L.decoder), ge;
  }
  function Ce(I) {
    const L = I._readableState;
    u("endReadable", L.endEmitted), L.endEmitted || (L.ended = !0, b.nextTick(We, L, I));
  }
  function We(I, L) {
    if (u("endReadableNT", I.endEmitted, I.length), !I.errored && !I.closeEmitted && !I.endEmitted && I.length === 0) {
      if (I.endEmitted = !0, L.emit("end"), L.writable && L.allowHalfOpen === !1)
        b.nextTick(qe, L);
      else if (I.autoDestroy) {
        const ge = L._writableState;
        (!ge || ge.autoDestroy && // We don't expect the writable to ever 'finish'
        // if writable is explicitly set to false.
        (ge.finished || ge.writable === !1)) && L.destroy();
      }
    }
  }
  function qe(I) {
    I.writable && !I.writableEnded && !I.destroyed && I.end();
  }
  ie.from = function(I, L) {
    return B(ie, I, L);
  };
  let ot;
  function ht() {
    return ot === void 0 && (ot = {}), ot;
  }
  return ie.fromWeb = function(I, L) {
    return ht().newStreamReadableFromReadableStream(I, L);
  }, ie.toWeb = function(I, L) {
    return ht().newReadableStreamFromStreamReadable(I, L);
  }, ie.wrap = function(I, L) {
    var ge, we;
    return new ie({
      objectMode: (ge = (we = I.readableObjectMode) !== null && we !== void 0 ? we : I.objectMode) !== null && ge !== void 0 ? ge : !0,
      ...L,
      destroy(me, Be) {
        R.destroyer(I, me), Be(me);
      }
    }).wrap(I);
  }, Xr;
}
var Zr, io;
function Sn() {
  if (io) return Zr;
  io = 1;
  const b = Xe(), {
    ArrayPrototypeSlice: m,
    Error: c,
    FunctionPrototypeSymbolHasInstance: S,
    ObjectDefineProperty: v,
    ObjectDefineProperties: e,
    ObjectSetPrototypeOf: s,
    StringPrototypeToLowerCase: r,
    Symbol: f,
    SymbolHasInstance: g
  } = Fe();
  Zr = ue, ue.WritableState = H;
  const { EventEmitter: E } = tt, p = mn().Stream, { Buffer: y } = $e(), d = it(), { addAbortSignal: w } = At(), { getHighWaterMark: _, getDefaultHighWaterMark: i } = Ot(), {
    ERR_INVALID_ARG_TYPE: t,
    ERR_METHOD_NOT_IMPLEMENTED: n,
    ERR_MULTIPLE_CALLBACK: u,
    ERR_STREAM_CANNOT_PIPE: k,
    ERR_STREAM_DESTROYED: R,
    ERR_STREAM_ALREADY_FINISHED: j,
    ERR_STREAM_NULL_VALUES: U,
    ERR_STREAM_WRITE_AFTER_END: M,
    ERR_UNKNOWN_ENCODING: Z
  } = je().codes, { errorOrDestroy: q } = d;
  s(ue.prototype, p.prototype), s(ue, p);
  function Q() {
  }
  const re = f("kOnFinished");
  function H(F, P, X) {
    typeof X != "boolean" && (X = P instanceof ze()), this.objectMode = !!(F && F.objectMode), X && (this.objectMode = this.objectMode || !!(F && F.writableObjectMode)), this.highWaterMark = F ? _(this, F, "writableHighWaterMark", X) : i(!1), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
    const pe = !!(F && F.decodeStrings === !1);
    this.decodeStrings = !pe, this.defaultEncoding = F && F.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = C.bind(void 0, P), this.writecb = null, this.writelen = 0, this.afterWriteTickInfo = null, te(this), this.pendingcb = 0, this.constructed = !0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = !F || F.emitClose !== !1, this.autoDestroy = !F || F.autoDestroy !== !1, this.errored = null, this.closed = !1, this.closeEmitted = !1, this[re] = [];
  }
  function te(F) {
    F.buffered = [], F.bufferedIndex = 0, F.allBuffers = !0, F.allNoop = !0;
  }
  H.prototype.getBuffer = function() {
    return m(this.buffered, this.bufferedIndex);
  }, v(H.prototype, "bufferedRequestCount", {
    __proto__: null,
    get() {
      return this.buffered.length - this.bufferedIndex;
    }
  });
  function ue(F) {
    const P = this instanceof ze();
    if (!P && !S(ue, this)) return new ue(F);
    this._writableState = new H(F, this, P), F && (typeof F.write == "function" && (this._write = F.write), typeof F.writev == "function" && (this._writev = F.writev), typeof F.destroy == "function" && (this._destroy = F.destroy), typeof F.final == "function" && (this._final = F.final), typeof F.construct == "function" && (this._construct = F.construct), F.signal && w(F.signal, this)), p.call(this, F), d.construct(this, () => {
      const X = this._writableState;
      X.writing || he(this, X), a(this, X);
    });
  }
  v(ue, g, {
    __proto__: null,
    value: function(F) {
      return S(this, F) ? !0 : this !== ue ? !1 : F && F._writableState instanceof H;
    }
  }), ue.prototype.pipe = function() {
    q(this, new k());
  };
  function fe(F, P, X, pe) {
    const de = F._writableState;
    if (typeof X == "function")
      pe = X, X = de.defaultEncoding;
    else {
      if (!X) X = de.defaultEncoding;
      else if (X !== "buffer" && !y.isEncoding(X)) throw new Z(X);
      typeof pe != "function" && (pe = Q);
    }
    if (P === null)
      throw new U();
    if (!de.objectMode)
      if (typeof P == "string")
        de.decodeStrings !== !1 && (P = y.from(P, X), X = "buffer");
      else if (P instanceof y)
        X = "buffer";
      else if (p._isUint8Array(P))
        P = p._uint8ArrayToBuffer(P), X = "buffer";
      else
        throw new t("chunk", ["string", "Buffer", "Uint8Array"], P);
    let ce;
    return de.ending ? ce = new M() : de.destroyed && (ce = new R("write")), ce ? (b.nextTick(pe, ce), q(F, ce, !0), ce) : (de.pendingcb++, W(F, de, P, X, pe));
  }
  ue.prototype.write = function(F, P, X) {
    return fe(this, F, P, X) === !0;
  }, ue.prototype.cork = function() {
    this._writableState.corked++;
  }, ue.prototype.uncork = function() {
    const F = this._writableState;
    F.corked && (F.corked--, F.writing || he(this, F));
  }, ue.prototype.setDefaultEncoding = function(P) {
    if (typeof P == "string" && (P = r(P)), !y.isEncoding(P)) throw new Z(P);
    return this._writableState.defaultEncoding = P, this;
  };
  function W(F, P, X, pe, de) {
    const ce = P.objectMode ? 1 : X.length;
    P.length += ce;
    const z = P.length < P.highWaterMark;
    return z || (P.needDrain = !0), P.writing || P.corked || P.errored || !P.constructed ? (P.buffered.push({
      chunk: X,
      encoding: pe,
      callback: de
    }), P.allBuffers && pe !== "buffer" && (P.allBuffers = !1), P.allNoop && de !== Q && (P.allNoop = !1)) : (P.writelen = ce, P.writecb = de, P.writing = !0, P.sync = !0, F._write(X, pe, P.onwrite), P.sync = !1), z && !P.errored && !P.destroyed;
  }
  function B(F, P, X, pe, de, ce, z) {
    P.writelen = pe, P.writecb = z, P.writing = !0, P.sync = !0, P.destroyed ? P.onwrite(new R("write")) : X ? F._writev(de, P.onwrite) : F._write(de, ce, P.onwrite), P.sync = !1;
  }
  function Y(F, P, X, pe) {
    --P.pendingcb, pe(X), D(P), q(F, X);
  }
  function C(F, P) {
    const X = F._writableState, pe = X.sync, de = X.writecb;
    if (typeof de != "function") {
      q(F, new u());
      return;
    }
    X.writing = !1, X.writecb = null, X.length -= X.writelen, X.writelen = 0, P ? (P.stack, X.errored || (X.errored = P), F._readableState && !F._readableState.errored && (F._readableState.errored = P), pe ? b.nextTick(Y, F, X, P, de) : Y(F, X, P, de)) : (X.buffered.length > X.bufferedIndex && he(F, X), pe ? X.afterWriteTickInfo !== null && X.afterWriteTickInfo.cb === de ? X.afterWriteTickInfo.count++ : (X.afterWriteTickInfo = {
      count: 1,
      cb: de,
      stream: F,
      state: X
    }, b.nextTick(G, X.afterWriteTickInfo)) : ne(F, X, 1, de));
  }
  function G({ stream: F, state: P, count: X, cb: pe }) {
    return P.afterWriteTickInfo = null, ne(F, P, X, pe);
  }
  function ne(F, P, X, pe) {
    for (!P.ending && !F.destroyed && P.length === 0 && P.needDrain && (P.needDrain = !1, F.emit("drain")); X-- > 0; )
      P.pendingcb--, pe();
    P.destroyed && D(P), a(F, P);
  }
  function D(F) {
    if (F.writing)
      return;
    for (let de = F.bufferedIndex; de < F.buffered.length; ++de) {
      var P;
      const { chunk: ce, callback: z } = F.buffered[de], le = F.objectMode ? 1 : ce.length;
      F.length -= le, z(
        (P = F.errored) !== null && P !== void 0 ? P : new R("write")
      );
    }
    const X = F[re].splice(0);
    for (let de = 0; de < X.length; de++) {
      var pe;
      X[de](
        (pe = F.errored) !== null && pe !== void 0 ? pe : new R("end")
      );
    }
    te(F);
  }
  function he(F, P) {
    if (P.corked || P.bufferProcessing || P.destroyed || !P.constructed)
      return;
    const { buffered: X, bufferedIndex: pe, objectMode: de } = P, ce = X.length - pe;
    if (!ce)
      return;
    let z = pe;
    if (P.bufferProcessing = !0, ce > 1 && F._writev) {
      P.pendingcb -= ce - 1;
      const le = P.allNoop ? Q : (ie) => {
        for (let Ee = z; Ee < X.length; ++Ee)
          X[Ee].callback(ie);
      }, ye = P.allNoop && z === 0 ? X : m(X, z);
      ye.allBuffers = P.allBuffers, B(F, P, !0, P.length, ye, "", le), te(P);
    } else {
      do {
        const { chunk: le, encoding: ye, callback: ie } = X[z];
        X[z++] = null;
        const Ee = de ? 1 : le.length;
        B(F, P, !1, Ee, le, ye, ie);
      } while (z < X.length && !P.writing);
      z === X.length ? te(P) : z > 256 ? (X.splice(0, z), P.bufferedIndex = 0) : P.bufferedIndex = z;
    }
    P.bufferProcessing = !1;
  }
  ue.prototype._write = function(F, P, X) {
    if (this._writev)
      this._writev(
        [
          {
            chunk: F,
            encoding: P
          }
        ],
        X
      );
    else
      throw new n("_write()");
  }, ue.prototype._writev = null, ue.prototype.end = function(F, P, X) {
    const pe = this._writableState;
    typeof F == "function" ? (X = F, F = null, P = null) : typeof P == "function" && (X = P, P = null);
    let de;
    if (F != null) {
      const ce = fe(this, F, P);
      ce instanceof c && (de = ce);
    }
    return pe.corked && (pe.corked = 1, this.uncork()), de || (!pe.errored && !pe.ending ? (pe.ending = !0, a(this, pe, !0), pe.ended = !0) : pe.finished ? de = new j("end") : pe.destroyed && (de = new R("end"))), typeof X == "function" && (de || pe.finished ? b.nextTick(X, de) : pe[re].push(X)), this;
  };
  function se(F) {
    return F.ending && !F.destroyed && F.constructed && F.length === 0 && !F.errored && F.buffered.length === 0 && !F.finished && !F.writing && !F.errorEmitted && !F.closeEmitted;
  }
  function _e(F, P) {
    let X = !1;
    function pe(de) {
      if (X) {
        q(F, de ?? u());
        return;
      }
      if (X = !0, P.pendingcb--, de) {
        const ce = P[re].splice(0);
        for (let z = 0; z < ce.length; z++)
          ce[z](de);
        q(F, de, P.sync);
      } else se(P) && (P.prefinished = !0, F.emit("prefinish"), P.pendingcb++, b.nextTick(T, F, P));
    }
    P.sync = !0, P.pendingcb++;
    try {
      F._final(pe);
    } catch (de) {
      pe(de);
    }
    P.sync = !1;
  }
  function h(F, P) {
    !P.prefinished && !P.finalCalled && (typeof F._final == "function" && !P.destroyed ? (P.finalCalled = !0, _e(F, P)) : (P.prefinished = !0, F.emit("prefinish")));
  }
  function a(F, P, X) {
    se(P) && (h(F, P), P.pendingcb === 0 && (X ? (P.pendingcb++, b.nextTick(
      (pe, de) => {
        se(de) ? T(pe, de) : de.pendingcb--;
      },
      F,
      P
    )) : se(P) && (P.pendingcb++, T(F, P))));
  }
  function T(F, P) {
    P.pendingcb--, P.finished = !0;
    const X = P[re].splice(0);
    for (let pe = 0; pe < X.length; pe++)
      X[pe]();
    if (F.emit("finish"), P.autoDestroy) {
      const pe = F._readableState;
      (!pe || pe.autoDestroy && // We don't expect the readable to ever 'end'
      // if readable is explicitly set to false.
      (pe.endEmitted || pe.readable === !1)) && F.destroy();
    }
  }
  e(ue.prototype, {
    closed: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.closed : !1;
      }
    },
    destroyed: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.destroyed : !1;
      },
      set(F) {
        this._writableState && (this._writableState.destroyed = F);
      }
    },
    writable: {
      __proto__: null,
      get() {
        const F = this._writableState;
        return !!F && F.writable !== !1 && !F.destroyed && !F.errored && !F.ending && !F.ended;
      },
      set(F) {
        this._writableState && (this._writableState.writable = !!F);
      }
    },
    writableFinished: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.finished : !1;
      }
    },
    writableObjectMode: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.objectMode : !1;
      }
    },
    writableBuffer: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.getBuffer();
      }
    },
    writableEnded: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.ending : !1;
      }
    },
    writableNeedDrain: {
      __proto__: null,
      get() {
        const F = this._writableState;
        return F ? !F.destroyed && !F.ending && F.needDrain : !1;
      }
    },
    writableHighWaterMark: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.highWaterMark;
      }
    },
    writableCorked: {
      __proto__: null,
      get() {
        return this._writableState ? this._writableState.corked : 0;
      }
    },
    writableLength: {
      __proto__: null,
      get() {
        return this._writableState && this._writableState.length;
      }
    },
    errored: {
      __proto__: null,
      enumerable: !1,
      get() {
        return this._writableState ? this._writableState.errored : null;
      }
    },
    writableAborted: {
      __proto__: null,
      enumerable: !1,
      get: function() {
        return !!(this._writableState.writable !== !1 && (this._writableState.destroyed || this._writableState.errored) && !this._writableState.finished);
      }
    }
  });
  const N = d.destroy;
  ue.prototype.destroy = function(F, P) {
    const X = this._writableState;
    return !X.destroyed && (X.bufferedIndex < X.buffered.length || X[re].length) && b.nextTick(D, X), N.call(this, F, P), this;
  }, ue.prototype._undestroy = d.undestroy, ue.prototype._destroy = function(F, P) {
    P(F);
  }, ue.prototype[E.captureRejectionSymbol] = function(F) {
    this.destroy(F);
  };
  let J;
  function $() {
    return J === void 0 && (J = {}), J;
  }
  return ue.fromWeb = function(F, P) {
    return $().newStreamWritableFromWritableStream(F, P);
  }, ue.toWeb = function(F) {
    return $().newWritableStreamFromStreamWritable(F);
  }, Zr;
}
var en, oo;
function Ca() {
  if (oo) return en;
  oo = 1;
  const b = Xe(), m = $e(), {
    isReadable: c,
    isWritable: S,
    isIterable: v,
    isNodeStream: e,
    isReadableNodeStream: s,
    isWritableNodeStream: r,
    isDuplexNodeStream: f,
    isReadableStream: g,
    isWritableStream: E
  } = Ge(), p = Je(), {
    AbortError: y,
    codes: { ERR_INVALID_ARG_TYPE: d, ERR_INVALID_RETURN_VALUE: w }
  } = je(), { destroyer: _ } = it(), i = ze(), t = It(), n = Sn(), { createDeferredPromise: u } = Ne(), k = Io(), R = globalThis.Blob || m.Blob, j = typeof R < "u" ? function(H) {
    return H instanceof R;
  } : function(H) {
    return !1;
  }, U = globalThis.AbortController || lt().AbortController, { FunctionPrototypeCall: M } = Fe();
  class Z extends i {
    constructor(H) {
      super(H), H?.readable === !1 && (this._readableState.readable = !1, this._readableState.ended = !0, this._readableState.endEmitted = !0), H?.writable === !1 && (this._writableState.writable = !1, this._writableState.ending = !0, this._writableState.ended = !0, this._writableState.finished = !0);
    }
  }
  en = function re(H, te) {
    if (f(H))
      return H;
    if (s(H))
      return Q({
        readable: H
      });
    if (r(H))
      return Q({
        writable: H
      });
    if (e(H))
      return Q({
        writable: !1,
        readable: !1
      });
    if (g(H))
      return Q({
        readable: t.fromWeb(H)
      });
    if (E(H))
      return Q({
        writable: n.fromWeb(H)
      });
    if (typeof H == "function") {
      const { value: fe, write: W, final: B, destroy: Y } = q(H);
      if (v(fe))
        return k(Z, fe, {
          // TODO (ronag): highWaterMark?
          objectMode: !0,
          write: W,
          final: B,
          destroy: Y
        });
      const C = fe?.then;
      if (typeof C == "function") {
        let G;
        const ne = M(
          C,
          fe,
          (D) => {
            if (D != null)
              throw new w("nully", "body", D);
          },
          (D) => {
            _(G, D);
          }
        );
        return G = new Z({
          // TODO (ronag): highWaterMark?
          objectMode: !0,
          readable: !1,
          write: W,
          final(D) {
            B(async () => {
              try {
                await ne, b.nextTick(D, null);
              } catch (he) {
                b.nextTick(D, he);
              }
            });
          },
          destroy: Y
        });
      }
      throw new w("Iterable, AsyncIterable or AsyncFunction", te, fe);
    }
    if (j(H))
      return re(H.arrayBuffer());
    if (v(H))
      return k(Z, H, {
        // TODO (ronag): highWaterMark?
        objectMode: !0,
        writable: !1
      });
    if (g(H?.readable) && E(H?.writable))
      return Z.fromWeb(H);
    if (typeof H?.writable == "object" || typeof H?.readable == "object") {
      const fe = H != null && H.readable ? s(H?.readable) ? H?.readable : re(H.readable) : void 0, W = H != null && H.writable ? r(H?.writable) ? H?.writable : re(H.writable) : void 0;
      return Q({
        readable: fe,
        writable: W
      });
    }
    const ue = H?.then;
    if (typeof ue == "function") {
      let fe;
      return M(
        ue,
        H,
        (W) => {
          W != null && fe.push(W), fe.push(null);
        },
        (W) => {
          _(fe, W);
        }
      ), fe = new Z({
        objectMode: !0,
        writable: !1,
        read() {
        }
      });
    }
    throw new d(
      te,
      [
        "Blob",
        "ReadableStream",
        "WritableStream",
        "Stream",
        "Iterable",
        "AsyncIterable",
        "Function",
        "{ readable, writable } pair",
        "Promise"
      ],
      H
    );
  };
  function q(re) {
    let { promise: H, resolve: te } = u();
    const ue = new U(), fe = ue.signal;
    return {
      value: re(
        (async function* () {
          for (; ; ) {
            const B = H;
            H = null;
            const { chunk: Y, done: C, cb: G } = await B;
            if (b.nextTick(G), C) return;
            if (fe.aborted)
              throw new y(void 0, {
                cause: fe.reason
              });
            ({ promise: H, resolve: te } = u()), yield Y;
          }
        })(),
        {
          signal: fe
        }
      ),
      write(B, Y, C) {
        const G = te;
        te = null, G({
          chunk: B,
          done: !1,
          cb: C
        });
      },
      final(B) {
        const Y = te;
        te = null, Y({
          done: !0,
          cb: B
        });
      },
      destroy(B, Y) {
        ue.abort(), Y(B);
      }
    };
  }
  function Q(re) {
    const H = re.readable && typeof re.readable.read != "function" ? t.wrap(re.readable) : re.readable, te = re.writable;
    let ue = !!c(H), fe = !!S(te), W, B, Y, C, G;
    function ne(D) {
      const he = C;
      C = null, he ? he(D) : D && G.destroy(D);
    }
    return G = new Z({
      // TODO (ronag): highWaterMark?
      readableObjectMode: !!(H != null && H.readableObjectMode),
      writableObjectMode: !!(te != null && te.writableObjectMode),
      readable: ue,
      writable: fe
    }), fe && (p(te, (D) => {
      fe = !1, D && _(H, D), ne(D);
    }), G._write = function(D, he, se) {
      te.write(D, he) ? se() : W = se;
    }, G._final = function(D) {
      te.end(), B = D;
    }, te.on("drain", function() {
      if (W) {
        const D = W;
        W = null, D();
      }
    }), te.on("finish", function() {
      if (B) {
        const D = B;
        B = null, D();
      }
    })), ue && (p(H, (D) => {
      ue = !1, D && _(H, D), ne(D);
    }), H.on("readable", function() {
      if (Y) {
        const D = Y;
        Y = null, D();
      }
    }), H.on("end", function() {
      G.push(null);
    }), G._read = function() {
      for (; ; ) {
        const D = H.read();
        if (D === null) {
          Y = G._read;
          return;
        }
        if (!G.push(D))
          return;
      }
    }), G._destroy = function(D, he) {
      !D && C !== null && (D = new y()), Y = null, W = null, B = null, C === null ? he(D) : (C = he, _(te, D), _(H, D));
    }, G;
  }
  return en;
}
var tn, ao;
function ze() {
  if (ao) return tn;
  ao = 1;
  const {
    ObjectDefineProperties: b,
    ObjectGetOwnPropertyDescriptor: m,
    ObjectKeys: c,
    ObjectSetPrototypeOf: S
  } = Fe();
  tn = s;
  const v = It(), e = Sn();
  S(s.prototype, v.prototype), S(s, v);
  {
    const E = c(e.prototype);
    for (let p = 0; p < E.length; p++) {
      const y = E[p];
      s.prototype[y] || (s.prototype[y] = e.prototype[y]);
    }
  }
  function s(E) {
    if (!(this instanceof s)) return new s(E);
    v.call(this, E), e.call(this, E), E ? (this.allowHalfOpen = E.allowHalfOpen !== !1, E.readable === !1 && (this._readableState.readable = !1, this._readableState.ended = !0, this._readableState.endEmitted = !0), E.writable === !1 && (this._writableState.writable = !1, this._writableState.ending = !0, this._writableState.ended = !0, this._writableState.finished = !0)) : this.allowHalfOpen = !0;
  }
  b(s.prototype, {
    writable: {
      __proto__: null,
      ...m(e.prototype, "writable")
    },
    writableHighWaterMark: {
      __proto__: null,
      ...m(e.prototype, "writableHighWaterMark")
    },
    writableObjectMode: {
      __proto__: null,
      ...m(e.prototype, "writableObjectMode")
    },
    writableBuffer: {
      __proto__: null,
      ...m(e.prototype, "writableBuffer")
    },
    writableLength: {
      __proto__: null,
      ...m(e.prototype, "writableLength")
    },
    writableFinished: {
      __proto__: null,
      ...m(e.prototype, "writableFinished")
    },
    writableCorked: {
      __proto__: null,
      ...m(e.prototype, "writableCorked")
    },
    writableEnded: {
      __proto__: null,
      ...m(e.prototype, "writableEnded")
    },
    writableNeedDrain: {
      __proto__: null,
      ...m(e.prototype, "writableNeedDrain")
    },
    destroyed: {
      __proto__: null,
      get() {
        return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
      },
      set(E) {
        this._readableState && this._writableState && (this._readableState.destroyed = E, this._writableState.destroyed = E);
      }
    }
  });
  let r;
  function f() {
    return r === void 0 && (r = {}), r;
  }
  s.fromWeb = function(E, p) {
    return f().newStreamDuplexFromReadableWritablePair(E, p);
  }, s.toWeb = function(E) {
    return f().newReadableWritablePairFromDuplex(E);
  };
  let g;
  return s.from = function(E) {
    return g || (g = Ca()), g(E, "body");
  }, tn;
}
var rn, so;
function Do() {
  if (so) return rn;
  so = 1;
  const { ObjectSetPrototypeOf: b, Symbol: m } = Fe();
  rn = s;
  const { ERR_METHOD_NOT_IMPLEMENTED: c } = je().codes, S = ze(), { getHighWaterMark: v } = Ot();
  b(s.prototype, S.prototype), b(s, S);
  const e = m("kCallback");
  function s(g) {
    if (!(this instanceof s)) return new s(g);
    const E = g ? v(this, g, "readableHighWaterMark", !0) : null;
    E === 0 && (g = {
      ...g,
      highWaterMark: null,
      readableHighWaterMark: E,
      // TODO (ronag): 0 is not optimal since we have
      // a "bug" where we check needDrain before calling _write and not after.
      // Refs: https://github.com/nodejs/node/pull/32887
      // Refs: https://github.com/nodejs/node/pull/35941
      writableHighWaterMark: g.writableHighWaterMark || 0
    }), S.call(this, g), this._readableState.sync = !1, this[e] = null, g && (typeof g.transform == "function" && (this._transform = g.transform), typeof g.flush == "function" && (this._flush = g.flush)), this.on("prefinish", f);
  }
  function r(g) {
    typeof this._flush == "function" && !this.destroyed ? this._flush((E, p) => {
      if (E) {
        g ? g(E) : this.destroy(E);
        return;
      }
      p != null && this.push(p), this.push(null), g && g();
    }) : (this.push(null), g && g());
  }
  function f() {
    this._final !== r && r.call(this);
  }
  return s.prototype._final = r, s.prototype._transform = function(g, E, p) {
    throw new c("_transform()");
  }, s.prototype._write = function(g, E, p) {
    const y = this._readableState, d = this._writableState, w = y.length;
    this._transform(g, E, (_, i) => {
      if (_) {
        p(_);
        return;
      }
      i != null && this.push(i), d.ended || // Backwards compat.
      w === y.length || // Backwards compat.
      y.length < y.highWaterMark ? p() : this[e] = p;
    });
  }, s.prototype._read = function() {
    if (this[e]) {
      const g = this[e];
      this[e] = null, g();
    }
  }, rn;
}
var nn, uo;
function Bo() {
  if (uo) return nn;
  uo = 1;
  const { ObjectSetPrototypeOf: b } = Fe();
  nn = c;
  const m = Do();
  b(c.prototype, m.prototype), b(c, m);
  function c(S) {
    if (!(this instanceof c)) return new c(S);
    m.call(this, S);
  }
  return c.prototype._transform = function(S, v, e) {
    e(null, S);
  }, nn;
}
var on, lo;
function En() {
  if (lo) return on;
  lo = 1;
  const b = Xe(), { ArrayIsArray: m, Promise: c, SymbolAsyncIterator: S, SymbolDispose: v } = Fe(), e = Je(), { once: s } = Ne(), r = it(), f = ze(), {
    aggregateTwoErrors: g,
    codes: {
      ERR_INVALID_ARG_TYPE: E,
      ERR_INVALID_RETURN_VALUE: p,
      ERR_MISSING_ARGS: y,
      ERR_STREAM_DESTROYED: d,
      ERR_STREAM_PREMATURE_CLOSE: w
    },
    AbortError: _
  } = je(), { validateFunction: i, validateAbortSignal: t } = dt(), {
    isIterable: n,
    isReadable: u,
    isReadableNodeStream: k,
    isNodeStream: R,
    isTransformStream: j,
    isWebStream: U,
    isReadableStream: M,
    isReadableFinished: Z
  } = Ge(), q = globalThis.AbortController || lt().AbortController;
  let Q, re, H;
  function te(D, he, se) {
    let _e = !1;
    D.on("close", () => {
      _e = !0;
    });
    const h = e(
      D,
      {
        readable: he,
        writable: se
      },
      (a) => {
        _e = !a;
      }
    );
    return {
      destroy: (a) => {
        _e || (_e = !0, r.destroyer(D, a || new d("pipe")));
      },
      cleanup: h
    };
  }
  function ue(D) {
    return i(D[D.length - 1], "streams[stream.length - 1]"), D.pop();
  }
  function fe(D) {
    if (n(D))
      return D;
    if (k(D))
      return W(D);
    throw new E("val", ["Readable", "Iterable", "AsyncIterable"], D);
  }
  async function* W(D) {
    re || (re = It()), yield* re.prototype[S].call(D);
  }
  async function B(D, he, se, { end: _e }) {
    let h, a = null;
    const T = ($) => {
      if ($ && (h = $), a) {
        const F = a;
        a = null, F();
      }
    }, N = () => new c(($, F) => {
      h ? F(h) : a = () => {
        h ? F(h) : $();
      };
    });
    he.on("drain", T);
    const J = e(
      he,
      {
        readable: !1
      },
      T
    );
    try {
      he.writableNeedDrain && await N();
      for await (const $ of D)
        he.write($) || await N();
      _e && (he.end(), await N()), se();
    } catch ($) {
      se(h !== $ ? g(h, $) : $);
    } finally {
      J(), he.off("drain", T);
    }
  }
  async function Y(D, he, se, { end: _e }) {
    j(he) && (he = he.writable);
    const h = he.getWriter();
    try {
      for await (const a of D)
        await h.ready, h.write(a).catch(() => {
        });
      await h.ready, _e && await h.close(), se();
    } catch (a) {
      try {
        await h.abort(a), se(a);
      } catch (T) {
        se(T);
      }
    }
  }
  function C(...D) {
    return G(D, s(ue(D)));
  }
  function G(D, he, se) {
    if (D.length === 1 && m(D[0]) && (D = D[0]), D.length < 2)
      throw new y("streams");
    const _e = new q(), h = _e.signal, a = se?.signal, T = [];
    t(a, "options.signal");
    function N() {
      de(new _());
    }
    H = H || Ne().addAbortListener;
    let J;
    a && (J = H(a, N));
    let $, F;
    const P = [];
    let X = 0;
    function pe(ye) {
      de(ye, --X === 0);
    }
    function de(ye, ie) {
      var Ee;
      if (ye && (!$ || $.code === "ERR_STREAM_PREMATURE_CLOSE") && ($ = ye), !(!$ && !ie)) {
        for (; P.length; )
          P.shift()($);
        (Ee = J) === null || Ee === void 0 || Ee[v](), _e.abort(), ie && ($ || T.forEach((ke) => ke()), b.nextTick(he, $, F));
      }
    }
    let ce;
    for (let ye = 0; ye < D.length; ye++) {
      const ie = D[ye], Ee = ye < D.length - 1, ke = ye > 0, Se = Ee || se?.end !== !1, Oe = ye === D.length - 1;
      if (R(ie)) {
        let x = function(o) {
          o && o.name !== "AbortError" && o.code !== "ERR_STREAM_PREMATURE_CLOSE" && pe(o);
        };
        if (Se) {
          const { destroy: o, cleanup: l } = te(ie, Ee, ke);
          P.push(o), u(ie) && Oe && T.push(l);
        }
        ie.on("error", x), u(ie) && Oe && T.push(() => {
          ie.removeListener("error", x);
        });
      }
      if (ye === 0)
        if (typeof ie == "function") {
          if (ce = ie({
            signal: h
          }), !n(ce))
            throw new p("Iterable, AsyncIterable or Stream", "source", ce);
        } else n(ie) || k(ie) || j(ie) ? ce = ie : ce = f.from(ie);
      else if (typeof ie == "function") {
        if (j(ce)) {
          var z;
          ce = fe((z = ce) === null || z === void 0 ? void 0 : z.readable);
        } else
          ce = fe(ce);
        if (ce = ie(ce, {
          signal: h
        }), Ee) {
          if (!n(ce, !0))
            throw new p("AsyncIterable", `transform[${ye - 1}]`, ce);
        } else {
          var le;
          Q || (Q = Bo());
          const x = new Q({
            objectMode: !0
          }), o = (le = ce) === null || le === void 0 ? void 0 : le.then;
          if (typeof o == "function")
            X++, o.call(
              ce,
              (V) => {
                F = V, V != null && x.write(V), Se && x.end(), b.nextTick(pe);
              },
              (V) => {
                x.destroy(V), b.nextTick(pe, V);
              }
            );
          else if (n(ce, !0))
            X++, B(ce, x, pe, {
              end: Se
            });
          else if (M(ce) || j(ce)) {
            const V = ce.readable || ce;
            X++, B(V, x, pe, {
              end: Se
            });
          } else
            throw new p("AsyncIterable or Promise", "destination", ce);
          ce = x;
          const { destroy: l, cleanup: A } = te(ce, !1, !0);
          P.push(l), Oe && T.push(A);
        }
      } else if (R(ie)) {
        if (k(ce)) {
          X += 2;
          const x = ne(ce, ie, pe, {
            end: Se
          });
          u(ie) && Oe && T.push(x);
        } else if (j(ce) || M(ce)) {
          const x = ce.readable || ce;
          X++, B(x, ie, pe, {
            end: Se
          });
        } else if (n(ce))
          X++, B(ce, ie, pe, {
            end: Se
          });
        else
          throw new E(
            "val",
            ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"],
            ce
          );
        ce = ie;
      } else if (U(ie)) {
        if (k(ce))
          X++, Y(fe(ce), ie, pe, {
            end: Se
          });
        else if (M(ce) || n(ce))
          X++, Y(ce, ie, pe, {
            end: Se
          });
        else if (j(ce))
          X++, Y(ce.readable, ie, pe, {
            end: Se
          });
        else
          throw new E(
            "val",
            ["Readable", "Iterable", "AsyncIterable", "ReadableStream", "TransformStream"],
            ce
          );
        ce = ie;
      } else
        ce = f.from(ie);
    }
    return (h != null && h.aborted || a != null && a.aborted) && b.nextTick(N), ce;
  }
  function ne(D, he, se, { end: _e }) {
    let h = !1;
    if (he.on("close", () => {
      h || se(new w());
    }), D.pipe(he, {
      end: !1
    }), _e) {
      let a = function() {
        h = !0, he.end();
      };
      Z(D) ? b.nextTick(a) : D.once("end", a);
    } else
      se();
    return e(
      D,
      {
        readable: !0,
        writable: !1
      },
      (a) => {
        const T = D._readableState;
        a && a.code === "ERR_STREAM_PREMATURE_CLOSE" && T && T.ended && !T.errored && !T.errorEmitted ? D.once("end", se).once("error", se) : se(a);
      }
    ), e(
      he,
      {
        readable: !1,
        writable: !0
      },
      se
    );
  }
  return on = {
    pipelineImpl: G,
    pipeline: C
  }, on;
}
var an, fo;
function jo() {
  if (fo) return an;
  fo = 1;
  const { pipeline: b } = En(), m = ze(), { destroyer: c } = it(), {
    isNodeStream: S,
    isReadable: v,
    isWritable: e,
    isWebStream: s,
    isTransformStream: r,
    isWritableStream: f,
    isReadableStream: g
  } = Ge(), {
    AbortError: E,
    codes: { ERR_INVALID_ARG_VALUE: p, ERR_MISSING_ARGS: y }
  } = je(), d = Je();
  return an = function(..._) {
    if (_.length === 0)
      throw new y("streams");
    if (_.length === 1)
      return m.from(_[0]);
    const i = [..._];
    if (typeof _[0] == "function" && (_[0] = m.from(_[0])), typeof _[_.length - 1] == "function") {
      const Q = _.length - 1;
      _[Q] = m.from(_[Q]);
    }
    for (let Q = 0; Q < _.length; ++Q)
      if (!(!S(_[Q]) && !s(_[Q]))) {
        if (Q < _.length - 1 && !(v(_[Q]) || g(_[Q]) || r(_[Q])))
          throw new p(`streams[${Q}]`, i[Q], "must be readable");
        if (Q > 0 && !(e(_[Q]) || f(_[Q]) || r(_[Q])))
          throw new p(`streams[${Q}]`, i[Q], "must be writable");
      }
    let t, n, u, k, R;
    function j(Q) {
      const re = k;
      k = null, re ? re(Q) : Q ? R.destroy(Q) : !q && !Z && R.destroy();
    }
    const U = _[0], M = b(_, j), Z = !!(e(U) || f(U) || r(U)), q = !!(v(M) || g(M) || r(M));
    if (R = new m({
      // TODO (ronag): highWaterMark?
      writableObjectMode: !!(U != null && U.writableObjectMode),
      readableObjectMode: !!(M != null && M.readableObjectMode),
      writable: Z,
      readable: q
    }), Z) {
      if (S(U))
        R._write = function(re, H, te) {
          U.write(re, H) ? te() : t = te;
        }, R._final = function(re) {
          U.end(), n = re;
        }, U.on("drain", function() {
          if (t) {
            const re = t;
            t = null, re();
          }
        });
      else if (s(U)) {
        const H = (r(U) ? U.writable : U).getWriter();
        R._write = async function(te, ue, fe) {
          try {
            await H.ready, H.write(te).catch(() => {
            }), fe();
          } catch (W) {
            fe(W);
          }
        }, R._final = async function(te) {
          try {
            await H.ready, H.close().catch(() => {
            }), n = te;
          } catch (ue) {
            te(ue);
          }
        };
      }
      const Q = r(M) ? M.readable : M;
      d(Q, () => {
        if (n) {
          const re = n;
          n = null, re();
        }
      });
    }
    if (q) {
      if (S(M))
        M.on("readable", function() {
          if (u) {
            const Q = u;
            u = null, Q();
          }
        }), M.on("end", function() {
          R.push(null);
        }), R._read = function() {
          for (; ; ) {
            const Q = M.read();
            if (Q === null) {
              u = R._read;
              return;
            }
            if (!R.push(Q))
              return;
          }
        };
      else if (s(M)) {
        const re = (r(M) ? M.readable : M).getReader();
        R._read = async function() {
          for (; ; )
            try {
              const { value: H, done: te } = await re.read();
              if (!R.push(H))
                return;
              if (te) {
                R.push(null);
                return;
              }
            } catch {
              return;
            }
        };
      }
    }
    return R._destroy = function(Q, re) {
      !Q && k !== null && (Q = new E()), u = null, t = null, n = null, k === null ? re(Q) : (k = re, S(M) && c(M, Q));
    }, R;
  }, an;
}
var co;
function Fa() {
  if (co) return Et;
  co = 1;
  const b = globalThis.AbortController || lt().AbortController, {
    codes: { ERR_INVALID_ARG_VALUE: m, ERR_INVALID_ARG_TYPE: c, ERR_MISSING_ARGS: S, ERR_OUT_OF_RANGE: v },
    AbortError: e
  } = je(), { validateAbortSignal: s, validateInteger: r, validateObject: f } = dt(), g = Fe().Symbol("kWeak"), E = Fe().Symbol("kResistStopPropagation"), { finished: p } = Je(), y = jo(), { addAbortSignalNoValidate: d } = At(), { isWritable: w, isNodeStream: _ } = Ge(), { deprecate: i } = Ne(), {
    ArrayPrototypePush: t,
    Boolean: n,
    MathFloor: u,
    Number: k,
    NumberIsNaN: R,
    Promise: j,
    PromiseReject: U,
    PromiseResolve: M,
    PromisePrototypeThen: Z,
    Symbol: q
  } = Fe(), Q = q("kEmpty"), re = q("kEof");
  function H(a, T) {
    if (T != null && f(T, "options"), T?.signal != null && s(T.signal, "options.signal"), _(a) && !w(a))
      throw new m("stream", a, "must be writable");
    const N = y(this, a);
    return T != null && T.signal && d(T.signal, N), N;
  }
  function te(a, T) {
    if (typeof a != "function")
      throw new c("fn", ["Function", "AsyncFunction"], a);
    T != null && f(T, "options"), T?.signal != null && s(T.signal, "options.signal");
    let N = 1;
    T?.concurrency != null && (N = u(T.concurrency));
    let J = N - 1;
    return T?.highWaterMark != null && (J = u(T.highWaterMark)), r(N, "options.concurrency", 1), r(J, "options.highWaterMark", 0), J += N, async function* () {
      const F = Ne().AbortSignalAny(
        [T?.signal].filter(n)
      ), P = this, X = [], pe = {
        signal: F
      };
      let de, ce, z = !1, le = 0;
      function ye() {
        z = !0, ie();
      }
      function ie() {
        le -= 1, Ee();
      }
      function Ee() {
        ce && !z && le < N && X.length < J && (ce(), ce = null);
      }
      async function ke() {
        try {
          for await (let Se of P) {
            if (z)
              return;
            if (F.aborted)
              throw new e();
            try {
              if (Se = a(Se, pe), Se === Q)
                continue;
              Se = M(Se);
            } catch (Oe) {
              Se = U(Oe);
            }
            le += 1, Z(Se, ie, ye), X.push(Se), de && (de(), de = null), !z && (X.length >= J || le >= N) && await new j((Oe) => {
              ce = Oe;
            });
          }
          X.push(re);
        } catch (Se) {
          const Oe = U(Se);
          Z(Oe, ie, ye), X.push(Oe);
        } finally {
          z = !0, de && (de(), de = null);
        }
      }
      ke();
      try {
        for (; ; ) {
          for (; X.length > 0; ) {
            const Se = await X[0];
            if (Se === re)
              return;
            if (F.aborted)
              throw new e();
            Se !== Q && (yield Se), X.shift(), Ee();
          }
          await new j((Se) => {
            de = Se;
          });
        }
      } finally {
        z = !0, ce && (ce(), ce = null);
      }
    }.call(this);
  }
  function ue(a = void 0) {
    return a != null && f(a, "options"), a?.signal != null && s(a.signal, "options.signal"), async function* () {
      let N = 0;
      for await (const $ of this) {
        var J;
        if (a != null && (J = a.signal) !== null && J !== void 0 && J.aborted)
          throw new e({
            cause: a.signal.reason
          });
        yield [N++, $];
      }
    }.call(this);
  }
  async function fe(a, T = void 0) {
    for await (const N of C.call(this, a, T))
      return !0;
    return !1;
  }
  async function W(a, T = void 0) {
    if (typeof a != "function")
      throw new c("fn", ["Function", "AsyncFunction"], a);
    return !await fe.call(
      this,
      async (...N) => !await a(...N),
      T
    );
  }
  async function B(a, T) {
    for await (const N of C.call(this, a, T))
      return N;
  }
  async function Y(a, T) {
    if (typeof a != "function")
      throw new c("fn", ["Function", "AsyncFunction"], a);
    async function N(J, $) {
      return await a(J, $), Q;
    }
    for await (const J of te.call(this, N, T)) ;
  }
  function C(a, T) {
    if (typeof a != "function")
      throw new c("fn", ["Function", "AsyncFunction"], a);
    async function N(J, $) {
      return await a(J, $) ? J : Q;
    }
    return te.call(this, N, T);
  }
  class G extends S {
    constructor() {
      super("reduce"), this.message = "Reduce of an empty stream requires an initial value";
    }
  }
  async function ne(a, T, N) {
    var J;
    if (typeof a != "function")
      throw new c("reducer", ["Function", "AsyncFunction"], a);
    N != null && f(N, "options"), N?.signal != null && s(N.signal, "options.signal");
    let $ = arguments.length > 1;
    if (N != null && (J = N.signal) !== null && J !== void 0 && J.aborted) {
      const de = new e(void 0, {
        cause: N.signal.reason
      });
      throw this.once("error", () => {
      }), await p(this.destroy(de)), de;
    }
    const F = new b(), P = F.signal;
    if (N != null && N.signal) {
      const de = {
        once: !0,
        [g]: this,
        [E]: !0
      };
      N.signal.addEventListener("abort", () => F.abort(), de);
    }
    let X = !1;
    try {
      for await (const de of this) {
        var pe;
        if (X = !0, N != null && (pe = N.signal) !== null && pe !== void 0 && pe.aborted)
          throw new e();
        $ ? T = await a(T, de, {
          signal: P
        }) : (T = de, $ = !0);
      }
      if (!X && !$)
        throw new G();
    } finally {
      F.abort();
    }
    return T;
  }
  async function D(a) {
    a != null && f(a, "options"), a?.signal != null && s(a.signal, "options.signal");
    const T = [];
    for await (const J of this) {
      var N;
      if (a != null && (N = a.signal) !== null && N !== void 0 && N.aborted)
        throw new e(void 0, {
          cause: a.signal.reason
        });
      t(T, J);
    }
    return T;
  }
  function he(a, T) {
    const N = te.call(this, a, T);
    return async function* () {
      for await (const $ of N)
        yield* $;
    }.call(this);
  }
  function se(a) {
    if (a = k(a), R(a))
      return 0;
    if (a < 0)
      throw new v("number", ">= 0", a);
    return a;
  }
  function _e(a, T = void 0) {
    return T != null && f(T, "options"), T?.signal != null && s(T.signal, "options.signal"), a = se(a), async function* () {
      var J;
      if (T != null && (J = T.signal) !== null && J !== void 0 && J.aborted)
        throw new e();
      for await (const F of this) {
        var $;
        if (T != null && ($ = T.signal) !== null && $ !== void 0 && $.aborted)
          throw new e();
        a-- <= 0 && (yield F);
      }
    }.call(this);
  }
  function h(a, T = void 0) {
    return T != null && f(T, "options"), T?.signal != null && s(T.signal, "options.signal"), a = se(a), async function* () {
      var J;
      if (T != null && (J = T.signal) !== null && J !== void 0 && J.aborted)
        throw new e();
      for await (const F of this) {
        var $;
        if (T != null && ($ = T.signal) !== null && $ !== void 0 && $.aborted)
          throw new e();
        if (a-- > 0 && (yield F), a <= 0)
          return;
      }
    }.call(this);
  }
  return Et.streamReturningOperators = {
    asIndexedPairs: i(ue, "readable.asIndexedPairs will be removed in a future version."),
    drop: _e,
    filter: C,
    flatMap: he,
    map: te,
    take: h,
    compose: H
  }, Et.promiseReturningOperators = {
    every: W,
    forEach: Y,
    reduce: ne,
    toArray: D,
    some: fe,
    find: B
  }, Et;
}
var sn, ho;
function No() {
  if (ho) return sn;
  ho = 1;
  const { ArrayPrototypePop: b, Promise: m } = Fe(), { isIterable: c, isNodeStream: S, isWebStream: v } = Ge(), { pipelineImpl: e } = En(), { finished: s } = Je();
  Lo();
  function r(...f) {
    return new m((g, E) => {
      let p, y;
      const d = f[f.length - 1];
      if (d && typeof d == "object" && !S(d) && !c(d) && !v(d)) {
        const w = b(f);
        p = w.signal, y = w.end;
      }
      e(
        f,
        (w, _) => {
          w ? E(w) : g(_);
        },
        {
          signal: p,
          end: y
        }
      );
    });
  }
  return sn = {
    finished: s,
    pipeline: r
  }, sn;
}
var po;
function Lo() {
  if (po) return Lr.exports;
  po = 1;
  const { Buffer: b } = $e(), { ObjectDefineProperty: m, ObjectKeys: c, ReflectApply: S } = Fe(), {
    promisify: { custom: v }
  } = Ne(), { streamReturningOperators: e, promiseReturningOperators: s } = Fa(), {
    codes: { ERR_ILLEGAL_CONSTRUCTOR: r }
  } = je(), f = jo(), { setDefaultHighWaterMark: g, getDefaultHighWaterMark: E } = Ot(), { pipeline: p } = En(), { destroyer: y } = it(), d = Je(), w = No(), _ = Ge(), i = Lr.exports = mn().Stream;
  i.isDestroyed = _.isDestroyed, i.isDisturbed = _.isDisturbed, i.isErrored = _.isErrored, i.isReadable = _.isReadable, i.isWritable = _.isWritable, i.Readable = It();
  for (const n of c(e)) {
    let k = function(...R) {
      if (new.target)
        throw r();
      return i.Readable.from(S(u, this, R));
    };
    const u = e[n];
    m(k, "name", {
      __proto__: null,
      value: u.name
    }), m(k, "length", {
      __proto__: null,
      value: u.length
    }), m(i.Readable.prototype, n, {
      __proto__: null,
      value: k,
      enumerable: !1,
      configurable: !0,
      writable: !0
    });
  }
  for (const n of c(s)) {
    let k = function(...R) {
      if (new.target)
        throw r();
      return S(u, this, R);
    };
    const u = s[n];
    m(k, "name", {
      __proto__: null,
      value: u.name
    }), m(k, "length", {
      __proto__: null,
      value: u.length
    }), m(i.Readable.prototype, n, {
      __proto__: null,
      value: k,
      enumerable: !1,
      configurable: !0,
      writable: !0
    });
  }
  i.Writable = Sn(), i.Duplex = ze(), i.Transform = Do(), i.PassThrough = Bo(), i.pipeline = p;
  const { addAbortSignal: t } = At();
  return i.addAbortSignal = t, i.finished = d, i.destroy = y, i.compose = f, i.setDefaultHighWaterMark = g, i.getDefaultHighWaterMark = E, m(i, "promises", {
    __proto__: null,
    configurable: !0,
    enumerable: !0,
    get() {
      return w;
    }
  }), m(p, v, {
    __proto__: null,
    enumerable: !0,
    get() {
      return w.pipeline;
    }
  }), m(d, v, {
    __proto__: null,
    enumerable: !0,
    get() {
      return w.finished;
    }
  }), i.Stream = i, i._isUint8Array = function(u) {
    return u instanceof Uint8Array;
  }, i._uint8ArrayToBuffer = function(u) {
    return b.from(u.buffer, u.byteOffset, u.byteLength);
  }, Lr.exports;
}
var yo;
function Aa() {
  return yo || (yo = 1, (function(b) {
    const m = Lo(), c = No(), S = m.Readable.destroy;
    b.exports = m.Readable, b.exports._uint8ArrayToBuffer = m._uint8ArrayToBuffer, b.exports._isUint8Array = m._isUint8Array, b.exports.isDisturbed = m.isDisturbed, b.exports.isErrored = m.isErrored, b.exports.isReadable = m.isReadable, b.exports.Readable = m.Readable, b.exports.Writable = m.Writable, b.exports.Duplex = m.Duplex, b.exports.Transform = m.Transform, b.exports.PassThrough = m.PassThrough, b.exports.addAbortSignal = m.addAbortSignal, b.exports.finished = m.finished, b.exports.destroy = m.destroy, b.exports.destroy = S, b.exports.pipeline = m.pipeline, b.exports.compose = m.compose, Object.defineProperty(m, "promises", {
      configurable: !0,
      enumerable: !0,
      get() {
        return c;
      }
    }), b.exports.Stream = m.Stream, b.exports.default = b.exports;
  })(Nr)), Nr.exports;
}
var un, _o;
function Oa() {
  if (_o) return un;
  _o = 1;
  const b = xa();
  let m = Ae;
  (!m.Writable || !m.Writable.prototype.destroy) && (m = Aa());
  let c;
  function S() {
    let f, g, E;
    for (c = [], g = 0; g < 256; g++) {
      for (f = g, E = 0; E < 8; E++) f = f & 1 ? 3988292384 ^ f >>> 1 : f = f >>> 1;
      c[g] = f >>> 0;
    }
  }
  function v(r, f) {
    c || S(), r.charCodeAt && (r = r.charCodeAt(0));
    const g = f.readUInt32BE() >> 8 & 16777215, E = c[(f.readUInt32BE() ^ r >>> 0) & 255];
    return (g ^ E) >>> 0;
  }
  function e(r, f) {
    const g = r >> 16 & 65535, E = r & 65535, p = f >> 16 & 65535, y = f & 65535;
    return ((g * y + E * p & 65535) << 16 >>> 0) + E * y;
  }
  function s() {
    if (!(this instanceof s)) return new s();
    this.key0 = Buffer.allocUnsafe(4), this.key1 = Buffer.allocUnsafe(4), this.key2 = Buffer.allocUnsafe(4), this.key0.writeUInt32BE(305419896, 0), this.key1.writeUInt32BE(591751049, 0), this.key2.writeUInt32BE(878082192, 0);
  }
  return s.prototype.update = function(r) {
    this.key0.writeUInt32BE(v(r, this.key0)), this.key1.writeUInt32BE(
      (this.key0.readUInt32BE() & 255 & 4294967295) + this.key1.readUInt32BE() >>> 0
    );
    const f = new b(
      e(this.key1.readUInt32BE(), 134775813) + 1 & 4294967295
    ), g = Buffer.alloc(8);
    f.copy(g, 0), g.copy(this.key1, 0, 4, 8), this.key2.writeUInt32BE(
      v((this.key1.readUInt32BE() >> 24 & 255) >>> 0, this.key2)
    );
  }, s.prototype.decryptByte = function(r) {
    const f = (this.key2.readUInt32BE() | 2) >>> 0;
    return r = r ^ e(f, f ^ 1) >> 8 & 255, this.update(r), r;
  }, s.prototype.stream = function() {
    const r = m.Transform(), f = this;
    return r._transform = function(g, E, p) {
      for (let y = 0; y < g.length; y++)
        g[y] = f.decryptByte(g[y]);
      this.push(g), p();
    }, r;
  }, un = s, un;
}
var ln, go;
function Ia() {
  if (go) return ln;
  go = 1;
  const b = Oa(), m = hn(), c = Ae, S = Ae, v = yn(), e = _n(), s = Tt();
  return ln = function(f, g, E, p, y) {
    const d = m(), w = c.PassThrough(), _ = f.stream(g, y);
    return _.pipe(d).on("error", function(i) {
      w.emit("error", i);
    }), w.vars = d.pull(30).then(function(i) {
      let t = s.parse(i, [
        ["signature", 4],
        ["versionsNeededToExtract", 2],
        ["flags", 2],
        ["compressionMethod", 2],
        ["lastModifiedTime", 2],
        ["lastModifiedDate", 2],
        ["crc32", 4],
        ["compressedSize", 4],
        ["uncompressedSize", 4],
        ["fileNameLength", 2],
        ["extraFieldLength", 2]
      ]);
      return t.lastModifiedDateTime = e(t.lastModifiedDate, t.lastModifiedTime), d.pull(t.fileNameLength).then(function(n) {
        return t.fileName = n.toString("utf8"), d.pull(t.extraFieldLength);
      }).then(function(n) {
        let u;
        return t.extra = v(n, t), p && p.compressedSize && (t = p), t.flags & 1 && (u = d.pull(12).then(function(k) {
          if (!E)
            throw new Error("MISSING_PASSWORD");
          const R = b();
          String(E).split("").forEach(function(U) {
            R.update(U);
          });
          for (let U = 0; U < k.length; U++)
            k[U] = R.decryptByte(k[U]);
          t.decrypt = R, t.compressedSize -= 12;
          const j = t.flags & 8 ? t.lastModifiedTime >> 8 & 255 : t.crc32 >> 24 & 255;
          if (k[11] !== j)
            throw new Error("BAD_PASSWORD");
          return t;
        })), Promise.resolve(u).then(function() {
          return w.emit("vars", t), t;
        });
      });
    }), w.vars.then(function(i) {
      const t = !(i.flags & 8) || i.compressedSize > 0;
      let n;
      const u = i.compressionMethod ? S.createInflateRaw() : c.PassThrough();
      t ? (w.size = i.uncompressedSize, n = i.compressedSize) : (n = Buffer.alloc(4), n.writeUInt32LE(134695760, 0));
      let k = d.stream(n);
      i.decrypt && (k = k.pipe(i.decrypt.stream())), k.pipe(u).on("error", function(R) {
        w.emit("error", R);
      }).pipe(w).on("finish", function() {
        _.destroy ? _.destroy() : _.abort ? _.abort() : _.close ? _.close() : _.push ? _.push() : console.log("warning - unable to close stream");
      });
    }).catch(function(i) {
      w.emit("error", i);
    }), w;
  }, ln;
}
var fn = { exports: {} };
/* @preserve
 * The MIT License (MIT)
 * 
 * Copyright (c) 2013-2018 Petka Antonov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
var wo;
function Da() {
  return wo || (wo = 1, (function(b, m) {
    (function(c) {
      b.exports = c();
    })(function() {
      return (function c(S, v, e) {
        function s(g, E) {
          if (!v[g]) {
            if (!S[g]) {
              var p = typeof _dereq_ == "function" && _dereq_;
              if (!E && p) return p(g, !0);
              if (r) return r(g, !0);
              var y = new Error("Cannot find module '" + g + "'");
              throw y.code = "MODULE_NOT_FOUND", y;
            }
            var d = v[g] = { exports: {} };
            S[g][0].call(d.exports, function(w) {
              var _ = S[g][1][w];
              return s(_ || w);
            }, d, d.exports, c, S, v, e);
          }
          return v[g].exports;
        }
        for (var r = typeof _dereq_ == "function" && _dereq_, f = 0; f < e.length; f++) s(e[f]);
        return s;
      })({ 1: [function(c, S, v) {
        S.exports = function(e) {
          var s = e._SomePromiseArray;
          function r(f) {
            var g = new s(f), E = g.promise();
            return g.setHowMany(1), g.setUnwrap(), g.init(), E;
          }
          e.any = function(f) {
            return r(f);
          }, e.prototype.any = function() {
            return r(this);
          };
        };
      }, {}], 2: [function(c, S, v) {
        var e;
        try {
          throw new Error();
        } catch (w) {
          e = w;
        }
        var s = c("./schedule"), r = c("./queue");
        function f() {
          this._customScheduler = !1, this._isTickUsed = !1, this._lateQueue = new r(16), this._normalQueue = new r(16), this._haveDrainedQueues = !1;
          var w = this;
          this.drainQueues = function() {
            w._drainQueues();
          }, this._schedule = s;
        }
        f.prototype.setScheduler = function(w) {
          var _ = this._schedule;
          return this._schedule = w, this._customScheduler = !0, _;
        }, f.prototype.hasCustomScheduler = function() {
          return this._customScheduler;
        }, f.prototype.haveItemsQueued = function() {
          return this._isTickUsed || this._haveDrainedQueues;
        }, f.prototype.fatalError = function(w, _) {
          _ ? (process.stderr.write("Fatal " + (w instanceof Error ? w.stack : w) + `
`), process.exit(2)) : this.throwLater(w);
        }, f.prototype.throwLater = function(w, _) {
          if (arguments.length === 1 && (_ = w, w = function() {
            throw _;
          }), typeof setTimeout < "u")
            setTimeout(function() {
              w(_);
            }, 0);
          else try {
            this._schedule(function() {
              w(_);
            });
          } catch {
            throw new Error(`No async scheduler available

    See http://goo.gl/MqrFmX
`);
          }
        };
        function g(w, _, i) {
          this._lateQueue.push(w, _, i), this._queueTick();
        }
        function E(w, _, i) {
          this._normalQueue.push(w, _, i), this._queueTick();
        }
        function p(w) {
          this._normalQueue._pushOne(w), this._queueTick();
        }
        f.prototype.invokeLater = g, f.prototype.invoke = E, f.prototype.settlePromises = p;
        function y(w) {
          for (; w.length() > 0; )
            d(w);
        }
        function d(w) {
          var _ = w.shift();
          if (typeof _ != "function")
            _._settlePromises();
          else {
            var i = w.shift(), t = w.shift();
            _.call(i, t);
          }
        }
        f.prototype._drainQueues = function() {
          y(this._normalQueue), this._reset(), this._haveDrainedQueues = !0, y(this._lateQueue);
        }, f.prototype._queueTick = function() {
          this._isTickUsed || (this._isTickUsed = !0, this._schedule(this.drainQueues));
        }, f.prototype._reset = function() {
          this._isTickUsed = !1;
        }, S.exports = f, S.exports.firstLineError = e;
      }, { "./queue": 26, "./schedule": 29 }], 3: [function(c, S, v) {
        S.exports = function(e, s, r, f) {
          var g = !1, E = function(w, _) {
            this._reject(_);
          }, p = function(w, _) {
            _.promiseRejectionQueued = !0, _.bindingPromise._then(E, E, null, this, w);
          }, y = function(w, _) {
            (this._bitField & 50397184) === 0 && this._resolveCallback(_.target);
          }, d = function(w, _) {
            _.promiseRejectionQueued || this._reject(w);
          };
          e.prototype.bind = function(w) {
            g || (g = !0, e.prototype._propagateFrom = f.propagateFromFunction(), e.prototype._boundValue = f.boundValueFunction());
            var _ = r(w), i = new e(s);
            i._propagateFrom(this, 1);
            var t = this._target();
            if (i._setBoundTo(_), _ instanceof e) {
              var n = {
                promiseRejectionQueued: !1,
                promise: i,
                target: t,
                bindingPromise: _
              };
              t._then(s, p, void 0, i, n), _._then(
                y,
                d,
                void 0,
                i,
                n
              ), i._setOnCancel(_);
            } else
              i._resolveCallback(t);
            return i;
          }, e.prototype._setBoundTo = function(w) {
            w !== void 0 ? (this._bitField = this._bitField | 2097152, this._boundTo = w) : this._bitField = this._bitField & -2097153;
          }, e.prototype._isBound = function() {
            return (this._bitField & 2097152) === 2097152;
          }, e.bind = function(w, _) {
            return e.resolve(_).bind(w);
          };
        };
      }, {}], 4: [function(c, S, v) {
        var e;
        typeof Promise < "u" && (e = Promise);
        function s() {
          try {
            Promise === r && (Promise = e);
          } catch {
          }
          return r;
        }
        var r = c("./promise")();
        r.noConflict = s, S.exports = r;
      }, { "./promise": 22 }], 5: [function(c, S, v) {
        var e = Object.create;
        if (e) {
          var s = e(null), r = e(null);
          s[" size"] = r[" size"] = 0;
        }
        S.exports = function(f) {
          var g = c("./util"), E = g.canEvaluate;
          g.isIdentifier;
          var p;
          function y(i, t) {
            var n;
            if (i != null && (n = i[t]), typeof n != "function") {
              var u = "Object " + g.classString(i) + " has no method '" + g.toString(t) + "'";
              throw new f.TypeError(u);
            }
            return n;
          }
          function d(i) {
            var t = this.pop(), n = y(i, t);
            return n.apply(i, this);
          }
          f.prototype.call = function(i) {
            var t = [].slice.call(arguments, 1);
            return t.push(i), this._then(d, void 0, void 0, t, void 0);
          };
          function w(i) {
            return i[this];
          }
          function _(i) {
            var t = +this;
            return t < 0 && (t = Math.max(0, t + i.length)), i[t];
          }
          f.prototype.get = function(i) {
            var t = typeof i == "number", n;
            if (t)
              n = _;
            else if (E) {
              var u = p(i);
              n = u !== null ? u : w;
            } else
              n = w;
            return this._then(n, void 0, void 0, i, void 0);
          };
        };
      }, { "./util": 36 }], 6: [function(c, S, v) {
        S.exports = function(e, s, r, f) {
          var g = c("./util"), E = g.tryCatch, p = g.errorObj, y = e._async;
          e.prototype.break = e.prototype.cancel = function() {
            if (!f.cancellation()) return this._warn("cancellation is disabled");
            for (var d = this, w = d; d._isCancellable(); ) {
              if (!d._cancelBy(w)) {
                w._isFollowing() ? w._followee().cancel() : w._cancelBranched();
                break;
              }
              var _ = d._cancellationParent;
              if (_ == null || !_._isCancellable()) {
                d._isFollowing() ? d._followee().cancel() : d._cancelBranched();
                break;
              } else
                d._isFollowing() && d._followee().cancel(), d._setWillBeCancelled(), w = d, d = _;
            }
          }, e.prototype._branchHasCancelled = function() {
            this._branchesRemainingToCancel--;
          }, e.prototype._enoughBranchesHaveCancelled = function() {
            return this._branchesRemainingToCancel === void 0 || this._branchesRemainingToCancel <= 0;
          }, e.prototype._cancelBy = function(d) {
            return d === this ? (this._branchesRemainingToCancel = 0, this._invokeOnCancel(), !0) : (this._branchHasCancelled(), this._enoughBranchesHaveCancelled() ? (this._invokeOnCancel(), !0) : !1);
          }, e.prototype._cancelBranched = function() {
            this._enoughBranchesHaveCancelled() && this._cancel();
          }, e.prototype._cancel = function() {
            this._isCancellable() && (this._setCancelled(), y.invoke(this._cancelPromises, this, void 0));
          }, e.prototype._cancelPromises = function() {
            this._length() > 0 && this._settlePromises();
          }, e.prototype._unsetOnCancel = function() {
            this._onCancelField = void 0;
          }, e.prototype._isCancellable = function() {
            return this.isPending() && !this._isCancelled();
          }, e.prototype.isCancellable = function() {
            return this.isPending() && !this.isCancelled();
          }, e.prototype._doInvokeOnCancel = function(d, w) {
            if (g.isArray(d))
              for (var _ = 0; _ < d.length; ++_)
                this._doInvokeOnCancel(d[_], w);
            else if (d !== void 0)
              if (typeof d == "function") {
                if (!w) {
                  var i = E(d).call(this._boundValue());
                  i === p && (this._attachExtraTrace(i.e), y.throwLater(i.e));
                }
              } else
                d._resultCancelled(this);
          }, e.prototype._invokeOnCancel = function() {
            var d = this._onCancel();
            this._unsetOnCancel(), y.invoke(this._doInvokeOnCancel, this, d);
          }, e.prototype._invokeInternalOnCancel = function() {
            this._isCancellable() && (this._doInvokeOnCancel(this._onCancel(), !0), this._unsetOnCancel());
          }, e.prototype._resultCancelled = function() {
            this.cancel();
          };
        };
      }, { "./util": 36 }], 7: [function(c, S, v) {
        S.exports = function(e) {
          var s = c("./util"), r = c("./es5").keys, f = s.tryCatch, g = s.errorObj;
          function E(p, y, d) {
            return function(w) {
              var _ = d._boundValue();
              e: for (var i = 0; i < p.length; ++i) {
                var t = p[i];
                if (t === Error || t != null && t.prototype instanceof Error) {
                  if (w instanceof t)
                    return f(y).call(_, w);
                } else if (typeof t == "function") {
                  var n = f(t).call(_, w);
                  if (n === g)
                    return n;
                  if (n)
                    return f(y).call(_, w);
                } else if (s.isObject(w)) {
                  for (var u = r(t), k = 0; k < u.length; ++k) {
                    var R = u[k];
                    if (t[R] != w[R])
                      continue e;
                  }
                  return f(y).call(_, w);
                }
              }
              return e;
            };
          }
          return E;
        };
      }, { "./es5": 13, "./util": 36 }], 8: [function(c, S, v) {
        S.exports = function(e) {
          var s = !1, r = [];
          e.prototype._promiseCreated = function() {
          }, e.prototype._pushContext = function() {
          }, e.prototype._popContext = function() {
            return null;
          }, e._peekContext = e.prototype._peekContext = function() {
          };
          function f() {
            this._trace = new f.CapturedTrace(E());
          }
          f.prototype._pushContext = function() {
            this._trace !== void 0 && (this._trace._promiseCreated = null, r.push(this._trace));
          }, f.prototype._popContext = function() {
            if (this._trace !== void 0) {
              var p = r.pop(), y = p._promiseCreated;
              return p._promiseCreated = null, y;
            }
            return null;
          };
          function g() {
            if (s) return new f();
          }
          function E() {
            var p = r.length - 1;
            if (p >= 0)
              return r[p];
          }
          return f.CapturedTrace = null, f.create = g, f.deactivateLongStackTraces = function() {
          }, f.activateLongStackTraces = function() {
            var p = e.prototype._pushContext, y = e.prototype._popContext, d = e._peekContext, w = e.prototype._peekContext, _ = e.prototype._promiseCreated;
            f.deactivateLongStackTraces = function() {
              e.prototype._pushContext = p, e.prototype._popContext = y, e._peekContext = d, e.prototype._peekContext = w, e.prototype._promiseCreated = _, s = !1;
            }, s = !0, e.prototype._pushContext = f.prototype._pushContext, e.prototype._popContext = f.prototype._popContext, e._peekContext = e.prototype._peekContext = E, e.prototype._promiseCreated = function() {
              var i = this._peekContext();
              i && i._promiseCreated == null && (i._promiseCreated = this);
            };
          }, f;
        };
      }, {}], 9: [function(c, S, v) {
        S.exports = function(e, s, r, f) {
          var g = e._async, E = c("./errors").Warning, p = c("./util"), y = c("./es5"), d = p.canAttachTrace, w, _, i = /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/, t = /\((?:timers\.js):\d+:\d+\)/, n = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/, u = null, k = null, R = !1, j, U = p.env("BLUEBIRD_DEBUG") != 0, M = !!(p.env("BLUEBIRD_WARNINGS") != 0 && (U || p.env("BLUEBIRD_WARNINGS"))), Z = !!(p.env("BLUEBIRD_LONG_STACK_TRACES") != 0 && (U || p.env("BLUEBIRD_LONG_STACK_TRACES"))), q = p.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 && (M || !!p.env("BLUEBIRD_W_FORGOTTEN_RETURN")), Q;
          (function() {
            var O = [];
            function K() {
              for (var oe = 0; oe < O.length; ++oe)
                O[oe]._notifyUnhandledRejection();
              ae();
            }
            function ae() {
              O.length = 0;
            }
            Q = function(oe) {
              O.push(oe), setTimeout(K, 1);
            }, y.defineProperty(e, "_unhandledRejectionCheck", {
              value: K
            }), y.defineProperty(e, "_unhandledRejectionClear", {
              value: ae
            });
          })(), e.prototype.suppressUnhandledRejections = function() {
            var O = this._target();
            O._bitField = O._bitField & -1048577 | 524288;
          }, e.prototype._ensurePossibleRejectionHandled = function() {
            (this._bitField & 524288) === 0 && (this._setRejectionIsUnhandled(), Q(this));
          }, e.prototype._notifyUnhandledRejectionIsHandled = function() {
            ie(
              "rejectionHandled",
              w,
              void 0,
              this
            );
          }, e.prototype._setReturnedNonUndefined = function() {
            this._bitField = this._bitField | 268435456;
          }, e.prototype._returnedNonUndefined = function() {
            return (this._bitField & 268435456) !== 0;
          }, e.prototype._notifyUnhandledRejection = function() {
            if (this._isRejectionUnhandled()) {
              var O = this._settledValue();
              this._setUnhandledRejectionIsNotified(), ie(
                "unhandledRejection",
                _,
                O,
                this
              );
            }
          }, e.prototype._setUnhandledRejectionIsNotified = function() {
            this._bitField = this._bitField | 262144;
          }, e.prototype._unsetUnhandledRejectionIsNotified = function() {
            this._bitField = this._bitField & -262145;
          }, e.prototype._isUnhandledRejectionNotified = function() {
            return (this._bitField & 262144) > 0;
          }, e.prototype._setRejectionIsUnhandled = function() {
            this._bitField = this._bitField | 1048576;
          }, e.prototype._unsetRejectionIsUnhandled = function() {
            this._bitField = this._bitField & -1048577, this._isUnhandledRejectionNotified() && (this._unsetUnhandledRejectionIsNotified(), this._notifyUnhandledRejectionIsHandled());
          }, e.prototype._isRejectionUnhandled = function() {
            return (this._bitField & 1048576) > 0;
          }, e.prototype._warn = function(O, K, ae) {
            return P(O, K, ae || this);
          }, e.onPossiblyUnhandledRejection = function(O) {
            var K = e._getContext();
            _ = p.contextBind(K, O);
          }, e.onUnhandledRejectionHandled = function(O) {
            var K = e._getContext();
            w = p.contextBind(K, O);
          };
          var re = function() {
          };
          e.longStackTraces = function() {
            if (g.haveItemsQueued() && !ee.longStackTraces)
              throw new Error(`cannot enable long stack traces after promises have been created

    See http://goo.gl/MqrFmX
`);
            if (!ee.longStackTraces && Se()) {
              var O = e.prototype._captureStackTrace, K = e.prototype._attachExtraTrace, ae = e.prototype._dereferenceTrace;
              ee.longStackTraces = !0, re = function() {
                if (g.haveItemsQueued() && !ee.longStackTraces)
                  throw new Error(`cannot enable long stack traces after promises have been created

    See http://goo.gl/MqrFmX
`);
                e.prototype._captureStackTrace = O, e.prototype._attachExtraTrace = K, e.prototype._dereferenceTrace = ae, s.deactivateLongStackTraces(), ee.longStackTraces = !1;
              }, e.prototype._captureStackTrace = T, e.prototype._attachExtraTrace = N, e.prototype._dereferenceTrace = J, s.activateLongStackTraces();
            }
          }, e.hasLongStackTraces = function() {
            return ee.longStackTraces && Se();
          };
          var H = {
            unhandledrejection: {
              before: function() {
                var O = p.global.onunhandledrejection;
                return p.global.onunhandledrejection = null, O;
              },
              after: function(O) {
                p.global.onunhandledrejection = O;
              }
            },
            rejectionhandled: {
              before: function() {
                var O = p.global.onrejectionhandled;
                return p.global.onrejectionhandled = null, O;
              },
              after: function(O) {
                p.global.onrejectionhandled = O;
              }
            }
          }, te = (function() {
            var O = function(ae, oe) {
              if (ae) {
                var be;
                try {
                  return be = ae.before(), !p.global.dispatchEvent(oe);
                } finally {
                  ae.after(be);
                }
              } else
                return !p.global.dispatchEvent(oe);
            };
            try {
              if (typeof CustomEvent == "function") {
                var K = new CustomEvent("CustomEvent");
                return p.global.dispatchEvent(K), function(ae, oe) {
                  ae = ae.toLowerCase();
                  var be = {
                    detail: oe,
                    cancelable: !0
                  }, ve = new CustomEvent(ae, be);
                  return y.defineProperty(
                    ve,
                    "promise",
                    { value: oe.promise }
                  ), y.defineProperty(
                    ve,
                    "reason",
                    { value: oe.reason }
                  ), O(H[ae], ve);
                };
              } else if (typeof Event == "function") {
                var K = new Event("CustomEvent");
                return p.global.dispatchEvent(K), function(oe, be) {
                  oe = oe.toLowerCase();
                  var ve = new Event(oe, {
                    cancelable: !0
                  });
                  return ve.detail = be, y.defineProperty(ve, "promise", { value: be.promise }), y.defineProperty(ve, "reason", { value: be.reason }), O(H[oe], ve);
                };
              } else {
                var K = document.createEvent("CustomEvent");
                return K.initCustomEvent("testingtheevent", !1, !0, {}), p.global.dispatchEvent(K), function(oe, be) {
                  oe = oe.toLowerCase();
                  var ve = document.createEvent("CustomEvent");
                  return ve.initCustomEvent(
                    oe,
                    !1,
                    !0,
                    be
                  ), O(H[oe], ve);
                };
              }
            } catch {
            }
            return function() {
              return !1;
            };
          })(), ue = (function() {
            return p.isNode ? function() {
              return process.emit.apply(process, arguments);
            } : p.global ? function(O) {
              var K = "on" + O.toLowerCase(), ae = p.global[K];
              return ae ? (ae.apply(p.global, [].slice.call(arguments, 1)), !0) : !1;
            } : function() {
              return !1;
            };
          })();
          function fe(O, K) {
            return { promise: K };
          }
          var W = {
            promiseCreated: fe,
            promiseFulfilled: fe,
            promiseRejected: fe,
            promiseResolved: fe,
            promiseCancelled: fe,
            promiseChained: function(O, K, ae) {
              return { promise: K, child: ae };
            },
            warning: function(O, K) {
              return { warning: K };
            },
            unhandledRejection: function(O, K, ae) {
              return { reason: K, promise: ae };
            },
            rejectionHandled: fe
          }, B = function(O) {
            var K = !1;
            try {
              K = ue.apply(null, arguments);
            } catch (oe) {
              g.throwLater(oe), K = !0;
            }
            var ae = !1;
            try {
              ae = te(
                O,
                W[O].apply(null, arguments)
              );
            } catch (oe) {
              g.throwLater(oe), ae = !0;
            }
            return ae || K;
          };
          e.config = function(O) {
            if (O = Object(O), "longStackTraces" in O && (O.longStackTraces ? e.longStackTraces() : !O.longStackTraces && e.hasLongStackTraces() && re()), "warnings" in O) {
              var K = O.warnings;
              ee.warnings = !!K, q = ee.warnings, p.isObject(K) && "wForgottenReturn" in K && (q = !!K.wForgottenReturn);
            }
            if ("cancellation" in O && O.cancellation && !ee.cancellation) {
              if (g.haveItemsQueued())
                throw new Error(
                  "cannot enable cancellation after promises are in use"
                );
              e.prototype._clearCancellationData = he, e.prototype._propagateFrom = se, e.prototype._onCancel = ne, e.prototype._setOnCancel = D, e.prototype._attachCancellationCallback = G, e.prototype._execute = C, h = se, ee.cancellation = !0;
            }
            if ("monitoring" in O && (O.monitoring && !ee.monitoring ? (ee.monitoring = !0, e.prototype._fireEvent = B) : !O.monitoring && ee.monitoring && (ee.monitoring = !1, e.prototype._fireEvent = Y)), "asyncHooks" in O && p.nodeSupportsAsyncResource) {
              var ae = ee.asyncHooks, oe = !!O.asyncHooks;
              ae !== oe && (ee.asyncHooks = oe, oe ? r() : f());
            }
            return e;
          };
          function Y() {
            return !1;
          }
          e.prototype._fireEvent = Y, e.prototype._execute = function(O, K, ae) {
            try {
              O(K, ae);
            } catch (oe) {
              return oe;
            }
          }, e.prototype._onCancel = function() {
          }, e.prototype._setOnCancel = function(O) {
          }, e.prototype._attachCancellationCallback = function(O) {
          }, e.prototype._captureStackTrace = function() {
          }, e.prototype._attachExtraTrace = function() {
          }, e.prototype._dereferenceTrace = function() {
          }, e.prototype._clearCancellationData = function() {
          }, e.prototype._propagateFrom = function(O, K) {
          };
          function C(O, K, ae) {
            var oe = this;
            try {
              O(K, ae, function(be) {
                if (typeof be != "function")
                  throw new TypeError("onCancel must be a function, got: " + p.toString(be));
                oe._attachCancellationCallback(be);
              });
            } catch (be) {
              return be;
            }
          }
          function G(O) {
            if (!this._isCancellable()) return this;
            var K = this._onCancel();
            K !== void 0 ? p.isArray(K) ? K.push(O) : this._setOnCancel([K, O]) : this._setOnCancel(O);
          }
          function ne() {
            return this._onCancelField;
          }
          function D(O) {
            this._onCancelField = O;
          }
          function he() {
            this._cancellationParent = void 0, this._onCancelField = void 0;
          }
          function se(O, K) {
            if ((K & 1) !== 0) {
              this._cancellationParent = O;
              var ae = O._branchesRemainingToCancel;
              ae === void 0 && (ae = 0), O._branchesRemainingToCancel = ae + 1;
            }
            (K & 2) !== 0 && O._isBound() && this._setBoundTo(O._boundTo);
          }
          function _e(O, K) {
            (K & 2) !== 0 && O._isBound() && this._setBoundTo(O._boundTo);
          }
          var h = _e;
          function a() {
            var O = this._boundTo;
            return O !== void 0 && O instanceof e ? O.isFulfilled() ? O.value() : void 0 : O;
          }
          function T() {
            this._trace = new A(this._peekContext());
          }
          function N(O, K) {
            if (d(O)) {
              var ae = this._trace;
              if (ae !== void 0 && K && (ae = ae._parent), ae !== void 0)
                ae.attachExtraTrace(O);
              else if (!O.__stackCleaned__) {
                var oe = le(O);
                p.notEnumerableProp(
                  O,
                  "stack",
                  oe.message + `
` + oe.stack.join(`
`)
                ), p.notEnumerableProp(O, "__stackCleaned__", !0);
              }
            }
          }
          function J() {
            this._trace = void 0;
          }
          function $(O, K, ae, oe, be) {
            if (O === void 0 && K !== null && q) {
              if (be !== void 0 && be._returnedNonUndefined() || (oe._bitField & 65535) === 0) return;
              ae && (ae = ae + " ");
              var ve = "", Re = "";
              if (K._trace) {
                for (var xe = K._trace.stack.split(`
`), Te = ce(xe), Ce = Te.length - 1; Ce >= 0; --Ce) {
                  var We = Te[Ce];
                  if (!t.test(We)) {
                    var qe = We.match(n);
                    qe && (ve = "at " + qe[1] + ":" + qe[2] + ":" + qe[3] + " ");
                    break;
                  }
                }
                if (Te.length > 0) {
                  for (var ot = Te[0], Ce = 0; Ce < xe.length; ++Ce)
                    if (xe[Ce] === ot) {
                      Ce > 0 && (Re = `
` + xe[Ce - 1]);
                      break;
                    }
                }
              }
              var ht = "a promise was created in a " + ae + "handler " + ve + "but was not returned from it, see http://goo.gl/rRqMUw" + Re;
              oe._warn(ht, !0, K);
            }
          }
          function F(O, K) {
            var ae = O + " is deprecated and will be removed in a future version.";
            return K && (ae += " Use " + K + " instead."), P(ae);
          }
          function P(O, K, ae) {
            if (ee.warnings) {
              var oe = new E(O), be;
              if (K)
                ae._attachExtraTrace(oe);
              else if (ee.longStackTraces && (be = e._peekContext()))
                be.attachExtraTrace(oe);
              else {
                var ve = le(oe);
                oe.stack = ve.message + `
` + ve.stack.join(`
`);
              }
              B("warning", oe) || ye(oe, "", !0);
            }
          }
          function X(O, K) {
            for (var ae = 0; ae < K.length - 1; ++ae)
              K[ae].push("From previous event:"), K[ae] = K[ae].join(`
`);
            return ae < K.length && (K[ae] = K[ae].join(`
`)), O + `
` + K.join(`
`);
          }
          function pe(O) {
            for (var K = 0; K < O.length; ++K)
              (O[K].length === 0 || K + 1 < O.length && O[K][0] === O[K + 1][0]) && (O.splice(K, 1), K--);
          }
          function de(O) {
            for (var K = O[0], ae = 1; ae < O.length; ++ae) {
              for (var oe = O[ae], be = K.length - 1, ve = K[be], Re = -1, xe = oe.length - 1; xe >= 0; --xe)
                if (oe[xe] === ve) {
                  Re = xe;
                  break;
                }
              for (var xe = Re; xe >= 0; --xe) {
                var Te = oe[xe];
                if (K[be] === Te)
                  K.pop(), be--;
                else
                  break;
              }
              K = oe;
            }
          }
          function ce(O) {
            for (var K = [], ae = 0; ae < O.length; ++ae) {
              var oe = O[ae], be = oe === "    (No stack trace)" || u.test(oe), ve = be && Oe(oe);
              be && !ve && (R && oe.charAt(0) !== " " && (oe = "    " + oe), K.push(oe));
            }
            return K;
          }
          function z(O) {
            for (var K = O.stack.replace(/\s+$/g, "").split(`
`), ae = 0; ae < K.length; ++ae) {
              var oe = K[ae];
              if (oe === "    (No stack trace)" || u.test(oe))
                break;
            }
            return ae > 0 && O.name != "SyntaxError" && (K = K.slice(ae)), K;
          }
          function le(O) {
            var K = O.stack, ae = O.toString();
            return K = typeof K == "string" && K.length > 0 ? z(O) : ["    (No stack trace)"], {
              message: ae,
              stack: O.name == "SyntaxError" ? K : ce(K)
            };
          }
          function ye(O, K, ae) {
            if (typeof console < "u") {
              var oe;
              if (p.isObject(O)) {
                var be = O.stack;
                oe = K + k(be, O);
              } else
                oe = K + String(O);
              typeof j == "function" ? j(oe, ae) : (typeof console.log == "function" || typeof console.log == "object") && console.log(oe);
            }
          }
          function ie(O, K, ae, oe) {
            var be = !1;
            try {
              typeof K == "function" && (be = !0, O === "rejectionHandled" ? K(oe) : K(ae, oe));
            } catch (ve) {
              g.throwLater(ve);
            }
            O === "unhandledRejection" ? !B(O, ae, oe) && !be && ye(ae, "Unhandled rejection ") : B(O, oe);
          }
          function Ee(O) {
            var K;
            if (typeof O == "function")
              K = "[function " + (O.name || "anonymous") + "]";
            else {
              K = O && typeof O.toString == "function" ? O.toString() : p.toString(O);
              var ae = /\[object [a-zA-Z0-9$_]+\]/;
              if (ae.test(K))
                try {
                  var oe = JSON.stringify(O);
                  K = oe;
                } catch {
                }
              K.length === 0 && (K = "(empty array)");
            }
            return "(<" + ke(K) + ">, no stack trace)";
          }
          function ke(O) {
            var K = 41;
            return O.length < K ? O : O.substr(0, K - 3) + "...";
          }
          function Se() {
            return typeof V == "function";
          }
          var Oe = function() {
            return !1;
          }, x = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
          function o(O) {
            var K = O.match(x);
            if (K)
              return {
                fileName: K[1],
                line: parseInt(K[2], 10)
              };
          }
          function l(O, K) {
            if (Se()) {
              for (var ae = (O.stack || "").split(`
`), oe = (K.stack || "").split(`
`), be = -1, ve = -1, Re, xe, Te = 0; Te < ae.length; ++Te) {
                var Ce = o(ae[Te]);
                if (Ce) {
                  Re = Ce.fileName, be = Ce.line;
                  break;
                }
              }
              for (var Te = 0; Te < oe.length; ++Te) {
                var Ce = o(oe[Te]);
                if (Ce) {
                  xe = Ce.fileName, ve = Ce.line;
                  break;
                }
              }
              be < 0 || ve < 0 || !Re || !xe || Re !== xe || be >= ve || (Oe = function(We) {
                if (i.test(We)) return !0;
                var qe = o(We);
                return !!(qe && qe.fileName === Re && be <= qe.line && qe.line <= ve);
              });
            }
          }
          function A(O) {
            this._parent = O, this._promisesCreated = 0;
            var K = this._length = 1 + (O === void 0 ? 0 : O._length);
            V(this, A), K > 32 && this.uncycle();
          }
          p.inherits(A, Error), s.CapturedTrace = A, A.prototype.uncycle = function() {
            var O = this._length;
            if (!(O < 2)) {
              for (var K = [], ae = {}, oe = 0, be = this; be !== void 0; ++oe)
                K.push(be), be = be._parent;
              O = this._length = oe;
              for (var oe = O - 1; oe >= 0; --oe) {
                var ve = K[oe].stack;
                ae[ve] === void 0 && (ae[ve] = oe);
              }
              for (var oe = 0; oe < O; ++oe) {
                var Re = K[oe].stack, xe = ae[Re];
                if (xe !== void 0 && xe !== oe) {
                  xe > 0 && (K[xe - 1]._parent = void 0, K[xe - 1]._length = 1), K[oe]._parent = void 0, K[oe]._length = 1;
                  var Te = oe > 0 ? K[oe - 1] : this;
                  xe < O - 1 ? (Te._parent = K[xe + 1], Te._parent.uncycle(), Te._length = Te._parent._length + 1) : (Te._parent = void 0, Te._length = 1);
                  for (var Ce = Te._length + 1, We = oe - 2; We >= 0; --We)
                    K[We]._length = Ce, Ce++;
                  return;
                }
              }
            }
          }, A.prototype.attachExtraTrace = function(O) {
            if (!O.__stackCleaned__) {
              this.uncycle();
              for (var K = le(O), ae = K.message, oe = [K.stack], be = this; be !== void 0; )
                oe.push(ce(be.stack.split(`
`))), be = be._parent;
              de(oe), pe(oe), p.notEnumerableProp(O, "stack", X(ae, oe)), p.notEnumerableProp(O, "__stackCleaned__", !0);
            }
          };
          var V = (function() {
            var K = /^\s*at\s*/, ae = function(Re, xe) {
              return typeof Re == "string" ? Re : xe.name !== void 0 && xe.message !== void 0 ? xe.toString() : Ee(xe);
            };
            if (typeof Error.stackTraceLimit == "number" && typeof Error.captureStackTrace == "function") {
              Error.stackTraceLimit += 6, u = K, k = ae;
              var oe = Error.captureStackTrace;
              return Oe = function(Re) {
                return i.test(Re);
              }, function(Re, xe) {
                Error.stackTraceLimit += 6, oe(Re, xe), Error.stackTraceLimit -= 6;
              };
            }
            var be = new Error();
            if (typeof be.stack == "string" && be.stack.split(`
`)[0].indexOf("stackDetection@") >= 0)
              return u = /@/, k = ae, R = !0, function(xe) {
                xe.stack = new Error().stack;
              };
            var ve;
            try {
              throw new Error();
            } catch (Re) {
              ve = "stack" in Re;
            }
            return !("stack" in be) && ve && typeof Error.stackTraceLimit == "number" ? (u = K, k = ae, function(xe) {
              Error.stackTraceLimit += 6;
              try {
                throw new Error();
              } catch (Te) {
                xe.stack = Te.stack;
              }
              Error.stackTraceLimit -= 6;
            }) : (k = function(Re, xe) {
              return typeof Re == "string" ? Re : (typeof xe == "object" || typeof xe == "function") && xe.name !== void 0 && xe.message !== void 0 ? xe.toString() : Ee(xe);
            }, null);
          })();
          typeof console < "u" && typeof console.warn < "u" && (j = function(O) {
            console.warn(O);
          }, p.isNode && process.stderr.isTTY ? j = function(O, K) {
            var ae = K ? "\x1B[33m" : "\x1B[31m";
            console.warn(ae + O + `\x1B[0m
`);
          } : !p.isNode && typeof new Error().stack == "string" && (j = function(O, K) {
            console.warn(
              "%c" + O,
              K ? "color: darkorange" : "color: red"
            );
          }));
          var ee = {
            warnings: M,
            longStackTraces: !1,
            cancellation: !1,
            monitoring: !1,
            asyncHooks: !1
          };
          return Z && e.longStackTraces(), {
            asyncHooks: function() {
              return ee.asyncHooks;
            },
            longStackTraces: function() {
              return ee.longStackTraces;
            },
            warnings: function() {
              return ee.warnings;
            },
            cancellation: function() {
              return ee.cancellation;
            },
            monitoring: function() {
              return ee.monitoring;
            },
            propagateFromFunction: function() {
              return h;
            },
            boundValueFunction: function() {
              return a;
            },
            checkForgottenReturns: $,
            setBounds: l,
            warn: P,
            deprecated: F,
            CapturedTrace: A,
            fireDomEvent: te,
            fireGlobalEvent: ue
          };
        };
      }, { "./errors": 12, "./es5": 13, "./util": 36 }], 10: [function(c, S, v) {
        S.exports = function(e) {
          function s() {
            return this.value;
          }
          function r() {
            throw this.reason;
          }
          e.prototype.return = e.prototype.thenReturn = function(f) {
            return f instanceof e && f.suppressUnhandledRejections(), this._then(
              s,
              void 0,
              void 0,
              { value: f },
              void 0
            );
          }, e.prototype.throw = e.prototype.thenThrow = function(f) {
            return this._then(
              r,
              void 0,
              void 0,
              { reason: f },
              void 0
            );
          }, e.prototype.catchThrow = function(f) {
            if (arguments.length <= 1)
              return this._then(
                void 0,
                r,
                void 0,
                { reason: f },
                void 0
              );
            var g = arguments[1], E = function() {
              throw g;
            };
            return this.caught(f, E);
          }, e.prototype.catchReturn = function(f) {
            if (arguments.length <= 1)
              return f instanceof e && f.suppressUnhandledRejections(), this._then(
                void 0,
                s,
                void 0,
                { value: f },
                void 0
              );
            var g = arguments[1];
            g instanceof e && g.suppressUnhandledRejections();
            var E = function() {
              return g;
            };
            return this.caught(f, E);
          };
        };
      }, {}], 11: [function(c, S, v) {
        S.exports = function(e, s) {
          var r = e.reduce, f = e.all;
          function g() {
            return f(this);
          }
          function E(p, y) {
            return r(p, y, s, s);
          }
          e.prototype.each = function(p) {
            return r(this, p, s, 0)._then(g, void 0, void 0, this, void 0);
          }, e.prototype.mapSeries = function(p) {
            return r(this, p, s, s);
          }, e.each = function(p, y) {
            return r(p, y, s, 0)._then(g, void 0, void 0, p, void 0);
          }, e.mapSeries = E;
        };
      }, {}], 12: [function(c, S, v) {
        var e = c("./es5"), s = e.freeze, r = c("./util"), f = r.inherits, g = r.notEnumerableProp;
        function E(j, U) {
          function M(Z) {
            if (!(this instanceof M)) return new M(Z);
            g(
              this,
              "message",
              typeof Z == "string" ? Z : U
            ), g(this, "name", j), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : Error.call(this);
          }
          return f(M, Error), M;
        }
        var p, y, d = E("Warning", "warning"), w = E("CancellationError", "cancellation error"), _ = E("TimeoutError", "timeout error"), i = E("AggregateError", "aggregate error");
        try {
          p = TypeError, y = RangeError;
        } catch {
          p = E("TypeError", "type error"), y = E("RangeError", "range error");
        }
        for (var t = "join pop push shift unshift slice filter forEach some every map indexOf lastIndexOf reduce reduceRight sort reverse".split(" "), n = 0; n < t.length; ++n)
          typeof Array.prototype[t[n]] == "function" && (i.prototype[t[n]] = Array.prototype[t[n]]);
        e.defineProperty(i.prototype, "length", {
          value: 0,
          configurable: !1,
          writable: !0,
          enumerable: !0
        }), i.prototype.isOperational = !0;
        var u = 0;
        i.prototype.toString = function() {
          var j = Array(u * 4 + 1).join(" "), U = `
` + j + `AggregateError of:
`;
          u++, j = Array(u * 4 + 1).join(" ");
          for (var M = 0; M < this.length; ++M) {
            for (var Z = this[M] === this ? "[Circular AggregateError]" : this[M] + "", q = Z.split(`
`), Q = 0; Q < q.length; ++Q)
              q[Q] = j + q[Q];
            Z = q.join(`
`), U += Z + `
`;
          }
          return u--, U;
        };
        function k(j) {
          if (!(this instanceof k))
            return new k(j);
          g(this, "name", "OperationalError"), g(this, "message", j), this.cause = j, this.isOperational = !0, j instanceof Error ? (g(this, "message", j.message), g(this, "stack", j.stack)) : Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
        }
        f(k, Error);
        var R = Error.__BluebirdErrorTypes__;
        R || (R = s({
          CancellationError: w,
          TimeoutError: _,
          OperationalError: k,
          RejectionError: k,
          AggregateError: i
        }), e.defineProperty(Error, "__BluebirdErrorTypes__", {
          value: R,
          writable: !1,
          enumerable: !1,
          configurable: !1
        })), S.exports = {
          Error,
          TypeError: p,
          RangeError: y,
          CancellationError: R.CancellationError,
          OperationalError: R.OperationalError,
          TimeoutError: R.TimeoutError,
          AggregateError: R.AggregateError,
          Warning: d
        };
      }, { "./es5": 13, "./util": 36 }], 13: [function(c, S, v) {
        var e = /* @__PURE__ */ (function() {
          return this === void 0;
        })();
        if (e)
          S.exports = {
            freeze: Object.freeze,
            defineProperty: Object.defineProperty,
            getDescriptor: Object.getOwnPropertyDescriptor,
            keys: Object.keys,
            names: Object.getOwnPropertyNames,
            getPrototypeOf: Object.getPrototypeOf,
            isArray: Array.isArray,
            isES5: e,
            propertyIsWritable: function(_, i) {
              var t = Object.getOwnPropertyDescriptor(_, i);
              return !!(!t || t.writable || t.set);
            }
          };
        else {
          var s = {}.hasOwnProperty, r = {}.toString, f = {}.constructor.prototype, g = function(_) {
            var i = [];
            for (var t in _)
              s.call(_, t) && i.push(t);
            return i;
          }, E = function(_, i) {
            return { value: _[i] };
          }, p = function(_, i, t) {
            return _[i] = t.value, _;
          }, y = function(_) {
            return _;
          }, d = function(_) {
            try {
              return Object(_).constructor.prototype;
            } catch {
              return f;
            }
          }, w = function(_) {
            try {
              return r.call(_) === "[object Array]";
            } catch {
              return !1;
            }
          };
          S.exports = {
            isArray: w,
            keys: g,
            names: g,
            defineProperty: p,
            getDescriptor: E,
            freeze: y,
            getPrototypeOf: d,
            isES5: e,
            propertyIsWritable: function() {
              return !0;
            }
          };
        }
      }, {}], 14: [function(c, S, v) {
        S.exports = function(e, s) {
          var r = e.map;
          e.prototype.filter = function(f, g) {
            return r(this, f, g, s);
          }, e.filter = function(f, g, E) {
            return r(f, g, E, s);
          };
        };
      }, {}], 15: [function(c, S, v) {
        S.exports = function(e, s, r) {
          var f = c("./util"), g = e.CancellationError, E = f.errorObj, p = c("./catch_filter")(r);
          function y(n, u, k) {
            this.promise = n, this.type = u, this.handler = k, this.called = !1, this.cancelPromise = null;
          }
          y.prototype.isFinallyHandler = function() {
            return this.type === 0;
          };
          function d(n) {
            this.finallyHandler = n;
          }
          d.prototype._resultCancelled = function() {
            w(this.finallyHandler);
          };
          function w(n, u) {
            return n.cancelPromise != null ? (arguments.length > 1 ? n.cancelPromise._reject(u) : n.cancelPromise._cancel(), n.cancelPromise = null, !0) : !1;
          }
          function _() {
            return t.call(this, this.promise._target()._settledValue());
          }
          function i(n) {
            if (!w(this, n))
              return E.e = n, E;
          }
          function t(n) {
            var u = this.promise, k = this.handler;
            if (!this.called) {
              this.called = !0;
              var R = this.isFinallyHandler() ? k.call(u._boundValue()) : k.call(u._boundValue(), n);
              if (R === r)
                return R;
              if (R !== void 0) {
                u._setReturnedNonUndefined();
                var j = s(R, u);
                if (j instanceof e) {
                  if (this.cancelPromise != null)
                    if (j._isCancelled()) {
                      var U = new g("late cancellation observer");
                      return u._attachExtraTrace(U), E.e = U, E;
                    } else j.isPending() && j._attachCancellationCallback(
                      new d(this)
                    );
                  return j._then(
                    _,
                    i,
                    void 0,
                    this,
                    void 0
                  );
                }
              }
            }
            return u.isRejected() ? (w(this), E.e = n, E) : (w(this), n);
          }
          return e.prototype._passThrough = function(n, u, k, R) {
            return typeof n != "function" ? this.then() : this._then(
              k,
              R,
              void 0,
              new y(this, u, n),
              void 0
            );
          }, e.prototype.lastly = e.prototype.finally = function(n) {
            return this._passThrough(
              n,
              0,
              t,
              t
            );
          }, e.prototype.tap = function(n) {
            return this._passThrough(n, 1, t);
          }, e.prototype.tapCatch = function(n) {
            var u = arguments.length;
            if (u === 1)
              return this._passThrough(
                n,
                1,
                void 0,
                t
              );
            var k = new Array(u - 1), R = 0, j;
            for (j = 0; j < u - 1; ++j) {
              var U = arguments[j];
              if (f.isObject(U))
                k[R++] = U;
              else
                return e.reject(new TypeError(
                  "tapCatch statement predicate: expecting an object but got " + f.classString(U)
                ));
            }
            k.length = R;
            var M = arguments[j];
            return this._passThrough(
              p(k, M, this),
              1,
              void 0,
              t
            );
          }, y;
        };
      }, { "./catch_filter": 7, "./util": 36 }], 16: [function(c, S, v) {
        S.exports = function(e, s, r, f, g, E) {
          var p = c("./errors"), y = p.TypeError, d = c("./util"), w = d.errorObj, _ = d.tryCatch, i = [];
          function t(u, k, R) {
            for (var j = 0; j < k.length; ++j) {
              R._pushContext();
              var U = _(k[j])(u);
              if (R._popContext(), U === w) {
                R._pushContext();
                var M = e.reject(w.e);
                return R._popContext(), M;
              }
              var Z = f(U, R);
              if (Z instanceof e) return Z;
            }
            return null;
          }
          function n(u, k, R, j) {
            if (E.cancellation()) {
              var U = new e(r), M = this._finallyPromise = new e(r);
              this._promise = U.lastly(function() {
                return M;
              }), U._captureStackTrace(), U._setOnCancel(this);
            } else {
              var Z = this._promise = new e(r);
              Z._captureStackTrace();
            }
            this._stack = j, this._generatorFunction = u, this._receiver = k, this._generator = void 0, this._yieldHandlers = typeof R == "function" ? [R].concat(i) : i, this._yieldedPromise = null, this._cancellationPhase = !1;
          }
          d.inherits(n, g), n.prototype._isResolved = function() {
            return this._promise === null;
          }, n.prototype._cleanup = function() {
            this._promise = this._generator = null, E.cancellation() && this._finallyPromise !== null && (this._finallyPromise._fulfill(), this._finallyPromise = null);
          }, n.prototype._promiseCancelled = function() {
            if (!this._isResolved()) {
              var u = typeof this._generator.return < "u", k;
              if (u)
                this._promise._pushContext(), k = _(this._generator.return).call(
                  this._generator,
                  void 0
                ), this._promise._popContext();
              else {
                var R = new e.CancellationError(
                  "generator .return() sentinel"
                );
                e.coroutine.returnSentinel = R, this._promise._attachExtraTrace(R), this._promise._pushContext(), k = _(this._generator.throw).call(
                  this._generator,
                  R
                ), this._promise._popContext();
              }
              this._cancellationPhase = !0, this._yieldedPromise = null, this._continue(k);
            }
          }, n.prototype._promiseFulfilled = function(u) {
            this._yieldedPromise = null, this._promise._pushContext();
            var k = _(this._generator.next).call(this._generator, u);
            this._promise._popContext(), this._continue(k);
          }, n.prototype._promiseRejected = function(u) {
            this._yieldedPromise = null, this._promise._attachExtraTrace(u), this._promise._pushContext();
            var k = _(this._generator.throw).call(this._generator, u);
            this._promise._popContext(), this._continue(k);
          }, n.prototype._resultCancelled = function() {
            if (this._yieldedPromise instanceof e) {
              var u = this._yieldedPromise;
              this._yieldedPromise = null, u.cancel();
            }
          }, n.prototype.promise = function() {
            return this._promise;
          }, n.prototype._run = function() {
            this._generator = this._generatorFunction.call(this._receiver), this._receiver = this._generatorFunction = void 0, this._promiseFulfilled(void 0);
          }, n.prototype._continue = function(u) {
            var k = this._promise;
            if (u === w)
              return this._cleanup(), this._cancellationPhase ? k.cancel() : k._rejectCallback(u.e, !1);
            var R = u.value;
            if (u.done === !0)
              return this._cleanup(), this._cancellationPhase ? k.cancel() : k._resolveCallback(R);
            var j = f(R, this._promise);
            if (!(j instanceof e) && (j = t(
              j,
              this._yieldHandlers,
              this._promise
            ), j === null)) {
              this._promiseRejected(
                new y(
                  `A value %s was yielded that could not be treated as a promise

    See http://goo.gl/MqrFmX

`.replace("%s", String(R)) + `From coroutine:
` + this._stack.split(`
`).slice(1, -7).join(`
`)
                )
              );
              return;
            }
            j = j._target();
            var U = j._bitField;
            (U & 50397184) === 0 ? (this._yieldedPromise = j, j._proxy(this, null)) : (U & 33554432) !== 0 ? e._async.invoke(
              this._promiseFulfilled,
              this,
              j._value()
            ) : (U & 16777216) !== 0 ? e._async.invoke(
              this._promiseRejected,
              this,
              j._reason()
            ) : this._promiseCancelled();
          }, e.coroutine = function(u, k) {
            if (typeof u != "function")
              throw new y(`generatorFunction must be a function

    See http://goo.gl/MqrFmX
`);
            var R = Object(k).yieldHandler, j = n, U = new Error().stack;
            return function() {
              var M = u.apply(this, arguments), Z = new j(
                void 0,
                void 0,
                R,
                U
              ), q = Z.promise();
              return Z._generator = M, Z._promiseFulfilled(void 0), q;
            };
          }, e.coroutine.addYieldHandler = function(u) {
            if (typeof u != "function")
              throw new y("expecting a function but got " + d.classString(u));
            i.push(u);
          }, e.spawn = function(u) {
            if (E.deprecated("Promise.spawn()", "Promise.coroutine()"), typeof u != "function")
              return s(`generatorFunction must be a function

    See http://goo.gl/MqrFmX
`);
            var k = new n(u, this), R = k.promise();
            return k._run(e.spawn), R;
          };
        };
      }, { "./errors": 12, "./util": 36 }], 17: [function(c, S, v) {
        S.exports = function(e, s, r, f, g) {
          var E = c("./util");
          E.canEvaluate, E.tryCatch, E.errorObj, e.join = function() {
            var p = arguments.length - 1, y;
            if (p > 0 && typeof arguments[p] == "function") {
              y = arguments[p];
              var w;
            }
            var d = [].slice.call(arguments);
            y && d.pop();
            var w = new s(d).promise();
            return y !== void 0 ? w.spread(y) : w;
          };
        };
      }, { "./util": 36 }], 18: [function(c, S, v) {
        S.exports = function(e, s, r, f, g, E) {
          var p = c("./util"), y = p.tryCatch, d = p.errorObj, w = e._async;
          function _(t, n, u, k) {
            this.constructor$(t), this._promise._captureStackTrace();
            var R = e._getContext();
            if (this._callback = p.contextBind(R, n), this._preservedValues = k === g ? new Array(this.length()) : null, this._limit = u, this._inFlight = 0, this._queue = [], w.invoke(this._asyncInit, this, void 0), p.isArray(t))
              for (var j = 0; j < t.length; ++j) {
                var U = t[j];
                U instanceof e && U.suppressUnhandledRejections();
              }
          }
          p.inherits(_, s), _.prototype._asyncInit = function() {
            this._init$(void 0, -2);
          }, _.prototype._init = function() {
          }, _.prototype._promiseFulfilled = function(t, n) {
            var u = this._values, k = this.length(), R = this._preservedValues, j = this._limit;
            if (n < 0) {
              if (n = n * -1 - 1, u[n] = t, j >= 1 && (this._inFlight--, this._drainQueue(), this._isResolved()))
                return !0;
            } else {
              if (j >= 1 && this._inFlight >= j)
                return u[n] = t, this._queue.push(n), !1;
              R !== null && (R[n] = t);
              var U = this._promise, M = this._callback, Z = U._boundValue();
              U._pushContext();
              var q = y(M).call(Z, t, n, k), Q = U._popContext();
              if (E.checkForgottenReturns(
                q,
                Q,
                R !== null ? "Promise.filter" : "Promise.map",
                U
              ), q === d)
                return this._reject(q.e), !0;
              var re = f(q, this._promise);
              if (re instanceof e) {
                re = re._target();
                var H = re._bitField;
                if ((H & 50397184) === 0)
                  return j >= 1 && this._inFlight++, u[n] = re, re._proxy(this, (n + 1) * -1), !1;
                if ((H & 33554432) !== 0)
                  q = re._value();
                else return (H & 16777216) !== 0 ? (this._reject(re._reason()), !0) : (this._cancel(), !0);
              }
              u[n] = q;
            }
            var te = ++this._totalResolved;
            return te >= k ? (R !== null ? this._filter(u, R) : this._resolve(u), !0) : !1;
          }, _.prototype._drainQueue = function() {
            for (var t = this._queue, n = this._limit, u = this._values; t.length > 0 && this._inFlight < n; ) {
              if (this._isResolved()) return;
              var k = t.pop();
              this._promiseFulfilled(u[k], k);
            }
          }, _.prototype._filter = function(t, n) {
            for (var u = n.length, k = new Array(u), R = 0, j = 0; j < u; ++j)
              t[j] && (k[R++] = n[j]);
            k.length = R, this._resolve(k);
          }, _.prototype.preservedValues = function() {
            return this._preservedValues;
          };
          function i(t, n, u, k) {
            if (typeof n != "function")
              return r("expecting a function but got " + p.classString(n));
            var R = 0;
            if (u !== void 0)
              if (typeof u == "object" && u !== null) {
                if (typeof u.concurrency != "number")
                  return e.reject(
                    new TypeError("'concurrency' must be a number but it is " + p.classString(u.concurrency))
                  );
                R = u.concurrency;
              } else
                return e.reject(new TypeError(
                  "options argument must be an object but it is " + p.classString(u)
                ));
            return R = typeof R == "number" && isFinite(R) && R >= 1 ? R : 0, new _(t, n, R, k).promise();
          }
          e.prototype.map = function(t, n) {
            return i(this, t, n, null);
          }, e.map = function(t, n, u, k) {
            return i(t, n, u, k);
          };
        };
      }, { "./util": 36 }], 19: [function(c, S, v) {
        S.exports = function(e, s, r, f, g) {
          var E = c("./util"), p = E.tryCatch;
          e.method = function(y) {
            if (typeof y != "function")
              throw new e.TypeError("expecting a function but got " + E.classString(y));
            return function() {
              var d = new e(s);
              d._captureStackTrace(), d._pushContext();
              var w = p(y).apply(this, arguments), _ = d._popContext();
              return g.checkForgottenReturns(
                w,
                _,
                "Promise.method",
                d
              ), d._resolveFromSyncValue(w), d;
            };
          }, e.attempt = e.try = function(y) {
            if (typeof y != "function")
              return f("expecting a function but got " + E.classString(y));
            var d = new e(s);
            d._captureStackTrace(), d._pushContext();
            var w;
            if (arguments.length > 1) {
              g.deprecated("calling Promise.try with more than 1 argument");
              var _ = arguments[1], i = arguments[2];
              w = E.isArray(_) ? p(y).apply(i, _) : p(y).call(i, _);
            } else
              w = p(y)();
            var t = d._popContext();
            return g.checkForgottenReturns(
              w,
              t,
              "Promise.try",
              d
            ), d._resolveFromSyncValue(w), d;
          }, e.prototype._resolveFromSyncValue = function(y) {
            y === E.errorObj ? this._rejectCallback(y.e, !1) : this._resolveCallback(y, !0);
          };
        };
      }, { "./util": 36 }], 20: [function(c, S, v) {
        var e = c("./util"), s = e.maybeWrapAsError, r = c("./errors"), f = r.OperationalError, g = c("./es5");
        function E(w) {
          return w instanceof Error && g.getPrototypeOf(w) === Error.prototype;
        }
        var p = /^(?:name|message|stack|cause)$/;
        function y(w) {
          var _;
          if (E(w)) {
            _ = new f(w), _.name = w.name, _.message = w.message, _.stack = w.stack;
            for (var i = g.keys(w), t = 0; t < i.length; ++t) {
              var n = i[t];
              p.test(n) || (_[n] = w[n]);
            }
            return _;
          }
          return e.markAsOriginatingFromRejection(w), w;
        }
        function d(w, _) {
          return function(i, t) {
            if (w !== null) {
              if (i) {
                var n = y(s(i));
                w._attachExtraTrace(n), w._reject(n);
              } else if (!_)
                w._fulfill(t);
              else {
                var u = [].slice.call(arguments, 1);
                w._fulfill(u);
              }
              w = null;
            }
          };
        }
        S.exports = d;
      }, { "./errors": 12, "./es5": 13, "./util": 36 }], 21: [function(c, S, v) {
        S.exports = function(e) {
          var s = c("./util"), r = e._async, f = s.tryCatch, g = s.errorObj;
          function E(d, w) {
            var _ = this;
            if (!s.isArray(d)) return p.call(_, d, w);
            var i = f(w).apply(_._boundValue(), [null].concat(d));
            i === g && r.throwLater(i.e);
          }
          function p(d, w) {
            var _ = this, i = _._boundValue(), t = d === void 0 ? f(w).call(i, null) : f(w).call(i, null, d);
            t === g && r.throwLater(t.e);
          }
          function y(d, w) {
            var _ = this;
            if (!d) {
              var i = new Error(d + "");
              i.cause = d, d = i;
            }
            var t = f(w).call(_._boundValue(), d);
            t === g && r.throwLater(t.e);
          }
          e.prototype.asCallback = e.prototype.nodeify = function(d, w) {
            if (typeof d == "function") {
              var _ = p;
              w !== void 0 && Object(w).spread && (_ = E), this._then(
                _,
                y,
                void 0,
                this,
                d
              );
            }
            return this;
          };
        };
      }, { "./util": 36 }], 22: [function(c, S, v) {
        S.exports = function() {
          var e = function() {
            return new U(`circular promise resolution chain

    See http://goo.gl/MqrFmX
`);
          }, s = function() {
            return new D.PromiseInspection(this._target());
          }, r = function(h) {
            return D.reject(new U(h));
          };
          function f() {
          }
          var g = {}, E = c("./util");
          E.setReflectHandler(s);
          var p = function() {
            var h = process.domain;
            return h === void 0 ? null : h;
          }, y = function() {
            return null;
          }, d = function() {
            return {
              domain: p(),
              async: null
            };
          }, w = E.isNode && E.nodeSupportsAsyncResource ? c("async_hooks").AsyncResource : null, _ = function() {
            return {
              domain: p(),
              async: new w("Bluebird::Promise")
            };
          }, i = E.isNode ? d : y;
          E.notEnumerableProp(D, "_getContext", i);
          var t = function() {
            i = _, E.notEnumerableProp(D, "_getContext", _);
          }, n = function() {
            i = d, E.notEnumerableProp(D, "_getContext", d);
          }, u = c("./es5"), k = c("./async"), R = new k();
          u.defineProperty(D, "_async", { value: R });
          var j = c("./errors"), U = D.TypeError = j.TypeError;
          D.RangeError = j.RangeError;
          var M = D.CancellationError = j.CancellationError;
          D.TimeoutError = j.TimeoutError, D.OperationalError = j.OperationalError, D.RejectionError = j.OperationalError, D.AggregateError = j.AggregateError;
          var Z = function() {
          }, q = {}, Q = {}, re = c("./thenables")(D, Z), H = c("./promise_array")(
            D,
            Z,
            re,
            r,
            f
          ), te = c("./context")(D), ue = te.create, fe = c("./debuggability")(
            D,
            te,
            t,
            n
          );
          fe.CapturedTrace;
          var W = c("./finally")(D, re, Q), B = c("./catch_filter")(Q), Y = c("./nodeback"), C = E.errorObj, G = E.tryCatch;
          function ne(h, a) {
            if (h == null || h.constructor !== D)
              throw new U(`the promise constructor cannot be invoked directly

    See http://goo.gl/MqrFmX
`);
            if (typeof a != "function")
              throw new U("expecting a function but got " + E.classString(a));
          }
          function D(h) {
            h !== Z && ne(this, h), this._bitField = 0, this._fulfillmentHandler0 = void 0, this._rejectionHandler0 = void 0, this._promise0 = void 0, this._receiver0 = void 0, this._resolveFromExecutor(h), this._promiseCreated(), this._fireEvent("promiseCreated", this);
          }
          D.prototype.toString = function() {
            return "[object Promise]";
          }, D.prototype.caught = D.prototype.catch = function(h) {
            var a = arguments.length;
            if (a > 1) {
              var T = new Array(a - 1), N = 0, J;
              for (J = 0; J < a - 1; ++J) {
                var $ = arguments[J];
                if (E.isObject($))
                  T[N++] = $;
                else
                  return r("Catch statement predicate: expecting an object but got " + E.classString($));
              }
              if (T.length = N, h = arguments[J], typeof h != "function")
                throw new U("The last argument to .catch() must be a function, got " + E.toString(h));
              return this.then(void 0, B(T, h, this));
            }
            return this.then(void 0, h);
          }, D.prototype.reflect = function() {
            return this._then(
              s,
              s,
              void 0,
              this,
              void 0
            );
          }, D.prototype.then = function(h, a) {
            if (fe.warnings() && arguments.length > 0 && typeof h != "function" && typeof a != "function") {
              var T = ".then() only accepts functions but was passed: " + E.classString(h);
              arguments.length > 1 && (T += ", " + E.classString(a)), this._warn(T);
            }
            return this._then(h, a, void 0, void 0, void 0);
          }, D.prototype.done = function(h, a) {
            var T = this._then(h, a, void 0, void 0, void 0);
            T._setIsFinal();
          }, D.prototype.spread = function(h) {
            return typeof h != "function" ? r("expecting a function but got " + E.classString(h)) : this.all()._then(h, void 0, void 0, q, void 0);
          }, D.prototype.toJSON = function() {
            var h = {
              isFulfilled: !1,
              isRejected: !1,
              fulfillmentValue: void 0,
              rejectionReason: void 0
            };
            return this.isFulfilled() ? (h.fulfillmentValue = this.value(), h.isFulfilled = !0) : this.isRejected() && (h.rejectionReason = this.reason(), h.isRejected = !0), h;
          }, D.prototype.all = function() {
            return arguments.length > 0 && this._warn(".all() was passed arguments but it does not take any"), new H(this).promise();
          }, D.prototype.error = function(h) {
            return this.caught(E.originatesFromRejection, h);
          }, D.getNewLibraryCopy = S.exports, D.is = function(h) {
            return h instanceof D;
          }, D.fromNode = D.fromCallback = function(h) {
            var a = new D(Z);
            a._captureStackTrace();
            var T = arguments.length > 1 ? !!Object(arguments[1]).multiArgs : !1, N = G(h)(Y(a, T));
            return N === C && a._rejectCallback(N.e, !0), a._isFateSealed() || a._setAsyncGuaranteed(), a;
          }, D.all = function(h) {
            return new H(h).promise();
          }, D.cast = function(h) {
            var a = re(h);
            return a instanceof D || (a = new D(Z), a._captureStackTrace(), a._setFulfilled(), a._rejectionHandler0 = h), a;
          }, D.resolve = D.fulfilled = D.cast, D.reject = D.rejected = function(h) {
            var a = new D(Z);
            return a._captureStackTrace(), a._rejectCallback(h, !0), a;
          }, D.setScheduler = function(h) {
            if (typeof h != "function")
              throw new U("expecting a function but got " + E.classString(h));
            return R.setScheduler(h);
          }, D.prototype._then = function(h, a, T, N, J) {
            var $ = J !== void 0, F = $ ? J : new D(Z), P = this._target(), X = P._bitField;
            $ || (F._propagateFrom(this, 3), F._captureStackTrace(), N === void 0 && (this._bitField & 2097152) !== 0 && ((X & 50397184) !== 0 ? N = this._boundValue() : N = P === this ? void 0 : this._boundTo), this._fireEvent("promiseChained", this, F));
            var pe = i();
            if ((X & 50397184) !== 0) {
              var de, ce, z = P._settlePromiseCtx;
              (X & 33554432) !== 0 ? (ce = P._rejectionHandler0, de = h) : (X & 16777216) !== 0 ? (ce = P._fulfillmentHandler0, de = a, P._unsetRejectionIsUnhandled()) : (z = P._settlePromiseLateCancellationObserver, ce = new M("late cancellation observer"), P._attachExtraTrace(ce), de = a), R.invoke(z, P, {
                handler: E.contextBind(pe, de),
                promise: F,
                receiver: N,
                value: ce
              });
            } else
              P._addCallbacks(
                h,
                a,
                F,
                N,
                pe
              );
            return F;
          }, D.prototype._length = function() {
            return this._bitField & 65535;
          }, D.prototype._isFateSealed = function() {
            return (this._bitField & 117506048) !== 0;
          }, D.prototype._isFollowing = function() {
            return (this._bitField & 67108864) === 67108864;
          }, D.prototype._setLength = function(h) {
            this._bitField = this._bitField & -65536 | h & 65535;
          }, D.prototype._setFulfilled = function() {
            this._bitField = this._bitField | 33554432, this._fireEvent("promiseFulfilled", this);
          }, D.prototype._setRejected = function() {
            this._bitField = this._bitField | 16777216, this._fireEvent("promiseRejected", this);
          }, D.prototype._setFollowing = function() {
            this._bitField = this._bitField | 67108864, this._fireEvent("promiseResolved", this);
          }, D.prototype._setIsFinal = function() {
            this._bitField = this._bitField | 4194304;
          }, D.prototype._isFinal = function() {
            return (this._bitField & 4194304) > 0;
          }, D.prototype._unsetCancelled = function() {
            this._bitField = this._bitField & -65537;
          }, D.prototype._setCancelled = function() {
            this._bitField = this._bitField | 65536, this._fireEvent("promiseCancelled", this);
          }, D.prototype._setWillBeCancelled = function() {
            this._bitField = this._bitField | 8388608;
          }, D.prototype._setAsyncGuaranteed = function() {
            if (!R.hasCustomScheduler()) {
              var h = this._bitField;
              this._bitField = h | (h & 536870912) >> 2 ^ 134217728;
            }
          }, D.prototype._setNoAsyncGuarantee = function() {
            this._bitField = (this._bitField | 536870912) & -134217729;
          }, D.prototype._receiverAt = function(h) {
            var a = h === 0 ? this._receiver0 : this[h * 4 - 4 + 3];
            if (a !== g)
              return a === void 0 && this._isBound() ? this._boundValue() : a;
          }, D.prototype._promiseAt = function(h) {
            return this[h * 4 - 4 + 2];
          }, D.prototype._fulfillmentHandlerAt = function(h) {
            return this[h * 4 - 4 + 0];
          }, D.prototype._rejectionHandlerAt = function(h) {
            return this[h * 4 - 4 + 1];
          }, D.prototype._boundValue = function() {
          }, D.prototype._migrateCallback0 = function(h) {
            h._bitField;
            var a = h._fulfillmentHandler0, T = h._rejectionHandler0, N = h._promise0, J = h._receiverAt(0);
            J === void 0 && (J = g), this._addCallbacks(a, T, N, J, null);
          }, D.prototype._migrateCallbackAt = function(h, a) {
            var T = h._fulfillmentHandlerAt(a), N = h._rejectionHandlerAt(a), J = h._promiseAt(a), $ = h._receiverAt(a);
            $ === void 0 && ($ = g), this._addCallbacks(T, N, J, $, null);
          }, D.prototype._addCallbacks = function(h, a, T, N, J) {
            var $ = this._length();
            if ($ >= 65531 && ($ = 0, this._setLength(0)), $ === 0)
              this._promise0 = T, this._receiver0 = N, typeof h == "function" && (this._fulfillmentHandler0 = E.contextBind(J, h)), typeof a == "function" && (this._rejectionHandler0 = E.contextBind(J, a));
            else {
              var F = $ * 4 - 4;
              this[F + 2] = T, this[F + 3] = N, typeof h == "function" && (this[F + 0] = E.contextBind(J, h)), typeof a == "function" && (this[F + 1] = E.contextBind(J, a));
            }
            return this._setLength($ + 1), $;
          }, D.prototype._proxy = function(h, a) {
            this._addCallbacks(void 0, void 0, a, h, null);
          }, D.prototype._resolveCallback = function(h, a) {
            if ((this._bitField & 117506048) === 0) {
              if (h === this)
                return this._rejectCallback(e(), !1);
              var T = re(h, this);
              if (!(T instanceof D)) return this._fulfill(h);
              a && this._propagateFrom(T, 2);
              var N = T._target();
              if (N === this) {
                this._reject(e());
                return;
              }
              var J = N._bitField;
              if ((J & 50397184) === 0) {
                var $ = this._length();
                $ > 0 && N._migrateCallback0(this);
                for (var F = 1; F < $; ++F)
                  N._migrateCallbackAt(this, F);
                this._setFollowing(), this._setLength(0), this._setFollowee(T);
              } else if ((J & 33554432) !== 0)
                this._fulfill(N._value());
              else if ((J & 16777216) !== 0)
                this._reject(N._reason());
              else {
                var P = new M("late cancellation observer");
                N._attachExtraTrace(P), this._reject(P);
              }
            }
          }, D.prototype._rejectCallback = function(h, a, T) {
            var N = E.ensureErrorObject(h), J = N === h;
            if (!J && !T && fe.warnings()) {
              var $ = "a promise was rejected with a non-error: " + E.classString(h);
              this._warn($, !0);
            }
            this._attachExtraTrace(N, a ? J : !1), this._reject(h);
          }, D.prototype._resolveFromExecutor = function(h) {
            if (h !== Z) {
              var a = this;
              this._captureStackTrace(), this._pushContext();
              var T = !0, N = this._execute(h, function(J) {
                a._resolveCallback(J);
              }, function(J) {
                a._rejectCallback(J, T);
              });
              T = !1, this._popContext(), N !== void 0 && a._rejectCallback(N, !0);
            }
          }, D.prototype._settlePromiseFromHandler = function(h, a, T, N) {
            var J = N._bitField;
            if ((J & 65536) === 0) {
              N._pushContext();
              var $;
              a === q ? !T || typeof T.length != "number" ? ($ = C, $.e = new U("cannot .spread() a non-array: " + E.classString(T))) : $ = G(h).apply(this._boundValue(), T) : $ = G(h).call(a, T);
              var F = N._popContext();
              J = N._bitField, (J & 65536) === 0 && ($ === Q ? N._reject(T) : $ === C ? N._rejectCallback($.e, !1) : (fe.checkForgottenReturns($, F, "", N, this), N._resolveCallback($)));
            }
          }, D.prototype._target = function() {
            for (var h = this; h._isFollowing(); ) h = h._followee();
            return h;
          }, D.prototype._followee = function() {
            return this._rejectionHandler0;
          }, D.prototype._setFollowee = function(h) {
            this._rejectionHandler0 = h;
          }, D.prototype._settlePromise = function(h, a, T, N) {
            var J = h instanceof D, $ = this._bitField, F = ($ & 134217728) !== 0;
            ($ & 65536) !== 0 ? (J && h._invokeInternalOnCancel(), T instanceof W && T.isFinallyHandler() ? (T.cancelPromise = h, G(a).call(T, N) === C && h._reject(C.e)) : a === s ? h._fulfill(s.call(T)) : T instanceof f ? T._promiseCancelled(h) : J || h instanceof H ? h._cancel() : T.cancel()) : typeof a == "function" ? J ? (F && h._setAsyncGuaranteed(), this._settlePromiseFromHandler(a, T, N, h)) : a.call(T, N, h) : T instanceof f ? T._isResolved() || (($ & 33554432) !== 0 ? T._promiseFulfilled(N, h) : T._promiseRejected(N, h)) : J && (F && h._setAsyncGuaranteed(), ($ & 33554432) !== 0 ? h._fulfill(N) : h._reject(N));
          }, D.prototype._settlePromiseLateCancellationObserver = function(h) {
            var a = h.handler, T = h.promise, N = h.receiver, J = h.value;
            typeof a == "function" ? T instanceof D ? this._settlePromiseFromHandler(a, N, J, T) : a.call(N, J, T) : T instanceof D && T._reject(J);
          }, D.prototype._settlePromiseCtx = function(h) {
            this._settlePromise(h.promise, h.handler, h.receiver, h.value);
          }, D.prototype._settlePromise0 = function(h, a, T) {
            var N = this._promise0, J = this._receiverAt(0);
            this._promise0 = void 0, this._receiver0 = void 0, this._settlePromise(N, h, J, a);
          }, D.prototype._clearCallbackDataAtIndex = function(h) {
            var a = h * 4 - 4;
            this[a + 2] = this[a + 3] = this[a + 0] = this[a + 1] = void 0;
          }, D.prototype._fulfill = function(h) {
            var a = this._bitField;
            if (!((a & 117506048) >>> 16)) {
              if (h === this) {
                var T = e();
                return this._attachExtraTrace(T), this._reject(T);
              }
              this._setFulfilled(), this._rejectionHandler0 = h, (a & 65535) > 0 && ((a & 134217728) !== 0 ? this._settlePromises() : R.settlePromises(this), this._dereferenceTrace());
            }
          }, D.prototype._reject = function(h) {
            var a = this._bitField;
            if (!((a & 117506048) >>> 16)) {
              if (this._setRejected(), this._fulfillmentHandler0 = h, this._isFinal())
                return R.fatalError(h, E.isNode);
              (a & 65535) > 0 ? R.settlePromises(this) : this._ensurePossibleRejectionHandled();
            }
          }, D.prototype._fulfillPromises = function(h, a) {
            for (var T = 1; T < h; T++) {
              var N = this._fulfillmentHandlerAt(T), J = this._promiseAt(T), $ = this._receiverAt(T);
              this._clearCallbackDataAtIndex(T), this._settlePromise(J, N, $, a);
            }
          }, D.prototype._rejectPromises = function(h, a) {
            for (var T = 1; T < h; T++) {
              var N = this._rejectionHandlerAt(T), J = this._promiseAt(T), $ = this._receiverAt(T);
              this._clearCallbackDataAtIndex(T), this._settlePromise(J, N, $, a);
            }
          }, D.prototype._settlePromises = function() {
            var h = this._bitField, a = h & 65535;
            if (a > 0) {
              if ((h & 16842752) !== 0) {
                var T = this._fulfillmentHandler0;
                this._settlePromise0(this._rejectionHandler0, T, h), this._rejectPromises(a, T);
              } else {
                var N = this._rejectionHandler0;
                this._settlePromise0(this._fulfillmentHandler0, N, h), this._fulfillPromises(a, N);
              }
              this._setLength(0);
            }
            this._clearCancellationData();
          }, D.prototype._settledValue = function() {
            var h = this._bitField;
            if ((h & 33554432) !== 0)
              return this._rejectionHandler0;
            if ((h & 16777216) !== 0)
              return this._fulfillmentHandler0;
          }, typeof Symbol < "u" && Symbol.toStringTag && u.defineProperty(D.prototype, Symbol.toStringTag, {
            get: function() {
              return "Object";
            }
          });
          function he(h) {
            this.promise._resolveCallback(h);
          }
          function se(h) {
            this.promise._rejectCallback(h, !1);
          }
          D.defer = D.pending = function() {
            fe.deprecated("Promise.defer", "new Promise");
            var h = new D(Z);
            return {
              promise: h,
              resolve: he,
              reject: se
            };
          }, E.notEnumerableProp(
            D,
            "_makeSelfResolutionError",
            e
          ), c("./method")(
            D,
            Z,
            re,
            r,
            fe
          ), c("./bind")(D, Z, re, fe), c("./cancel")(D, H, r, fe), c("./direct_resolve")(D), c("./synchronous_inspection")(D), c("./join")(
            D,
            H,
            re,
            Z,
            R
          ), D.Promise = D, D.version = "3.7.2", c("./call_get.js")(D), c("./generators.js")(D, r, Z, re, f, fe), c("./map.js")(D, H, r, re, Z, fe), c("./nodeify.js")(D), c("./promisify.js")(D, Z), c("./props.js")(D, H, re, r), c("./race.js")(D, Z, re, r), c("./reduce.js")(D, H, r, re, Z, fe), c("./settle.js")(D, H, fe), c("./some.js")(D, H, r), c("./timers.js")(D, Z, fe), c("./using.js")(D, r, re, ue, Z, fe), c("./any.js")(D), c("./each.js")(D, Z), c("./filter.js")(D, Z), E.toFastProperties(D), E.toFastProperties(D.prototype);
          function _e(h) {
            var a = new D(Z);
            a._fulfillmentHandler0 = h, a._rejectionHandler0 = h, a._promise0 = h, a._receiver0 = h;
          }
          return _e({ a: 1 }), _e({ b: 2 }), _e({ c: 3 }), _e(1), _e(function() {
          }), _e(void 0), _e(!1), _e(new D(Z)), fe.setBounds(k.firstLineError, E.lastLineError), D;
        };
      }, { "./any.js": 1, "./async": 2, "./bind": 3, "./call_get.js": 5, "./cancel": 6, "./catch_filter": 7, "./context": 8, "./debuggability": 9, "./direct_resolve": 10, "./each.js": 11, "./errors": 12, "./es5": 13, "./filter.js": 14, "./finally": 15, "./generators.js": 16, "./join": 17, "./map.js": 18, "./method": 19, "./nodeback": 20, "./nodeify.js": 21, "./promise_array": 23, "./promisify.js": 24, "./props.js": 25, "./race.js": 27, "./reduce.js": 28, "./settle.js": 30, "./some.js": 31, "./synchronous_inspection": 32, "./thenables": 33, "./timers.js": 34, "./using.js": 35, "./util": 36, async_hooks: void 0 }], 23: [function(c, S, v) {
        S.exports = function(e, s, r, f, g) {
          var E = c("./util");
          E.isArray;
          function p(d) {
            switch (d) {
              case -2:
                return [];
              case -3:
                return {};
              case -6:
                return /* @__PURE__ */ new Map();
            }
          }
          function y(d) {
            var w = this._promise = new e(s);
            d instanceof e && (w._propagateFrom(d, 3), d.suppressUnhandledRejections()), w._setOnCancel(this), this._values = d, this._length = 0, this._totalResolved = 0, this._init(void 0, -2);
          }
          return E.inherits(y, g), y.prototype.length = function() {
            return this._length;
          }, y.prototype.promise = function() {
            return this._promise;
          }, y.prototype._init = function d(w, _) {
            var i = r(this._values, this._promise);
            if (i instanceof e) {
              i = i._target();
              var t = i._bitField;
              if (this._values = i, (t & 50397184) === 0)
                return this._promise._setAsyncGuaranteed(), i._then(
                  d,
                  this._reject,
                  void 0,
                  this,
                  _
                );
              if ((t & 33554432) !== 0)
                i = i._value();
              else return (t & 16777216) !== 0 ? this._reject(i._reason()) : this._cancel();
            }
            if (i = E.asArray(i), i === null) {
              var n = f(
                "expecting an array or an iterable object but got " + E.classString(i)
              ).reason();
              this._promise._rejectCallback(n, !1);
              return;
            }
            if (i.length === 0) {
              _ === -5 ? this._resolveEmptyArray() : this._resolve(p(_));
              return;
            }
            this._iterate(i);
          }, y.prototype._iterate = function(d) {
            var w = this.getActualLength(d.length);
            this._length = w, this._values = this.shouldCopyValues() ? new Array(w) : this._values;
            for (var _ = this._promise, i = !1, t = null, n = 0; n < w; ++n) {
              var u = r(d[n], _);
              u instanceof e ? (u = u._target(), t = u._bitField) : t = null, i ? t !== null && u.suppressUnhandledRejections() : t !== null ? (t & 50397184) === 0 ? (u._proxy(this, n), this._values[n] = u) : (t & 33554432) !== 0 ? i = this._promiseFulfilled(u._value(), n) : (t & 16777216) !== 0 ? i = this._promiseRejected(u._reason(), n) : i = this._promiseCancelled(n) : i = this._promiseFulfilled(u, n);
            }
            i || _._setAsyncGuaranteed();
          }, y.prototype._isResolved = function() {
            return this._values === null;
          }, y.prototype._resolve = function(d) {
            this._values = null, this._promise._fulfill(d);
          }, y.prototype._cancel = function() {
            this._isResolved() || !this._promise._isCancellable() || (this._values = null, this._promise._cancel());
          }, y.prototype._reject = function(d) {
            this._values = null, this._promise._rejectCallback(d, !1);
          }, y.prototype._promiseFulfilled = function(d, w) {
            this._values[w] = d;
            var _ = ++this._totalResolved;
            return _ >= this._length ? (this._resolve(this._values), !0) : !1;
          }, y.prototype._promiseCancelled = function() {
            return this._cancel(), !0;
          }, y.prototype._promiseRejected = function(d) {
            return this._totalResolved++, this._reject(d), !0;
          }, y.prototype._resultCancelled = function() {
            if (!this._isResolved()) {
              var d = this._values;
              if (this._cancel(), d instanceof e)
                d.cancel();
              else
                for (var w = 0; w < d.length; ++w)
                  d[w] instanceof e && d[w].cancel();
            }
          }, y.prototype.shouldCopyValues = function() {
            return !0;
          }, y.prototype.getActualLength = function(d) {
            return d;
          }, y;
        };
      }, { "./util": 36 }], 24: [function(c, S, v) {
        S.exports = function(e, s) {
          var r = {}, f = c("./util"), g = c("./nodeback"), E = f.withAppended, p = f.maybeWrapAsError, y = f.canEvaluate, d = c("./errors").TypeError, w = "Async", _ = { __isPromisified__: !0 }, i = [
            "arity",
            "length",
            "name",
            "arguments",
            "caller",
            "callee",
            "prototype",
            "__isPromisified__"
          ], t = new RegExp("^(?:" + i.join("|") + ")$"), n = function(te) {
            return f.isIdentifier(te) && te.charAt(0) !== "_" && te !== "constructor";
          };
          function u(te) {
            return !t.test(te);
          }
          function k(te) {
            try {
              return te.__isPromisified__ === !0;
            } catch {
              return !1;
            }
          }
          function R(te, ue, fe) {
            var W = f.getDataPropertyOrDefault(
              te,
              ue + fe,
              _
            );
            return W ? k(W) : !1;
          }
          function j(te, ue, fe) {
            for (var W = 0; W < te.length; W += 2) {
              var B = te[W];
              if (fe.test(B)) {
                for (var Y = B.replace(fe, ""), C = 0; C < te.length; C += 2)
                  if (te[C] === Y)
                    throw new d(`Cannot promisify an API that has normal methods with '%s'-suffix

    See http://goo.gl/MqrFmX
`.replace("%s", ue));
              }
            }
          }
          function U(te, ue, fe, W) {
            for (var B = f.inheritedDataKeys(te), Y = [], C = 0; C < B.length; ++C) {
              var G = B[C], ne = te[G], D = W === n ? !0 : n(G);
              typeof ne == "function" && !k(ne) && !R(te, G, ue) && W(G, ne, te, D) && Y.push(G, ne);
            }
            return j(Y, ue, fe), Y;
          }
          var M = function(te) {
            return te.replace(/([$])/, "\\$");
          }, Z;
          function q(te, ue, fe, W, B, Y) {
            var C = /* @__PURE__ */ (function() {
              return this;
            })(), G = te;
            typeof G == "string" && (te = W);
            function ne() {
              var D = ue;
              ue === r && (D = this);
              var he = new e(s);
              he._captureStackTrace();
              var se = typeof G == "string" && this !== C ? this[G] : te, _e = g(he, Y);
              try {
                se.apply(D, E(arguments, _e));
              } catch (h) {
                he._rejectCallback(p(h), !0, !0);
              }
              return he._isFateSealed() || he._setAsyncGuaranteed(), he;
            }
            return f.notEnumerableProp(ne, "__isPromisified__", !0), ne;
          }
          var Q = y ? Z : q;
          function re(te, ue, fe, W, B) {
            for (var Y = new RegExp(M(ue) + "$"), C = U(te, ue, Y, fe), G = 0, ne = C.length; G < ne; G += 2) {
              var D = C[G], he = C[G + 1], se = D + ue;
              if (W === Q)
                te[se] = Q(D, r, D, he, ue, B);
              else {
                var _e = W(he, function() {
                  return Q(
                    D,
                    r,
                    D,
                    he,
                    ue,
                    B
                  );
                });
                f.notEnumerableProp(_e, "__isPromisified__", !0), te[se] = _e;
              }
            }
            return f.toFastProperties(te), te;
          }
          function H(te, ue, fe) {
            return Q(
              te,
              ue,
              void 0,
              te,
              null,
              fe
            );
          }
          e.promisify = function(te, ue) {
            if (typeof te != "function")
              throw new d("expecting a function but got " + f.classString(te));
            if (k(te))
              return te;
            ue = Object(ue);
            var fe = ue.context === void 0 ? r : ue.context, W = !!ue.multiArgs, B = H(te, fe, W);
            return f.copyDescriptors(te, B, u), B;
          }, e.promisifyAll = function(te, ue) {
            if (typeof te != "function" && typeof te != "object")
              throw new d(`the target of promisifyAll must be an object or a function

    See http://goo.gl/MqrFmX
`);
            ue = Object(ue);
            var fe = !!ue.multiArgs, W = ue.suffix;
            typeof W != "string" && (W = w);
            var B = ue.filter;
            typeof B != "function" && (B = n);
            var Y = ue.promisifier;
            if (typeof Y != "function" && (Y = Q), !f.isIdentifier(W))
              throw new RangeError(`suffix must be a valid identifier

    See http://goo.gl/MqrFmX
`);
            for (var C = f.inheritedDataKeys(te), G = 0; G < C.length; ++G) {
              var ne = te[C[G]];
              C[G] !== "constructor" && f.isClass(ne) && (re(
                ne.prototype,
                W,
                B,
                Y,
                fe
              ), re(ne, W, B, Y, fe));
            }
            return re(te, W, B, Y, fe);
          };
        };
      }, { "./errors": 12, "./nodeback": 20, "./util": 36 }], 25: [function(c, S, v) {
        S.exports = function(e, s, r, f) {
          var g = c("./util"), E = g.isObject, p = c("./es5"), y;
          typeof Map == "function" && (y = Map);
          var d = /* @__PURE__ */ (function() {
            var t = 0, n = 0;
            function u(k, R) {
              this[t] = k, this[t + n] = R, t++;
            }
            return function(R) {
              n = R.size, t = 0;
              var j = new Array(R.size * 2);
              return R.forEach(u, j), j;
            };
          })(), w = function(t) {
            for (var n = new y(), u = t.length / 2 | 0, k = 0; k < u; ++k) {
              var R = t[u + k], j = t[k];
              n.set(R, j);
            }
            return n;
          };
          function _(t) {
            var n = !1, u;
            if (y !== void 0 && t instanceof y)
              u = d(t), n = !0;
            else {
              var k = p.keys(t), R = k.length;
              u = new Array(R * 2);
              for (var j = 0; j < R; ++j) {
                var U = k[j];
                u[j] = t[U], u[j + R] = U;
              }
            }
            this.constructor$(u), this._isMap = n, this._init$(void 0, n ? -6 : -3);
          }
          g.inherits(_, s), _.prototype._init = function() {
          }, _.prototype._promiseFulfilled = function(t, n) {
            this._values[n] = t;
            var u = ++this._totalResolved;
            if (u >= this._length) {
              var k;
              if (this._isMap)
                k = w(this._values);
              else {
                k = {};
                for (var R = this.length(), j = 0, U = this.length(); j < U; ++j)
                  k[this._values[j + R]] = this._values[j];
              }
              return this._resolve(k), !0;
            }
            return !1;
          }, _.prototype.shouldCopyValues = function() {
            return !1;
          }, _.prototype.getActualLength = function(t) {
            return t >> 1;
          };
          function i(t) {
            var n, u = r(t);
            if (E(u))
              u instanceof e ? n = u._then(
                e.props,
                void 0,
                void 0,
                void 0,
                void 0
              ) : n = new _(u).promise();
            else return f(`cannot await properties of a non-object

    See http://goo.gl/MqrFmX
`);
            return u instanceof e && n._propagateFrom(u, 2), n;
          }
          e.prototype.props = function() {
            return i(this);
          }, e.props = function(t) {
            return i(t);
          };
        };
      }, { "./es5": 13, "./util": 36 }], 26: [function(c, S, v) {
        function e(r, f, g, E, p) {
          for (var y = 0; y < p; ++y)
            g[y + E] = r[y + f], r[y + f] = void 0;
        }
        function s(r) {
          this._capacity = r, this._length = 0, this._front = 0;
        }
        s.prototype._willBeOverCapacity = function(r) {
          return this._capacity < r;
        }, s.prototype._pushOne = function(r) {
          var f = this.length();
          this._checkCapacity(f + 1);
          var g = this._front + f & this._capacity - 1;
          this[g] = r, this._length = f + 1;
        }, s.prototype.push = function(r, f, g) {
          var E = this.length() + 3;
          if (this._willBeOverCapacity(E)) {
            this._pushOne(r), this._pushOne(f), this._pushOne(g);
            return;
          }
          var p = this._front + E - 3;
          this._checkCapacity(E);
          var y = this._capacity - 1;
          this[p + 0 & y] = r, this[p + 1 & y] = f, this[p + 2 & y] = g, this._length = E;
        }, s.prototype.shift = function() {
          var r = this._front, f = this[r];
          return this[r] = void 0, this._front = r + 1 & this._capacity - 1, this._length--, f;
        }, s.prototype.length = function() {
          return this._length;
        }, s.prototype._checkCapacity = function(r) {
          this._capacity < r && this._resizeTo(this._capacity << 1);
        }, s.prototype._resizeTo = function(r) {
          var f = this._capacity;
          this._capacity = r;
          var g = this._front, E = this._length, p = g + E & f - 1;
          e(this, 0, this, f, p);
        }, S.exports = s;
      }, {}], 27: [function(c, S, v) {
        S.exports = function(e, s, r, f) {
          var g = c("./util"), E = function(y) {
            return y.then(function(d) {
              return p(d, y);
            });
          };
          function p(y, d) {
            var w = r(y);
            if (w instanceof e)
              return E(w);
            if (y = g.asArray(y), y === null)
              return f("expecting an array or an iterable object but got " + g.classString(y));
            var _ = new e(s);
            d !== void 0 && _._propagateFrom(d, 3);
            for (var i = _._fulfill, t = _._reject, n = 0, u = y.length; n < u; ++n) {
              var k = y[n];
              k === void 0 && !(n in y) || e.cast(k)._then(i, t, void 0, _, null);
            }
            return _;
          }
          e.race = function(y) {
            return p(y, void 0);
          }, e.prototype.race = function() {
            return p(this, void 0);
          };
        };
      }, { "./util": 36 }], 28: [function(c, S, v) {
        S.exports = function(e, s, r, f, g, E) {
          var p = c("./util"), y = p.tryCatch;
          function d(n, u, k, R) {
            this.constructor$(n);
            var j = e._getContext();
            this._fn = p.contextBind(j, u), k !== void 0 && (k = e.resolve(k), k._attachCancellationCallback(this)), this._initialValue = k, this._currentCancellable = null, R === g ? this._eachValues = Array(this._length) : R === 0 ? this._eachValues = null : this._eachValues = void 0, this._promise._captureStackTrace(), this._init$(void 0, -5);
          }
          p.inherits(d, s), d.prototype._gotAccum = function(n) {
            this._eachValues !== void 0 && this._eachValues !== null && n !== g && this._eachValues.push(n);
          }, d.prototype._eachComplete = function(n) {
            return this._eachValues !== null && this._eachValues.push(n), this._eachValues;
          }, d.prototype._init = function() {
          }, d.prototype._resolveEmptyArray = function() {
            this._resolve(this._eachValues !== void 0 ? this._eachValues : this._initialValue);
          }, d.prototype.shouldCopyValues = function() {
            return !1;
          }, d.prototype._resolve = function(n) {
            this._promise._resolveCallback(n), this._values = null;
          }, d.prototype._resultCancelled = function(n) {
            if (n === this._initialValue) return this._cancel();
            this._isResolved() || (this._resultCancelled$(), this._currentCancellable instanceof e && this._currentCancellable.cancel(), this._initialValue instanceof e && this._initialValue.cancel());
          }, d.prototype._iterate = function(n) {
            this._values = n;
            var u, k, R = n.length;
            this._initialValue !== void 0 ? (u = this._initialValue, k = 0) : (u = e.resolve(n[0]), k = 1), this._currentCancellable = u;
            for (var j = k; j < R; ++j) {
              var U = n[j];
              U instanceof e && U.suppressUnhandledRejections();
            }
            if (!u.isRejected())
              for (; k < R; ++k) {
                var M = {
                  accum: null,
                  value: n[k],
                  index: k,
                  length: R,
                  array: this
                };
                u = u._then(i, void 0, void 0, M, void 0), (k & 127) === 0 && u._setNoAsyncGuarantee();
              }
            this._eachValues !== void 0 && (u = u._then(this._eachComplete, void 0, void 0, this, void 0)), u._then(w, w, void 0, u, this);
          }, e.prototype.reduce = function(n, u) {
            return _(this, n, u, null);
          }, e.reduce = function(n, u, k, R) {
            return _(n, u, k, R);
          };
          function w(n, u) {
            this.isFulfilled() ? u._resolve(n) : u._reject(n);
          }
          function _(n, u, k, R) {
            if (typeof u != "function")
              return r("expecting a function but got " + p.classString(u));
            var j = new d(n, u, k, R);
            return j.promise();
          }
          function i(n) {
            this.accum = n, this.array._gotAccum(n);
            var u = f(this.value, this.array._promise);
            return u instanceof e ? (this.array._currentCancellable = u, u._then(t, void 0, void 0, this, void 0)) : t.call(this, u);
          }
          function t(n) {
            var u = this.array, k = u._promise, R = y(u._fn);
            k._pushContext();
            var j;
            u._eachValues !== void 0 ? j = R.call(k._boundValue(), n, this.index, this.length) : j = R.call(
              k._boundValue(),
              this.accum,
              n,
              this.index,
              this.length
            ), j instanceof e && (u._currentCancellable = j);
            var U = k._popContext();
            return E.checkForgottenReturns(
              j,
              U,
              u._eachValues !== void 0 ? "Promise.each" : "Promise.reduce",
              k
            ), j;
          }
        };
      }, { "./util": 36 }], 29: [function(c, S, v) {
        var e = c("./util"), s, r = function() {
          throw new Error(`No async scheduler available

    See http://goo.gl/MqrFmX
`);
        }, f = e.getNativePromise();
        if (e.isNode && typeof MutationObserver > "u") {
          var g = Pe.setImmediate, E = process.nextTick;
          s = e.isRecentNode ? function(y) {
            g.call(Pe, y);
          } : function(y) {
            E.call(process, y);
          };
        } else if (typeof f == "function" && typeof f.resolve == "function") {
          var p = f.resolve();
          s = function(y) {
            p.then(y);
          };
        } else typeof MutationObserver < "u" && !(typeof window < "u" && window.navigator && (window.navigator.standalone || window.cordova)) && "classList" in document.documentElement ? s = (function() {
          var y = document.createElement("div"), d = { attributes: !0 }, w = !1, _ = document.createElement("div"), i = new MutationObserver(function() {
            y.classList.toggle("foo"), w = !1;
          });
          i.observe(_, d);
          var t = function() {
            w || (w = !0, _.classList.toggle("foo"));
          };
          return function(u) {
            var k = new MutationObserver(function() {
              k.disconnect(), u();
            });
            k.observe(y, d), t();
          };
        })() : typeof setImmediate < "u" ? s = function(y) {
          setImmediate(y);
        } : typeof setTimeout < "u" ? s = function(y) {
          setTimeout(y, 0);
        } : s = r;
        S.exports = s;
      }, { "./util": 36 }], 30: [function(c, S, v) {
        S.exports = function(e, s, r) {
          var f = e.PromiseInspection, g = c("./util");
          function E(p) {
            this.constructor$(p);
          }
          g.inherits(E, s), E.prototype._promiseResolved = function(p, y) {
            this._values[p] = y;
            var d = ++this._totalResolved;
            return d >= this._length ? (this._resolve(this._values), !0) : !1;
          }, E.prototype._promiseFulfilled = function(p, y) {
            var d = new f();
            return d._bitField = 33554432, d._settledValueField = p, this._promiseResolved(y, d);
          }, E.prototype._promiseRejected = function(p, y) {
            var d = new f();
            return d._bitField = 16777216, d._settledValueField = p, this._promiseResolved(y, d);
          }, e.settle = function(p) {
            return r.deprecated(".settle()", ".reflect()"), new E(p).promise();
          }, e.allSettled = function(p) {
            return new E(p).promise();
          }, e.prototype.settle = function() {
            return e.settle(this);
          };
        };
      }, { "./util": 36 }], 31: [function(c, S, v) {
        S.exports = function(e, s, r) {
          var f = c("./util"), g = c("./errors").RangeError, E = c("./errors").AggregateError, p = f.isArray, y = {};
          function d(_) {
            this.constructor$(_), this._howMany = 0, this._unwrap = !1, this._initialized = !1;
          }
          f.inherits(d, s), d.prototype._init = function() {
            if (this._initialized) {
              if (this._howMany === 0) {
                this._resolve([]);
                return;
              }
              this._init$(void 0, -5);
              var _ = p(this._values);
              !this._isResolved() && _ && this._howMany > this._canPossiblyFulfill() && this._reject(this._getRangeError(this.length()));
            }
          }, d.prototype.init = function() {
            this._initialized = !0, this._init();
          }, d.prototype.setUnwrap = function() {
            this._unwrap = !0;
          }, d.prototype.howMany = function() {
            return this._howMany;
          }, d.prototype.setHowMany = function(_) {
            this._howMany = _;
          }, d.prototype._promiseFulfilled = function(_) {
            return this._addFulfilled(_), this._fulfilled() === this.howMany() ? (this._values.length = this.howMany(), this.howMany() === 1 && this._unwrap ? this._resolve(this._values[0]) : this._resolve(this._values), !0) : !1;
          }, d.prototype._promiseRejected = function(_) {
            return this._addRejected(_), this._checkOutcome();
          }, d.prototype._promiseCancelled = function() {
            return this._values instanceof e || this._values == null ? this._cancel() : (this._addRejected(y), this._checkOutcome());
          }, d.prototype._checkOutcome = function() {
            if (this.howMany() > this._canPossiblyFulfill()) {
              for (var _ = new E(), i = this.length(); i < this._values.length; ++i)
                this._values[i] !== y && _.push(this._values[i]);
              return _.length > 0 ? this._reject(_) : this._cancel(), !0;
            }
            return !1;
          }, d.prototype._fulfilled = function() {
            return this._totalResolved;
          }, d.prototype._rejected = function() {
            return this._values.length - this.length();
          }, d.prototype._addRejected = function(_) {
            this._values.push(_);
          }, d.prototype._addFulfilled = function(_) {
            this._values[this._totalResolved++] = _;
          }, d.prototype._canPossiblyFulfill = function() {
            return this.length() - this._rejected();
          }, d.prototype._getRangeError = function(_) {
            var i = "Input array must contain at least " + this._howMany + " items but contains only " + _ + " items";
            return new g(i);
          }, d.prototype._resolveEmptyArray = function() {
            this._reject(this._getRangeError(0));
          };
          function w(_, i) {
            if ((i | 0) !== i || i < 0)
              return r(`expecting a positive integer

    See http://goo.gl/MqrFmX
`);
            var t = new d(_), n = t.promise();
            return t.setHowMany(i), t.init(), n;
          }
          e.some = function(_, i) {
            return w(_, i);
          }, e.prototype.some = function(_) {
            return w(this, _);
          }, e._SomePromiseArray = d;
        };
      }, { "./errors": 12, "./util": 36 }], 32: [function(c, S, v) {
        S.exports = function(e) {
          function s(d) {
            d !== void 0 ? (d = d._target(), this._bitField = d._bitField, this._settledValueField = d._isFateSealed() ? d._settledValue() : void 0) : (this._bitField = 0, this._settledValueField = void 0);
          }
          s.prototype._settledValue = function() {
            return this._settledValueField;
          };
          var r = s.prototype.value = function() {
            if (!this.isFulfilled())
              throw new TypeError(`cannot get fulfillment value of a non-fulfilled promise

    See http://goo.gl/MqrFmX
`);
            return this._settledValue();
          }, f = s.prototype.error = s.prototype.reason = function() {
            if (!this.isRejected())
              throw new TypeError(`cannot get rejection reason of a non-rejected promise

    See http://goo.gl/MqrFmX
`);
            return this._settledValue();
          }, g = s.prototype.isFulfilled = function() {
            return (this._bitField & 33554432) !== 0;
          }, E = s.prototype.isRejected = function() {
            return (this._bitField & 16777216) !== 0;
          }, p = s.prototype.isPending = function() {
            return (this._bitField & 50397184) === 0;
          }, y = s.prototype.isResolved = function() {
            return (this._bitField & 50331648) !== 0;
          };
          s.prototype.isCancelled = function() {
            return (this._bitField & 8454144) !== 0;
          }, e.prototype.__isCancelled = function() {
            return (this._bitField & 65536) === 65536;
          }, e.prototype._isCancelled = function() {
            return this._target().__isCancelled();
          }, e.prototype.isCancelled = function() {
            return (this._target()._bitField & 8454144) !== 0;
          }, e.prototype.isPending = function() {
            return p.call(this._target());
          }, e.prototype.isRejected = function() {
            return E.call(this._target());
          }, e.prototype.isFulfilled = function() {
            return g.call(this._target());
          }, e.prototype.isResolved = function() {
            return y.call(this._target());
          }, e.prototype.value = function() {
            return r.call(this._target());
          }, e.prototype.reason = function() {
            var d = this._target();
            return d._unsetRejectionIsUnhandled(), f.call(d);
          }, e.prototype._value = function() {
            return this._settledValue();
          }, e.prototype._reason = function() {
            return this._unsetRejectionIsUnhandled(), this._settledValue();
          }, e.PromiseInspection = s;
        };
      }, {}], 33: [function(c, S, v) {
        S.exports = function(e, s) {
          var r = c("./util"), f = r.errorObj, g = r.isObject;
          function E(i, t) {
            if (g(i)) {
              if (i instanceof e) return i;
              var n = y(i);
              if (n === f) {
                t && t._pushContext();
                var u = e.reject(n.e);
                return t && t._popContext(), u;
              } else if (typeof n == "function") {
                if (w(i)) {
                  var u = new e(s);
                  return i._then(
                    u._fulfill,
                    u._reject,
                    void 0,
                    u,
                    null
                  ), u;
                }
                return _(i, n, t);
              }
            }
            return i;
          }
          function p(i) {
            return i.then;
          }
          function y(i) {
            try {
              return p(i);
            } catch (t) {
              return f.e = t, f;
            }
          }
          var d = {}.hasOwnProperty;
          function w(i) {
            try {
              return d.call(i, "_promise0");
            } catch {
              return !1;
            }
          }
          function _(i, t, n) {
            var u = new e(s), k = u;
            n && n._pushContext(), u._captureStackTrace(), n && n._popContext();
            var R = !0, j = r.tryCatch(t).call(i, U, M);
            R = !1, u && j === f && (u._rejectCallback(j.e, !0, !0), u = null);
            function U(Z) {
              u && (u._resolveCallback(Z), u = null);
            }
            function M(Z) {
              u && (u._rejectCallback(Z, R, !0), u = null);
            }
            return k;
          }
          return E;
        };
      }, { "./util": 36 }], 34: [function(c, S, v) {
        S.exports = function(e, s, r) {
          var f = c("./util"), g = e.TimeoutError;
          function E(i) {
            this.handle = i;
          }
          E.prototype._resultCancelled = function() {
            clearTimeout(this.handle);
          };
          var p = function(i) {
            return y(+this).thenReturn(i);
          }, y = e.delay = function(i, t) {
            var n, u;
            return t !== void 0 ? (n = e.resolve(t)._then(p, null, null, i, void 0), r.cancellation() && t instanceof e && n._setOnCancel(t)) : (n = new e(s), u = setTimeout(function() {
              n._fulfill();
            }, +i), r.cancellation() && n._setOnCancel(new E(u)), n._captureStackTrace()), n._setAsyncGuaranteed(), n;
          };
          e.prototype.delay = function(i) {
            return y(i, this);
          };
          var d = function(i, t, n) {
            var u;
            typeof t != "string" ? t instanceof Error ? u = t : u = new g("operation timed out") : u = new g(t), f.markAsOriginatingFromRejection(u), i._attachExtraTrace(u), i._reject(u), n?.cancel();
          };
          function w(i) {
            return clearTimeout(this.handle), i;
          }
          function _(i) {
            throw clearTimeout(this.handle), i;
          }
          e.prototype.timeout = function(i, t) {
            i = +i;
            var n, u, k = new E(setTimeout(function() {
              n.isPending() && d(n, t, u);
            }, i));
            return r.cancellation() ? (u = this.then(), n = u._then(
              w,
              _,
              void 0,
              k,
              void 0
            ), n._setOnCancel(k)) : n = this._then(
              w,
              _,
              void 0,
              k,
              void 0
            ), n;
          };
        };
      }, { "./util": 36 }], 35: [function(c, S, v) {
        S.exports = function(e, s, r, f, g, E) {
          var p = c("./util"), y = c("./errors").TypeError, d = c("./util").inherits, w = p.errorObj, _ = p.tryCatch, i = {};
          function t(M) {
            setTimeout(function() {
              throw M;
            }, 0);
          }
          function n(M) {
            var Z = r(M);
            return Z !== M && typeof M._isDisposable == "function" && typeof M._getDisposer == "function" && M._isDisposable() && Z._setDisposable(M._getDisposer()), Z;
          }
          function u(M, Z) {
            var q = 0, Q = M.length, re = new e(g);
            function H() {
              if (q >= Q) return re._fulfill();
              var te = n(M[q++]);
              if (te instanceof e && te._isDisposable()) {
                try {
                  te = r(
                    te._getDisposer().tryDispose(Z),
                    M.promise
                  );
                } catch (ue) {
                  return t(ue);
                }
                if (te instanceof e)
                  return te._then(
                    H,
                    t,
                    null,
                    null,
                    null
                  );
              }
              H();
            }
            return H(), re;
          }
          function k(M, Z, q) {
            this._data = M, this._promise = Z, this._context = q;
          }
          k.prototype.data = function() {
            return this._data;
          }, k.prototype.promise = function() {
            return this._promise;
          }, k.prototype.resource = function() {
            return this.promise().isFulfilled() ? this.promise().value() : i;
          }, k.prototype.tryDispose = function(M) {
            var Z = this.resource(), q = this._context;
            q !== void 0 && q._pushContext();
            var Q = Z !== i ? this.doDispose(Z, M) : null;
            return q !== void 0 && q._popContext(), this._promise._unsetDisposable(), this._data = null, Q;
          }, k.isDisposer = function(M) {
            return M != null && typeof M.resource == "function" && typeof M.tryDispose == "function";
          };
          function R(M, Z, q) {
            this.constructor$(M, Z, q);
          }
          d(R, k), R.prototype.doDispose = function(M, Z) {
            var q = this.data();
            return q.call(M, M, Z);
          };
          function j(M) {
            return k.isDisposer(M) ? (this.resources[this.index]._setDisposable(M), M.promise()) : M;
          }
          function U(M) {
            this.length = M, this.promise = null, this[M - 1] = null;
          }
          U.prototype._resultCancelled = function() {
            for (var M = this.length, Z = 0; Z < M; ++Z) {
              var q = this[Z];
              q instanceof e && q.cancel();
            }
          }, e.using = function() {
            var M = arguments.length;
            if (M < 2) return s(
              "you must pass at least 2 arguments to Promise.using"
            );
            var Z = arguments[M - 1];
            if (typeof Z != "function")
              return s("expecting a function but got " + p.classString(Z));
            var q, Q = !0;
            M === 2 && Array.isArray(arguments[0]) ? (q = arguments[0], M = q.length, Q = !1) : (q = arguments, M--);
            for (var re = new U(M), H = 0; H < M; ++H) {
              var te = q[H];
              if (k.isDisposer(te)) {
                var ue = te;
                te = te.promise(), te._setDisposable(ue);
              } else {
                var fe = r(te);
                fe instanceof e && (te = fe._then(j, null, null, {
                  resources: re,
                  index: H
                }, void 0));
              }
              re[H] = te;
            }
            for (var W = new Array(re.length), H = 0; H < W.length; ++H)
              W[H] = e.resolve(re[H]).reflect();
            var B = e.all(W).then(function(C) {
              for (var G = 0; G < C.length; ++G) {
                var ne = C[G];
                if (ne.isRejected())
                  return w.e = ne.error(), w;
                if (!ne.isFulfilled()) {
                  B.cancel();
                  return;
                }
                C[G] = ne.value();
              }
              Y._pushContext(), Z = _(Z);
              var D = Q ? Z.apply(void 0, C) : Z(C), he = Y._popContext();
              return E.checkForgottenReturns(
                D,
                he,
                "Promise.using",
                Y
              ), D;
            }), Y = B.lastly(function() {
              var C = new e.PromiseInspection(B);
              return u(re, C);
            });
            return re.promise = Y, Y._setOnCancel(re), Y;
          }, e.prototype._setDisposable = function(M) {
            this._bitField = this._bitField | 131072, this._disposer = M;
          }, e.prototype._isDisposable = function() {
            return (this._bitField & 131072) > 0;
          }, e.prototype._getDisposer = function() {
            return this._disposer;
          }, e.prototype._unsetDisposable = function() {
            this._bitField = this._bitField & -131073, this._disposer = void 0;
          }, e.prototype.disposer = function(M) {
            if (typeof M == "function")
              return new R(M, this, f());
            throw new y();
          };
        };
      }, { "./errors": 12, "./util": 36 }], 36: [function(c, S, v) {
        var e = c("./es5"), s = typeof navigator > "u", r = { e: {} }, f, g = typeof self < "u" ? self : typeof window < "u" ? window : typeof Pe < "u" ? Pe : this !== void 0 ? this : null;
        function E() {
          try {
            var a = f;
            return f = null, a.apply(this, arguments);
          } catch (T) {
            return r.e = T, r;
          }
        }
        function p(a) {
          return f = a, E;
        }
        var y = function(a, T) {
          var N = {}.hasOwnProperty;
          function J() {
            this.constructor = a, this.constructor$ = T;
            for (var $ in T.prototype)
              N.call(T.prototype, $) && $.charAt($.length - 1) !== "$" && (this[$ + "$"] = T.prototype[$]);
          }
          return J.prototype = T.prototype, a.prototype = new J(), a.prototype;
        };
        function d(a) {
          return a == null || a === !0 || a === !1 || typeof a == "string" || typeof a == "number";
        }
        function w(a) {
          return typeof a == "function" || typeof a == "object" && a !== null;
        }
        function _(a) {
          return d(a) ? new Error(Q(a)) : a;
        }
        function i(a, T) {
          var N = a.length, J = new Array(N + 1), $;
          for ($ = 0; $ < N; ++$)
            J[$] = a[$];
          return J[$] = T, J;
        }
        function t(a, T, N) {
          if (e.isES5) {
            var J = Object.getOwnPropertyDescriptor(a, T);
            if (J != null)
              return J.get == null && J.set == null ? J.value : N;
          } else
            return {}.hasOwnProperty.call(a, T) ? a[T] : void 0;
        }
        function n(a, T, N) {
          if (d(a)) return a;
          var J = {
            value: N,
            configurable: !0,
            enumerable: !1,
            writable: !0
          };
          return e.defineProperty(a, T, J), a;
        }
        function u(a) {
          throw a;
        }
        var k = (function() {
          var a = [
            Array.prototype,
            Object.prototype,
            Function.prototype
          ], T = function($) {
            for (var F = 0; F < a.length; ++F)
              if (a[F] === $)
                return !0;
            return !1;
          };
          if (e.isES5) {
            var N = Object.getOwnPropertyNames;
            return function($) {
              for (var F = [], P = /* @__PURE__ */ Object.create(null); $ != null && !T($); ) {
                var X;
                try {
                  X = N($);
                } catch {
                  return F;
                }
                for (var pe = 0; pe < X.length; ++pe) {
                  var de = X[pe];
                  if (!P[de]) {
                    P[de] = !0;
                    var ce = Object.getOwnPropertyDescriptor($, de);
                    ce != null && ce.get == null && ce.set == null && F.push(de);
                  }
                }
                $ = e.getPrototypeOf($);
              }
              return F;
            };
          } else {
            var J = {}.hasOwnProperty;
            return function($) {
              if (T($)) return [];
              var F = [];
              e: for (var P in $)
                if (J.call($, P))
                  F.push(P);
                else {
                  for (var X = 0; X < a.length; ++X)
                    if (J.call(a[X], P))
                      continue e;
                  F.push(P);
                }
              return F;
            };
          }
        })(), R = /this\s*\.\s*\S+\s*=/;
        function j(a) {
          try {
            if (typeof a == "function") {
              var T = e.names(a.prototype), N = e.isES5 && T.length > 1, J = T.length > 0 && !(T.length === 1 && T[0] === "constructor"), $ = R.test(a + "") && e.names(a).length > 0;
              if (N || J || $)
                return !0;
            }
            return !1;
          } catch {
            return !1;
          }
        }
        function U(a) {
          function T() {
          }
          T.prototype = a;
          var N = new T();
          function J() {
            return typeof N.foo;
          }
          return J(), J(), a;
        }
        var M = /^[a-z$_][a-z$_0-9]*$/i;
        function Z(a) {
          return M.test(a);
        }
        function q(a, T, N) {
          for (var J = new Array(a), $ = 0; $ < a; ++$)
            J[$] = T + $ + N;
          return J;
        }
        function Q(a) {
          try {
            return a + "";
          } catch {
            return "[no string representation]";
          }
        }
        function re(a) {
          return a instanceof Error || a !== null && typeof a == "object" && typeof a.message == "string" && typeof a.name == "string";
        }
        function H(a) {
          try {
            n(a, "isOperational", !0);
          } catch {
          }
        }
        function te(a) {
          return a == null ? !1 : a instanceof Error.__BluebirdErrorTypes__.OperationalError || a.isOperational === !0;
        }
        function ue(a) {
          return re(a) && e.propertyIsWritable(a, "stack");
        }
        var fe = (function() {
          return "stack" in new Error() ? function(a) {
            return ue(a) ? a : new Error(Q(a));
          } : function(a) {
            if (ue(a)) return a;
            try {
              throw new Error(Q(a));
            } catch (T) {
              return T;
            }
          };
        })();
        function W(a) {
          return {}.toString.call(a);
        }
        function B(a, T, N) {
          for (var J = e.names(a), $ = 0; $ < J.length; ++$) {
            var F = J[$];
            if (N(F))
              try {
                e.defineProperty(T, F, e.getDescriptor(a, F));
              } catch {
              }
          }
        }
        var Y = function(a) {
          return e.isArray(a) ? a : null;
        };
        if (typeof Symbol < "u" && Symbol.iterator) {
          var C = typeof Array.from == "function" ? function(a) {
            return Array.from(a);
          } : function(a) {
            for (var T = [], N = a[Symbol.iterator](), J; !(J = N.next()).done; )
              T.push(J.value);
            return T;
          };
          Y = function(a) {
            return e.isArray(a) ? a : a != null && typeof a[Symbol.iterator] == "function" ? C(a) : null;
          };
        }
        var G = typeof process < "u" && W(process).toLowerCase() === "[object process]", ne = typeof process < "u" && typeof process.env < "u";
        function D(a) {
          return ne ? process.env[a] : void 0;
        }
        function he() {
          if (typeof Promise == "function")
            try {
              var a = new Promise(function() {
              });
              if (W(a) === "[object Promise]")
                return Promise;
            } catch {
            }
        }
        var se;
        function _e(a, T) {
          if (a === null || typeof T != "function" || T === se)
            return T;
          a.domain !== null && (T = a.domain.bind(T));
          var N = a.async;
          if (N !== null) {
            var J = T;
            T = function() {
              var $ = new Array(2).concat([].slice.call(arguments));
              return $[0] = J, $[1] = this, N.runInAsyncScope.apply(N, $);
            };
          }
          return T;
        }
        var h = {
          setReflectHandler: function(a) {
            se = a;
          },
          isClass: j,
          isIdentifier: Z,
          inheritedDataKeys: k,
          getDataPropertyOrDefault: t,
          thrower: u,
          isArray: e.isArray,
          asArray: Y,
          notEnumerableProp: n,
          isPrimitive: d,
          isObject: w,
          isError: re,
          canEvaluate: s,
          errorObj: r,
          tryCatch: p,
          inherits: y,
          withAppended: i,
          maybeWrapAsError: _,
          toFastProperties: U,
          filledRange: q,
          toString: Q,
          canAttachTrace: ue,
          ensureErrorObject: fe,
          originatesFromRejection: te,
          markAsOriginatingFromRejection: H,
          classString: W,
          copyDescriptors: B,
          isNode: G,
          hasEnvVariables: ne,
          env: D,
          global: g,
          getNativePromise: he,
          contextBind: _e
        };
        h.isRecentNode = h.isNode && (function() {
          var a;
          return process.versions && process.versions.node ? a = process.versions.node.split(".").map(Number) : process.version && (a = process.version.split(".").map(Number)), a[0] === 0 && a[1] > 10 || a[0] > 0;
        })(), h.nodeSupportsAsyncResource = h.isNode && (function() {
          var a = !1;
          try {
            var T = c("async_hooks").AsyncResource;
            a = typeof T.prototype.runInAsyncScope == "function";
          } catch {
            a = !1;
          }
          return a;
        })(), h.isNode && h.toFastProperties(process);
        try {
          throw new Error();
        } catch (a) {
          h.lastLineError = a;
        }
        S.exports = h;
      }, { "./es5": 13, async_hooks: void 0 }] }, {}, [4])(4);
    }), typeof window < "u" && window !== null ? window.P = window.Promise : typeof self < "u" && self !== null && (self.P = self.Promise);
  })(fn)), fn.exports;
}
var cn, bo;
function Ba() {
  if (bo) return cn;
  bo = 1;
  const b = hn(), m = Ia(), c = pn(), S = yn(), v = Le, e = /* @__PURE__ */ Ao(), s = _n(), r = Tt(), f = Da(), g = Buffer.alloc(4);
  g.writeUInt32LE(101010256, 0);
  function E(d) {
    const w = d.stream(0).pipe(b());
    return w.pull(4).then(function(_) {
      if (_.readUInt32LE(0) === 875721283) {
        let t;
        return w.pull(12).then(function(n) {
          t = r.parse(n, [
            ["version", 4],
            ["pubKeyLength", 4],
            ["signatureLength", 4]
          ]);
        }).then(function() {
          return w.pull(t.pubKeyLength + t.signatureLength);
        }).then(function(n) {
          return t.publicKey = n.slice(0, t.pubKeyLength), t.signature = n.slice(t.pubKeyLength), t.size = 16 + t.pubKeyLength + t.signatureLength, t;
        });
      }
    });
  }
  function p(d, w) {
    const _ = r.parse(w, [
      ["signature", 4],
      ["diskNumber", 4],
      ["offsetToStartOfCentralDirectory", 8],
      ["numberOfDisks", 4]
    ]);
    if (_.signature != 117853008)
      throw new Error("invalid zip64 end of central dir locator signature (0x07064b50): 0x" + _.signature.toString(16));
    const i = b();
    return d.stream(_.offsetToStartOfCentralDirectory).pipe(i), i.pull(56);
  }
  function y(d) {
    const w = r.parse(d, [
      ["signature", 4],
      ["sizeOfCentralDirectory", 8],
      ["version", 2],
      ["versionsNeededToExtract", 2],
      ["diskNumber", 4],
      ["diskStart", 4],
      ["numberOfRecordsOnDisk", 8],
      ["numberOfRecords", 8],
      ["sizeOfCentralDirectory", 8],
      ["offsetToStartOfCentralDirectory", 8]
    ]);
    if (w.signature != 101075792)
      throw new Error("invalid zip64 end of central dir locator signature (0x06064b50): 0x0" + w.signature.toString(16));
    return w;
  }
  return cn = function(w, _) {
    const i = b(), t = b(), n = _ && _.tailSize || 80;
    let u, k, R, j;
    return _ && _.crx && (k = E(w)), w.size().then(function(U) {
      return u = U, w.stream(Math.max(0, U - n)).on("error", function(M) {
        i.emit("error", M);
      }).pipe(i), i.pull(g);
    }).then(function() {
      return f.props({ directory: i.pull(22), crxHeader: k });
    }).then(function(U) {
      const M = U.directory;
      if (R = U.crxHeader && U.crxHeader.size || 0, j = r.parse(M, [
        ["signature", 4],
        ["diskNumber", 2],
        ["diskStart", 2],
        ["numberOfRecordsOnDisk", 2],
        ["numberOfRecords", 2],
        ["sizeOfCentralDirectory", 4],
        ["offsetToStartOfCentralDirectory", 4],
        ["commentLength", 2]
      ]), j.diskNumber == 65535 || j.numberOfRecords == 65535 || j.offsetToStartOfCentralDirectory == 4294967295) {
        const q = u - (n - i.match + 20), Q = b();
        return w.stream(q).pipe(Q), Q.pull(20).then(function(re) {
          return p(w, re);
        }).then(function(re) {
          j = y(re);
        });
      } else
        j.offsetToStartOfCentralDirectory += R;
    }).then(function() {
      if (j.commentLength) return i.pull(j.commentLength).then(function(U) {
        j.comment = U.toString("utf8");
      });
    }).then(function() {
      return w.stream(j.offsetToStartOfCentralDirectory).pipe(t), j.extract = function(U) {
        if (!U || !U.path) throw new Error("PATH_MISSING");
        return U.path = v.resolve(v.normalize(U.path)), j.files.then(function(M) {
          return f.map(M, async function(Z) {
            const q = v.join(U.path, Z.path);
            if (q.indexOf(U.path) != 0)
              return;
            if (Z.type == "Directory") {
              await e.ensureDir(q);
              return;
            }
            await e.ensureDir(v.dirname(q));
            const Q = U.getWriter ? U.getWriter({ path: q }) : e.createWriteStream(q);
            return new Promise(function(re, H) {
              Z.stream(U.password).on("error", H).pipe(Q).on("close", re).on("error", H);
            });
          }, { concurrency: U.concurrency > 1 ? U.concurrency : 1 });
        });
      }, j.files = f.mapSeries(Array(j.numberOfRecords), function() {
        return t.pull(46).then(function(U) {
          const M = r.parse(U, [
            ["signature", 4],
            ["versionMadeBy", 2],
            ["versionsNeededToExtract", 2],
            ["flags", 2],
            ["compressionMethod", 2],
            ["lastModifiedTime", 2],
            ["lastModifiedDate", 2],
            ["crc32", 4],
            ["compressedSize", 4],
            ["uncompressedSize", 4],
            ["fileNameLength", 2],
            ["extraFieldLength", 2],
            ["fileCommentLength", 2],
            ["diskNumber", 2],
            ["internalFileAttributes", 2],
            ["externalFileAttributes", 4],
            ["offsetToLocalFileHeader", 4]
          ]);
          return M.offsetToLocalFileHeader += R, M.lastModifiedDateTime = s(M.lastModifiedDate, M.lastModifiedTime), t.pull(M.fileNameLength).then(function(Z) {
            return M.pathBuffer = Z, M.path = Z.toString("utf8"), M.isUnicode = (M.flags & 2048) != 0, t.pull(M.extraFieldLength);
          }).then(function(Z) {
            return M.extra = S(Z, M), t.pull(M.fileCommentLength);
          }).then(function(Z) {
            M.comment = Z, M.type = M.uncompressedSize === 0 && /[/\\]$/.test(M.path) ? "Directory" : "File";
            const q = _ && _.padding || 1e3;
            return M.stream = function(Q) {
              const re = 30 + q + (M.extraFieldLength || 0) + (M.fileNameLength || 0) + M.compressedSize;
              return m(w, M.offsetToLocalFileHeader, Q, M, re);
            }, M.buffer = function(Q) {
              return c(M.stream(Q));
            }, M;
          });
        });
      }), f.props(j);
    });
  }, cn;
}
var dn, vo;
function ja() {
  if (vo) return dn;
  vo = 1;
  const b = rt(), m = Ba(), c = Ae;
  return dn = {
    buffer: function(S, v) {
      return m({
        stream: function(s, r) {
          const f = c.PassThrough(), g = r ? s + r : void 0;
          return f.end(S.slice(s, g)), f;
        },
        size: function() {
          return Promise.resolve(S.length);
        }
      }, v);
    },
    file: function(S, v) {
      return m({
        stream: function(s, r) {
          const f = r ? s + r : void 0;
          return b.createReadStream(S, { start: s, end: f });
        },
        size: function() {
          return new Promise(function(s, r) {
            b.stat(S, function(f, g) {
              f ? r(f) : s(g.size);
            });
          });
        }
      }, v);
    },
    url: function(S, v, e) {
      if (typeof v == "string" && (v = { url: v }), !v.url)
        throw "URL missing";
      return v.headers = v.headers || {}, m({
        stream: function(r, f) {
          const g = Object.create(v), E = f ? r + f : "";
          return g.headers = Object.create(v.headers), g.headers.range = "bytes=" + r + "-" + E, S(g);
        },
        size: function() {
          return new Promise(function(r, f) {
            const g = S(v);
            g.on("response", function(E) {
              g.abort(), E.headers["content-length"] ? r(E.headers["content-length"]) : f(new Error("Missing content length header"));
            }).on("error", f);
          });
        }
      }, e);
    },
    s3: function(S, v, e) {
      return m({
        size: function() {
          return new Promise(function(r, f) {
            S.headObject(v, function(g, E) {
              g ? f(g) : r(E.ContentLength);
            });
          });
        },
        stream: function(r, f) {
          const g = {};
          for (const p in v)
            g[p] = v[p];
          const E = f ? r + f : "";
          return g.Range = "bytes=" + r + "-" + E, S.getObject(g).createReadStream();
        }
      }, e);
    },
    s3_v3: function(S, v, e) {
      const { GetObjectCommand: s, HeadObjectCommand: r } = $o;
      return m({
        size: async () => {
          const g = await S.send(
            new r({
              Bucket: v.Bucket,
              Key: v.Key
            })
          );
          return g.ContentLength ? g.ContentLength : 0;
        },
        stream: (g, E) => {
          const p = c.PassThrough(), y = E ? g + E : "";
          return S.send(
            new s({
              Bucket: v.Bucket,
              Key: v.Key,
              Range: `bytes=${g}-${y}`
            })
          ).then((d) => {
            d.Body.pipe(p);
          }).catch((d) => {
            p.emit("error", d);
          }), p;
        }
      }, e);
    },
    custom: function(S, v) {
      return m(S, v);
    }
  }, dn;
}
var mo;
function Na() {
  return mo || (mo = 1, Ze.Parse = gn(), Ze.ParseOne = Zo(), Ze.Extract = Ea(), Ze.Open = ja()), Ze;
}
var Mo = Na();
const La = /* @__PURE__ */ Wo(Mo), za = /* @__PURE__ */ Ho({
  __proto__: null,
  default: La
}, [Mo]);
export {
  za as u
};
