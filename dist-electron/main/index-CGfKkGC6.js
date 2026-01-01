import { c as yt, a as Kt } from "./_commonjsHelpers-DQNKXVTB.js";
import $t from "electron";
import xt from "fs";
import Et from "path";
import Xt from "https";
function Jt(rt, J) {
  for (var m = 0; m < J.length; m++) {
    const z = J[m];
    if (typeof z != "string" && !Array.isArray(z)) {
      for (const w in z)
        if (w !== "default" && !(w in rt)) {
          const a = Object.getOwnPropertyDescriptor(z, w);
          a && Object.defineProperty(rt, w, a.get ? a : {
            enumerable: !0,
            get: () => z[w]
          });
        }
    }
  }
  return Object.freeze(Object.defineProperty(rt, Symbol.toStringTag, { value: "Module" }));
}
var ht = {}, Ct = {}, zt = {}, Pt;
function Qt() {
  return Pt || (Pt = 1, (function(rt) {
    Object.defineProperty(rt, "__esModule", { value: !0 }), rt.changePermissions = rt.downloadFile = rt.getPath = void 0;
    const J = $t, m = xt, z = Et, w = Xt, a = () => {
      const v = J.app.getPath("userData");
      return z.resolve(`${v}/extensions`);
    };
    rt.getPath = a;
    const s = J.net ? J.net.request : w.get, r = (v, c) => new Promise((_, y) => {
      const n = s(v);
      n.on("response", (d) => {
        if (d.statusCode && d.statusCode >= 300 && d.statusCode < 400 && d.headers.location)
          return (0, rt.downloadFile)(d.headers.location, c).then(_).catch(y);
        d.pipe(m.createWriteStream(c)).on("close", _), d.on("error", y);
      }), n.on("error", y), n.end();
    });
    rt.downloadFile = r;
    const l = (v, c) => {
      m.readdirSync(v).forEach((y) => {
        const n = z.join(v, y);
        m.chmodSync(n, parseInt(`${c}`, 8)), m.statSync(n).isDirectory() && (0, rt.changePermissions)(n, c);
      });
    };
    rt.changePermissions = l;
  })(zt)), zt;
}
function kt(rt) {
  throw new Error('Could not dynamically require "' + rt + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var At = { exports: {} };
/*!

JSZip v3.10.1 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/
var jt;
function te() {
  return jt || (jt = 1, (function(rt, J) {
    (function(m) {
      rt.exports = m();
    })(function() {
      return (function m(z, w, a) {
        function s(v, c) {
          if (!w[v]) {
            if (!z[v]) {
              var _ = typeof kt == "function" && kt;
              if (!c && _) return _(v, !0);
              if (r) return r(v, !0);
              var y = new Error("Cannot find module '" + v + "'");
              throw y.code = "MODULE_NOT_FOUND", y;
            }
            var n = w[v] = { exports: {} };
            z[v][0].call(n.exports, function(d) {
              var i = z[v][1][d];
              return s(i || d);
            }, n, n.exports, m, z, w, a);
          }
          return w[v].exports;
        }
        for (var r = typeof kt == "function" && kt, l = 0; l < a.length; l++) s(a[l]);
        return s;
      })({ 1: [function(m, z, w) {
        var a = m("./utils"), s = m("./support"), r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        w.encode = function(l) {
          for (var v, c, _, y, n, d, i, f = [], o = 0, g = l.length, k = g, C = a.getTypeOf(l) !== "string"; o < l.length; ) k = g - o, _ = C ? (v = l[o++], c = o < g ? l[o++] : 0, o < g ? l[o++] : 0) : (v = l.charCodeAt(o++), c = o < g ? l.charCodeAt(o++) : 0, o < g ? l.charCodeAt(o++) : 0), y = v >> 2, n = (3 & v) << 4 | c >> 4, d = 1 < k ? (15 & c) << 2 | _ >> 6 : 64, i = 2 < k ? 63 & _ : 64, f.push(r.charAt(y) + r.charAt(n) + r.charAt(d) + r.charAt(i));
          return f.join("");
        }, w.decode = function(l) {
          var v, c, _, y, n, d, i = 0, f = 0, o = "data:";
          if (l.substr(0, o.length) === o) throw new Error("Invalid base64 input, it looks like a data url.");
          var g, k = 3 * (l = l.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (l.charAt(l.length - 1) === r.charAt(64) && k--, l.charAt(l.length - 2) === r.charAt(64) && k--, k % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (g = s.uint8array ? new Uint8Array(0 | k) : new Array(0 | k); i < l.length; ) v = r.indexOf(l.charAt(i++)) << 2 | (y = r.indexOf(l.charAt(i++))) >> 4, c = (15 & y) << 4 | (n = r.indexOf(l.charAt(i++))) >> 2, _ = (3 & n) << 6 | (d = r.indexOf(l.charAt(i++))), g[f++] = v, n !== 64 && (g[f++] = c), d !== 64 && (g[f++] = _);
          return g;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(m, z, w) {
        var a = m("./external"), s = m("./stream/DataWorker"), r = m("./stream/Crc32Probe"), l = m("./stream/DataLengthProbe");
        function v(c, _, y, n, d) {
          this.compressedSize = c, this.uncompressedSize = _, this.crc32 = y, this.compression = n, this.compressedContent = d;
        }
        v.prototype = { getContentWorker: function() {
          var c = new s(a.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new l("data_length")), _ = this;
          return c.on("end", function() {
            if (this.streamInfo.data_length !== _.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), c;
        }, getCompressedWorker: function() {
          return new s(a.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, v.createWorkerFrom = function(c, _, y) {
          return c.pipe(new r()).pipe(new l("uncompressedSize")).pipe(_.compressWorker(y)).pipe(new l("compressedSize")).withStreamInfo("compression", _);
        }, z.exports = v;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(m, z, w) {
        var a = m("./stream/GenericWorker");
        w.STORE = { magic: "\0\0", compressWorker: function() {
          return new a("STORE compression");
        }, uncompressWorker: function() {
          return new a("STORE decompression");
        } }, w.DEFLATE = m("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(m, z, w) {
        var a = m("./utils"), s = (function() {
          for (var r, l = [], v = 0; v < 256; v++) {
            r = v;
            for (var c = 0; c < 8; c++) r = 1 & r ? 3988292384 ^ r >>> 1 : r >>> 1;
            l[v] = r;
          }
          return l;
        })();
        z.exports = function(r, l) {
          return r !== void 0 && r.length ? a.getTypeOf(r) !== "string" ? (function(v, c, _, y) {
            var n = s, d = y + _;
            v ^= -1;
            for (var i = y; i < d; i++) v = v >>> 8 ^ n[255 & (v ^ c[i])];
            return -1 ^ v;
          })(0 | l, r, r.length, 0) : (function(v, c, _, y) {
            var n = s, d = y + _;
            v ^= -1;
            for (var i = y; i < d; i++) v = v >>> 8 ^ n[255 & (v ^ c.charCodeAt(i))];
            return -1 ^ v;
          })(0 | l, r, r.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(m, z, w) {
        w.base64 = !1, w.binary = !1, w.dir = !1, w.createFolders = !0, w.date = null, w.compression = null, w.compressionOptions = null, w.comment = null, w.unixPermissions = null, w.dosPermissions = null;
      }, {}], 6: [function(m, z, w) {
        var a = null;
        a = typeof Promise < "u" ? Promise : m("lie"), z.exports = { Promise: a };
      }, { lie: 37 }], 7: [function(m, z, w) {
        var a = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Uint32Array < "u", s = m("pako"), r = m("./utils"), l = m("./stream/GenericWorker"), v = a ? "uint8array" : "array";
        function c(_, y) {
          l.call(this, "FlateWorker/" + _), this._pako = null, this._pakoAction = _, this._pakoOptions = y, this.meta = {};
        }
        w.magic = "\b\0", r.inherits(c, l), c.prototype.processChunk = function(_) {
          this.meta = _.meta, this._pako === null && this._createPako(), this._pako.push(r.transformTo(v, _.data), !1);
        }, c.prototype.flush = function() {
          l.prototype.flush.call(this), this._pako === null && this._createPako(), this._pako.push([], !0);
        }, c.prototype.cleanUp = function() {
          l.prototype.cleanUp.call(this), this._pako = null;
        }, c.prototype._createPako = function() {
          this._pako = new s[this._pakoAction]({ raw: !0, level: this._pakoOptions.level || -1 });
          var _ = this;
          this._pako.onData = function(y) {
            _.push({ data: y, meta: _.meta });
          };
        }, w.compressWorker = function(_) {
          return new c("Deflate", _);
        }, w.uncompressWorker = function() {
          return new c("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(m, z, w) {
        function a(n, d) {
          var i, f = "";
          for (i = 0; i < d; i++) f += String.fromCharCode(255 & n), n >>>= 8;
          return f;
        }
        function s(n, d, i, f, o, g) {
          var k, C, S = n.file, j = n.compression, R = g !== v.utf8encode, W = r.transformTo("string", g(S.name)), D = r.transformTo("string", v.utf8encode(S.name)), H = S.comment, V = r.transformTo("string", g(H)), b = r.transformTo("string", v.utf8encode(H)), F = D.length !== S.name.length, e = b.length !== H.length, U = "", tt = "", Z = "", X = S.dir, M = S.date, Q = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          d && !i || (Q.crc32 = n.crc32, Q.compressedSize = n.compressedSize, Q.uncompressedSize = n.uncompressedSize);
          var I = 0;
          d && (I |= 8), R || !F && !e || (I |= 2048);
          var A = 0, Y = 0;
          X && (A |= 16), o === "UNIX" ? (Y = 798, A |= (function($, at) {
            var ft = $;
            return $ || (ft = at ? 16893 : 33204), (65535 & ft) << 16;
          })(S.unixPermissions, X)) : (Y = 20, A |= (function($) {
            return 63 & ($ || 0);
          })(S.dosPermissions)), k = M.getUTCHours(), k <<= 6, k |= M.getUTCMinutes(), k <<= 5, k |= M.getUTCSeconds() / 2, C = M.getUTCFullYear() - 1980, C <<= 4, C |= M.getUTCMonth() + 1, C <<= 5, C |= M.getUTCDate(), F && (tt = a(1, 1) + a(c(W), 4) + D, U += "up" + a(tt.length, 2) + tt), e && (Z = a(1, 1) + a(c(V), 4) + b, U += "uc" + a(Z.length, 2) + Z);
          var q = "";
          return q += `
\0`, q += a(I, 2), q += j.magic, q += a(k, 2), q += a(C, 2), q += a(Q.crc32, 4), q += a(Q.compressedSize, 4), q += a(Q.uncompressedSize, 4), q += a(W.length, 2), q += a(U.length, 2), { fileRecord: _.LOCAL_FILE_HEADER + q + W + U, dirRecord: _.CENTRAL_FILE_HEADER + a(Y, 2) + q + a(V.length, 2) + "\0\0\0\0" + a(A, 4) + a(f, 4) + W + U + V };
        }
        var r = m("../utils"), l = m("../stream/GenericWorker"), v = m("../utf8"), c = m("../crc32"), _ = m("../signature");
        function y(n, d, i, f) {
          l.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = d, this.zipPlatform = i, this.encodeFileName = f, this.streamFiles = n, this.accumulate = !1, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        r.inherits(y, l), y.prototype.push = function(n) {
          var d = n.meta.percent || 0, i = this.entriesCount, f = this._sources.length;
          this.accumulate ? this.contentBuffer.push(n) : (this.bytesWritten += n.data.length, l.prototype.push.call(this, { data: n.data, meta: { currentFile: this.currentFile, percent: i ? (d + 100 * (i - f - 1)) / i : 100 } }));
        }, y.prototype.openedSource = function(n) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = n.file.name;
          var d = this.streamFiles && !n.file.dir;
          if (d) {
            var i = s(n, d, !1, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: i.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = !0;
        }, y.prototype.closedSource = function(n) {
          this.accumulate = !1;
          var d = this.streamFiles && !n.file.dir, i = s(n, d, !0, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(i.dirRecord), d) this.push({ data: (function(f) {
            return _.DATA_DESCRIPTOR + a(f.crc32, 4) + a(f.compressedSize, 4) + a(f.uncompressedSize, 4);
          })(n), meta: { percent: 100 } });
          else for (this.push({ data: i.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, y.prototype.flush = function() {
          for (var n = this.bytesWritten, d = 0; d < this.dirRecords.length; d++) this.push({ data: this.dirRecords[d], meta: { percent: 100 } });
          var i = this.bytesWritten - n, f = (function(o, g, k, C, S) {
            var j = r.transformTo("string", S(C));
            return _.CENTRAL_DIRECTORY_END + "\0\0\0\0" + a(o, 2) + a(o, 2) + a(g, 4) + a(k, 4) + a(j.length, 2) + j;
          })(this.dirRecords.length, i, n, this.zipComment, this.encodeFileName);
          this.push({ data: f, meta: { percent: 100 } });
        }, y.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, y.prototype.registerPrevious = function(n) {
          this._sources.push(n);
          var d = this;
          return n.on("data", function(i) {
            d.processChunk(i);
          }), n.on("end", function() {
            d.closedSource(d.previous.streamInfo), d._sources.length ? d.prepareNextSource() : d.end();
          }), n.on("error", function(i) {
            d.error(i);
          }), this;
        }, y.prototype.resume = function() {
          return !!l.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), !0) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), !0));
        }, y.prototype.error = function(n) {
          var d = this._sources;
          if (!l.prototype.error.call(this, n)) return !1;
          for (var i = 0; i < d.length; i++) try {
            d[i].error(n);
          } catch {
          }
          return !0;
        }, y.prototype.lock = function() {
          l.prototype.lock.call(this);
          for (var n = this._sources, d = 0; d < n.length; d++) n[d].lock();
        }, z.exports = y;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(m, z, w) {
        var a = m("../compressions"), s = m("./ZipFileWorker");
        w.generateWorker = function(r, l, v) {
          var c = new s(l.streamFiles, v, l.platform, l.encodeFileName), _ = 0;
          try {
            r.forEach(function(y, n) {
              _++;
              var d = (function(g, k) {
                var C = g || k, S = a[C];
                if (!S) throw new Error(C + " is not a valid compression method !");
                return S;
              })(n.options.compression, l.compression), i = n.options.compressionOptions || l.compressionOptions || {}, f = n.dir, o = n.date;
              n._compressWorker(d, i).withStreamInfo("file", { name: y, dir: f, date: o, comment: n.comment || "", unixPermissions: n.unixPermissions, dosPermissions: n.dosPermissions }).pipe(c);
            }), c.entriesCount = _;
          } catch (y) {
            c.error(y);
          }
          return c;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(m, z, w) {
        function a() {
          if (!(this instanceof a)) return new a();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var s = new a();
            for (var r in this) typeof this[r] != "function" && (s[r] = this[r]);
            return s;
          };
        }
        (a.prototype = m("./object")).loadAsync = m("./load"), a.support = m("./support"), a.defaults = m("./defaults"), a.version = "3.10.1", a.loadAsync = function(s, r) {
          return new a().loadAsync(s, r);
        }, a.external = m("./external"), z.exports = a;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(m, z, w) {
        var a = m("./utils"), s = m("./external"), r = m("./utf8"), l = m("./zipEntries"), v = m("./stream/Crc32Probe"), c = m("./nodejsUtils");
        function _(y) {
          return new s.Promise(function(n, d) {
            var i = y.decompressed.getContentWorker().pipe(new v());
            i.on("error", function(f) {
              d(f);
            }).on("end", function() {
              i.streamInfo.crc32 !== y.decompressed.crc32 ? d(new Error("Corrupted zip : CRC32 mismatch")) : n();
            }).resume();
          });
        }
        z.exports = function(y, n) {
          var d = this;
          return n = a.extend(n || {}, { base64: !1, checkCRC32: !1, optimizedBinaryString: !1, createFolders: !1, decodeFileName: r.utf8decode }), c.isNode && c.isStream(y) ? s.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : a.prepareContent("the loaded zip file", y, !0, n.optimizedBinaryString, n.base64).then(function(i) {
            var f = new l(n);
            return f.load(i), f;
          }).then(function(i) {
            var f = [s.Promise.resolve(i)], o = i.files;
            if (n.checkCRC32) for (var g = 0; g < o.length; g++) f.push(_(o[g]));
            return s.Promise.all(f);
          }).then(function(i) {
            for (var f = i.shift(), o = f.files, g = 0; g < o.length; g++) {
              var k = o[g], C = k.fileNameStr, S = a.resolve(k.fileNameStr);
              d.file(S, k.decompressed, { binary: !0, optimizedBinaryString: !0, date: k.date, dir: k.dir, comment: k.fileCommentStr.length ? k.fileCommentStr : null, unixPermissions: k.unixPermissions, dosPermissions: k.dosPermissions, createFolders: n.createFolders }), k.dir || (d.file(S).unsafeOriginalName = C);
            }
            return f.zipComment.length && (d.comment = f.zipComment), d;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(m, z, w) {
        var a = m("../utils"), s = m("../stream/GenericWorker");
        function r(l, v) {
          s.call(this, "Nodejs stream input adapter for " + l), this._upstreamEnded = !1, this._bindStream(v);
        }
        a.inherits(r, s), r.prototype._bindStream = function(l) {
          var v = this;
          (this._stream = l).pause(), l.on("data", function(c) {
            v.push({ data: c, meta: { percent: 0 } });
          }).on("error", function(c) {
            v.isPaused ? this.generatedError = c : v.error(c);
          }).on("end", function() {
            v.isPaused ? v._upstreamEnded = !0 : v.end();
          });
        }, r.prototype.pause = function() {
          return !!s.prototype.pause.call(this) && (this._stream.pause(), !0);
        }, r.prototype.resume = function() {
          return !!s.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), !0);
        }, z.exports = r;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(m, z, w) {
        var a = m("readable-stream").Readable;
        function s(r, l, v) {
          a.call(this, l), this._helper = r;
          var c = this;
          r.on("data", function(_, y) {
            c.push(_) || c._helper.pause(), v && v(y);
          }).on("error", function(_) {
            c.emit("error", _);
          }).on("end", function() {
            c.push(null);
          });
        }
        m("../utils").inherits(s, a), s.prototype._read = function() {
          this._helper.resume();
        }, z.exports = s;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(m, z, w) {
        z.exports = { isNode: typeof Buffer < "u", newBufferFrom: function(a, s) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(a, s);
          if (typeof a == "number") throw new Error('The "data" argument must not be a number');
          return new Buffer(a, s);
        }, allocBuffer: function(a) {
          if (Buffer.alloc) return Buffer.alloc(a);
          var s = new Buffer(a);
          return s.fill(0), s;
        }, isBuffer: function(a) {
          return Buffer.isBuffer(a);
        }, isStream: function(a) {
          return a && typeof a.on == "function" && typeof a.pause == "function" && typeof a.resume == "function";
        } };
      }, {}], 15: [function(m, z, w) {
        function a(S, j, R) {
          var W, D = r.getTypeOf(j), H = r.extend(R || {}, c);
          H.date = H.date || /* @__PURE__ */ new Date(), H.compression !== null && (H.compression = H.compression.toUpperCase()), typeof H.unixPermissions == "string" && (H.unixPermissions = parseInt(H.unixPermissions, 8)), H.unixPermissions && 16384 & H.unixPermissions && (H.dir = !0), H.dosPermissions && 16 & H.dosPermissions && (H.dir = !0), H.dir && (S = o(S)), H.createFolders && (W = f(S)) && g.call(this, W, !0);
          var V = D === "string" && H.binary === !1 && H.base64 === !1;
          R && R.binary !== void 0 || (H.binary = !V), (j instanceof _ && j.uncompressedSize === 0 || H.dir || !j || j.length === 0) && (H.base64 = !1, H.binary = !0, j = "", H.compression = "STORE", D = "string");
          var b = null;
          b = j instanceof _ || j instanceof l ? j : d.isNode && d.isStream(j) ? new i(S, j) : r.prepareContent(S, j, H.binary, H.optimizedBinaryString, H.base64);
          var F = new y(S, b, H);
          this.files[S] = F;
        }
        var s = m("./utf8"), r = m("./utils"), l = m("./stream/GenericWorker"), v = m("./stream/StreamHelper"), c = m("./defaults"), _ = m("./compressedObject"), y = m("./zipObject"), n = m("./generate"), d = m("./nodejsUtils"), i = m("./nodejs/NodejsStreamInputAdapter"), f = function(S) {
          S.slice(-1) === "/" && (S = S.substring(0, S.length - 1));
          var j = S.lastIndexOf("/");
          return 0 < j ? S.substring(0, j) : "";
        }, o = function(S) {
          return S.slice(-1) !== "/" && (S += "/"), S;
        }, g = function(S, j) {
          return j = j !== void 0 ? j : c.createFolders, S = o(S), this.files[S] || a.call(this, S, null, { dir: !0, createFolders: j }), this.files[S];
        };
        function k(S) {
          return Object.prototype.toString.call(S) === "[object RegExp]";
        }
        var C = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(S) {
          var j, R, W;
          for (j in this.files) W = this.files[j], (R = j.slice(this.root.length, j.length)) && j.slice(0, this.root.length) === this.root && S(R, W);
        }, filter: function(S) {
          var j = [];
          return this.forEach(function(R, W) {
            S(R, W) && j.push(W);
          }), j;
        }, file: function(S, j, R) {
          if (arguments.length !== 1) return S = this.root + S, a.call(this, S, j, R), this;
          if (k(S)) {
            var W = S;
            return this.filter(function(H, V) {
              return !V.dir && W.test(H);
            });
          }
          var D = this.files[this.root + S];
          return D && !D.dir ? D : null;
        }, folder: function(S) {
          if (!S) return this;
          if (k(S)) return this.filter(function(D, H) {
            return H.dir && S.test(D);
          });
          var j = this.root + S, R = g.call(this, j), W = this.clone();
          return W.root = R.name, W;
        }, remove: function(S) {
          S = this.root + S;
          var j = this.files[S];
          if (j || (S.slice(-1) !== "/" && (S += "/"), j = this.files[S]), j && !j.dir) delete this.files[S];
          else for (var R = this.filter(function(D, H) {
            return H.name.slice(0, S.length) === S;
          }), W = 0; W < R.length; W++) delete this.files[R[W].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(S) {
          var j, R = {};
          try {
            if ((R = r.extend(S || {}, { streamFiles: !1, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: s.utf8encode })).type = R.type.toLowerCase(), R.compression = R.compression.toUpperCase(), R.type === "binarystring" && (R.type = "string"), !R.type) throw new Error("No output type specified.");
            r.checkSupport(R.type), R.platform !== "darwin" && R.platform !== "freebsd" && R.platform !== "linux" && R.platform !== "sunos" || (R.platform = "UNIX"), R.platform === "win32" && (R.platform = "DOS");
            var W = R.comment || this.comment || "";
            j = n.generateWorker(this, R, W);
          } catch (D) {
            (j = new l("error")).error(D);
          }
          return new v(j, R.type || "string", R.mimeType);
        }, generateAsync: function(S, j) {
          return this.generateInternalStream(S).accumulate(j);
        }, generateNodeStream: function(S, j) {
          return (S = S || {}).type || (S.type = "nodebuffer"), this.generateInternalStream(S).toNodejsStream(j);
        } };
        z.exports = C;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(m, z, w) {
        z.exports = m("stream");
      }, { stream: void 0 }], 17: [function(m, z, w) {
        var a = m("./DataReader");
        function s(r) {
          a.call(this, r);
          for (var l = 0; l < this.data.length; l++) r[l] = 255 & r[l];
        }
        m("../utils").inherits(s, a), s.prototype.byteAt = function(r) {
          return this.data[this.zero + r];
        }, s.prototype.lastIndexOfSignature = function(r) {
          for (var l = r.charCodeAt(0), v = r.charCodeAt(1), c = r.charCodeAt(2), _ = r.charCodeAt(3), y = this.length - 4; 0 <= y; --y) if (this.data[y] === l && this.data[y + 1] === v && this.data[y + 2] === c && this.data[y + 3] === _) return y - this.zero;
          return -1;
        }, s.prototype.readAndCheckSignature = function(r) {
          var l = r.charCodeAt(0), v = r.charCodeAt(1), c = r.charCodeAt(2), _ = r.charCodeAt(3), y = this.readData(4);
          return l === y[0] && v === y[1] && c === y[2] && _ === y[3];
        }, s.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return [];
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, z.exports = s;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(m, z, w) {
        var a = m("../utils");
        function s(r) {
          this.data = r, this.length = r.length, this.index = 0, this.zero = 0;
        }
        s.prototype = { checkOffset: function(r) {
          this.checkIndex(this.index + r);
        }, checkIndex: function(r) {
          if (this.length < this.zero + r || r < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + r + "). Corrupted zip ?");
        }, setIndex: function(r) {
          this.checkIndex(r), this.index = r;
        }, skip: function(r) {
          this.setIndex(this.index + r);
        }, byteAt: function() {
        }, readInt: function(r) {
          var l, v = 0;
          for (this.checkOffset(r), l = this.index + r - 1; l >= this.index; l--) v = (v << 8) + this.byteAt(l);
          return this.index += r, v;
        }, readString: function(r) {
          return a.transformTo("string", this.readData(r));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var r = this.readInt(4);
          return new Date(Date.UTC(1980 + (r >> 25 & 127), (r >> 21 & 15) - 1, r >> 16 & 31, r >> 11 & 31, r >> 5 & 63, (31 & r) << 1));
        } }, z.exports = s;
      }, { "../utils": 32 }], 19: [function(m, z, w) {
        var a = m("./Uint8ArrayReader");
        function s(r) {
          a.call(this, r);
        }
        m("../utils").inherits(s, a), s.prototype.readData = function(r) {
          this.checkOffset(r);
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, z.exports = s;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(m, z, w) {
        var a = m("./DataReader");
        function s(r) {
          a.call(this, r);
        }
        m("../utils").inherits(s, a), s.prototype.byteAt = function(r) {
          return this.data.charCodeAt(this.zero + r);
        }, s.prototype.lastIndexOfSignature = function(r) {
          return this.data.lastIndexOf(r) - this.zero;
        }, s.prototype.readAndCheckSignature = function(r) {
          return r === this.readData(4);
        }, s.prototype.readData = function(r) {
          this.checkOffset(r);
          var l = this.data.slice(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, z.exports = s;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(m, z, w) {
        var a = m("./ArrayReader");
        function s(r) {
          a.call(this, r);
        }
        m("../utils").inherits(s, a), s.prototype.readData = function(r) {
          if (this.checkOffset(r), r === 0) return new Uint8Array(0);
          var l = this.data.subarray(this.zero + this.index, this.zero + this.index + r);
          return this.index += r, l;
        }, z.exports = s;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(m, z, w) {
        var a = m("../utils"), s = m("../support"), r = m("./ArrayReader"), l = m("./StringReader"), v = m("./NodeBufferReader"), c = m("./Uint8ArrayReader");
        z.exports = function(_) {
          var y = a.getTypeOf(_);
          return a.checkSupport(y), y !== "string" || s.uint8array ? y === "nodebuffer" ? new v(_) : s.uint8array ? new c(a.transformTo("uint8array", _)) : new r(a.transformTo("array", _)) : new l(_);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(m, z, w) {
        w.LOCAL_FILE_HEADER = "PK", w.CENTRAL_FILE_HEADER = "PK", w.CENTRAL_DIRECTORY_END = "PK", w.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", w.ZIP64_CENTRAL_DIRECTORY_END = "PK", w.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(m, z, w) {
        var a = m("./GenericWorker"), s = m("../utils");
        function r(l) {
          a.call(this, "ConvertWorker to " + l), this.destType = l;
        }
        s.inherits(r, a), r.prototype.processChunk = function(l) {
          this.push({ data: s.transformTo(this.destType, l.data), meta: l.meta });
        }, z.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(m, z, w) {
        var a = m("./GenericWorker"), s = m("../crc32");
        function r() {
          a.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        m("../utils").inherits(r, a), r.prototype.processChunk = function(l) {
          this.streamInfo.crc32 = s(l.data, this.streamInfo.crc32 || 0), this.push(l);
        }, z.exports = r;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(m, z, w) {
        var a = m("../utils"), s = m("./GenericWorker");
        function r(l) {
          s.call(this, "DataLengthProbe for " + l), this.propName = l, this.withStreamInfo(l, 0);
        }
        a.inherits(r, s), r.prototype.processChunk = function(l) {
          if (l) {
            var v = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = v + l.data.length;
          }
          s.prototype.processChunk.call(this, l);
        }, z.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(m, z, w) {
        var a = m("../utils"), s = m("./GenericWorker");
        function r(l) {
          s.call(this, "DataWorker");
          var v = this;
          this.dataIsReady = !1, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = !1, l.then(function(c) {
            v.dataIsReady = !0, v.data = c, v.max = c && c.length || 0, v.type = a.getTypeOf(c), v.isPaused || v._tickAndRepeat();
          }, function(c) {
            v.error(c);
          });
        }
        a.inherits(r, s), r.prototype.cleanUp = function() {
          s.prototype.cleanUp.call(this), this.data = null;
        }, r.prototype.resume = function() {
          return !!s.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = !0, a.delay(this._tickAndRepeat, [], this)), !0);
        }, r.prototype._tickAndRepeat = function() {
          this._tickScheduled = !1, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (a.delay(this._tickAndRepeat, [], this), this._tickScheduled = !0));
        }, r.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return !1;
          var l = null, v = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              l = this.data.substring(this.index, v);
              break;
            case "uint8array":
              l = this.data.subarray(this.index, v);
              break;
            case "array":
            case "nodebuffer":
              l = this.data.slice(this.index, v);
          }
          return this.index = v, this.push({ data: l, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, z.exports = r;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(m, z, w) {
        function a(s) {
          this.name = s || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = !0, this.isFinished = !1, this.isLocked = !1, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        a.prototype = { push: function(s) {
          this.emit("data", s);
        }, end: function() {
          if (this.isFinished) return !1;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = !0;
          } catch (s) {
            this.emit("error", s);
          }
          return !0;
        }, error: function(s) {
          return !this.isFinished && (this.isPaused ? this.generatedError = s : (this.isFinished = !0, this.emit("error", s), this.previous && this.previous.error(s), this.cleanUp()), !0);
        }, on: function(s, r) {
          return this._listeners[s].push(r), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(s, r) {
          if (this._listeners[s]) for (var l = 0; l < this._listeners[s].length; l++) this._listeners[s][l].call(this, r);
        }, pipe: function(s) {
          return s.registerPrevious(this);
        }, registerPrevious: function(s) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = s.streamInfo, this.mergeStreamInfo(), this.previous = s;
          var r = this;
          return s.on("data", function(l) {
            r.processChunk(l);
          }), s.on("end", function() {
            r.end();
          }), s.on("error", function(l) {
            r.error(l);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = !0, this.previous && this.previous.pause(), !0);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return !1;
          var s = this.isPaused = !1;
          return this.generatedError && (this.error(this.generatedError), s = !0), this.previous && this.previous.resume(), !s;
        }, flush: function() {
        }, processChunk: function(s) {
          this.push(s);
        }, withStreamInfo: function(s, r) {
          return this.extraStreamInfo[s] = r, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var s in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, s) && (this.streamInfo[s] = this.extraStreamInfo[s]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = !0, this.previous && this.previous.lock();
        }, toString: function() {
          var s = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + s : s;
        } }, z.exports = a;
      }, {}], 29: [function(m, z, w) {
        var a = m("../utils"), s = m("./ConvertWorker"), r = m("./GenericWorker"), l = m("../base64"), v = m("../support"), c = m("../external"), _ = null;
        if (v.nodestream) try {
          _ = m("../nodejs/NodejsStreamOutputAdapter");
        } catch {
        }
        function y(d, i) {
          return new c.Promise(function(f, o) {
            var g = [], k = d._internalType, C = d._outputType, S = d._mimeType;
            d.on("data", function(j, R) {
              g.push(j), i && i(R);
            }).on("error", function(j) {
              g = [], o(j);
            }).on("end", function() {
              try {
                var j = (function(R, W, D) {
                  switch (R) {
                    case "blob":
                      return a.newBlob(a.transformTo("arraybuffer", W), D);
                    case "base64":
                      return l.encode(W);
                    default:
                      return a.transformTo(R, W);
                  }
                })(C, (function(R, W) {
                  var D, H = 0, V = null, b = 0;
                  for (D = 0; D < W.length; D++) b += W[D].length;
                  switch (R) {
                    case "string":
                      return W.join("");
                    case "array":
                      return Array.prototype.concat.apply([], W);
                    case "uint8array":
                      for (V = new Uint8Array(b), D = 0; D < W.length; D++) V.set(W[D], H), H += W[D].length;
                      return V;
                    case "nodebuffer":
                      return Buffer.concat(W);
                    default:
                      throw new Error("concat : unsupported type '" + R + "'");
                  }
                })(k, g), S);
                f(j);
              } catch (R) {
                o(R);
              }
              g = [];
            }).resume();
          });
        }
        function n(d, i, f) {
          var o = i;
          switch (i) {
            case "blob":
            case "arraybuffer":
              o = "uint8array";
              break;
            case "base64":
              o = "string";
          }
          try {
            this._internalType = o, this._outputType = i, this._mimeType = f, a.checkSupport(o), this._worker = d.pipe(new s(o)), d.lock();
          } catch (g) {
            this._worker = new r("error"), this._worker.error(g);
          }
        }
        n.prototype = { accumulate: function(d) {
          return y(this, d);
        }, on: function(d, i) {
          var f = this;
          return d === "data" ? this._worker.on(d, function(o) {
            i.call(f, o.data, o.meta);
          }) : this._worker.on(d, function() {
            a.delay(i, arguments, f);
          }), this;
        }, resume: function() {
          return a.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(d) {
          if (a.checkSupport("nodestream"), this._outputType !== "nodebuffer") throw new Error(this._outputType + " is not supported by this method");
          return new _(this, { objectMode: this._outputType !== "nodebuffer" }, d);
        } }, z.exports = n;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(m, z, w) {
        if (w.base64 = !0, w.array = !0, w.string = !0, w.arraybuffer = typeof ArrayBuffer < "u" && typeof Uint8Array < "u", w.nodebuffer = typeof Buffer < "u", w.uint8array = typeof Uint8Array < "u", typeof ArrayBuffer > "u") w.blob = !1;
        else {
          var a = new ArrayBuffer(0);
          try {
            w.blob = new Blob([a], { type: "application/zip" }).size === 0;
          } catch {
            try {
              var s = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              s.append(a), w.blob = s.getBlob("application/zip").size === 0;
            } catch {
              w.blob = !1;
            }
          }
        }
        try {
          w.nodestream = !!m("readable-stream").Readable;
        } catch {
          w.nodestream = !1;
        }
      }, { "readable-stream": 16 }], 31: [function(m, z, w) {
        for (var a = m("./utils"), s = m("./support"), r = m("./nodejsUtils"), l = m("./stream/GenericWorker"), v = new Array(256), c = 0; c < 256; c++) v[c] = 252 <= c ? 6 : 248 <= c ? 5 : 240 <= c ? 4 : 224 <= c ? 3 : 192 <= c ? 2 : 1;
        v[254] = v[254] = 1;
        function _() {
          l.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function y() {
          l.call(this, "utf-8 encode");
        }
        w.utf8encode = function(n) {
          return s.nodebuffer ? r.newBufferFrom(n, "utf-8") : (function(d) {
            var i, f, o, g, k, C = d.length, S = 0;
            for (g = 0; g < C; g++) (64512 & (f = d.charCodeAt(g))) == 55296 && g + 1 < C && (64512 & (o = d.charCodeAt(g + 1))) == 56320 && (f = 65536 + (f - 55296 << 10) + (o - 56320), g++), S += f < 128 ? 1 : f < 2048 ? 2 : f < 65536 ? 3 : 4;
            for (i = s.uint8array ? new Uint8Array(S) : new Array(S), g = k = 0; k < S; g++) (64512 & (f = d.charCodeAt(g))) == 55296 && g + 1 < C && (64512 & (o = d.charCodeAt(g + 1))) == 56320 && (f = 65536 + (f - 55296 << 10) + (o - 56320), g++), f < 128 ? i[k++] = f : (f < 2048 ? i[k++] = 192 | f >>> 6 : (f < 65536 ? i[k++] = 224 | f >>> 12 : (i[k++] = 240 | f >>> 18, i[k++] = 128 | f >>> 12 & 63), i[k++] = 128 | f >>> 6 & 63), i[k++] = 128 | 63 & f);
            return i;
          })(n);
        }, w.utf8decode = function(n) {
          return s.nodebuffer ? a.transformTo("nodebuffer", n).toString("utf-8") : (function(d) {
            var i, f, o, g, k = d.length, C = new Array(2 * k);
            for (i = f = 0; i < k; ) if ((o = d[i++]) < 128) C[f++] = o;
            else if (4 < (g = v[o])) C[f++] = 65533, i += g - 1;
            else {
              for (o &= g === 2 ? 31 : g === 3 ? 15 : 7; 1 < g && i < k; ) o = o << 6 | 63 & d[i++], g--;
              1 < g ? C[f++] = 65533 : o < 65536 ? C[f++] = o : (o -= 65536, C[f++] = 55296 | o >> 10 & 1023, C[f++] = 56320 | 1023 & o);
            }
            return C.length !== f && (C.subarray ? C = C.subarray(0, f) : C.length = f), a.applyFromCharCode(C);
          })(n = a.transformTo(s.uint8array ? "uint8array" : "array", n));
        }, a.inherits(_, l), _.prototype.processChunk = function(n) {
          var d = a.transformTo(s.uint8array ? "uint8array" : "array", n.data);
          if (this.leftOver && this.leftOver.length) {
            if (s.uint8array) {
              var i = d;
              (d = new Uint8Array(i.length + this.leftOver.length)).set(this.leftOver, 0), d.set(i, this.leftOver.length);
            } else d = this.leftOver.concat(d);
            this.leftOver = null;
          }
          var f = (function(g, k) {
            var C;
            for ((k = k || g.length) > g.length && (k = g.length), C = k - 1; 0 <= C && (192 & g[C]) == 128; ) C--;
            return C < 0 || C === 0 ? k : C + v[g[C]] > k ? C : k;
          })(d), o = d;
          f !== d.length && (s.uint8array ? (o = d.subarray(0, f), this.leftOver = d.subarray(f, d.length)) : (o = d.slice(0, f), this.leftOver = d.slice(f, d.length))), this.push({ data: w.utf8decode(o), meta: n.meta });
        }, _.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: w.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, w.Utf8DecodeWorker = _, a.inherits(y, l), y.prototype.processChunk = function(n) {
          this.push({ data: w.utf8encode(n.data), meta: n.meta });
        }, w.Utf8EncodeWorker = y;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(m, z, w) {
        var a = m("./support"), s = m("./base64"), r = m("./nodejsUtils"), l = m("./external");
        function v(i) {
          return i;
        }
        function c(i, f) {
          for (var o = 0; o < i.length; ++o) f[o] = 255 & i.charCodeAt(o);
          return f;
        }
        m("setimmediate"), w.newBlob = function(i, f) {
          w.checkSupport("blob");
          try {
            return new Blob([i], { type: f });
          } catch {
            try {
              var o = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return o.append(i), o.getBlob(f);
            } catch {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var _ = { stringifyByChunk: function(i, f, o) {
          var g = [], k = 0, C = i.length;
          if (C <= o) return String.fromCharCode.apply(null, i);
          for (; k < C; ) f === "array" || f === "nodebuffer" ? g.push(String.fromCharCode.apply(null, i.slice(k, Math.min(k + o, C)))) : g.push(String.fromCharCode.apply(null, i.subarray(k, Math.min(k + o, C)))), k += o;
          return g.join("");
        }, stringifyByChar: function(i) {
          for (var f = "", o = 0; o < i.length; o++) f += String.fromCharCode(i[o]);
          return f;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return a.uint8array && String.fromCharCode.apply(null, new Uint8Array(1)).length === 1;
          } catch {
            return !1;
          }
        })(), nodebuffer: (function() {
          try {
            return a.nodebuffer && String.fromCharCode.apply(null, r.allocBuffer(1)).length === 1;
          } catch {
            return !1;
          }
        })() } };
        function y(i) {
          var f = 65536, o = w.getTypeOf(i), g = !0;
          if (o === "uint8array" ? g = _.applyCanBeUsed.uint8array : o === "nodebuffer" && (g = _.applyCanBeUsed.nodebuffer), g) for (; 1 < f; ) try {
            return _.stringifyByChunk(i, o, f);
          } catch {
            f = Math.floor(f / 2);
          }
          return _.stringifyByChar(i);
        }
        function n(i, f) {
          for (var o = 0; o < i.length; o++) f[o] = i[o];
          return f;
        }
        w.applyFromCharCode = y;
        var d = {};
        d.string = { string: v, array: function(i) {
          return c(i, new Array(i.length));
        }, arraybuffer: function(i) {
          return d.string.uint8array(i).buffer;
        }, uint8array: function(i) {
          return c(i, new Uint8Array(i.length));
        }, nodebuffer: function(i) {
          return c(i, r.allocBuffer(i.length));
        } }, d.array = { string: y, array: v, arraybuffer: function(i) {
          return new Uint8Array(i).buffer;
        }, uint8array: function(i) {
          return new Uint8Array(i);
        }, nodebuffer: function(i) {
          return r.newBufferFrom(i);
        } }, d.arraybuffer = { string: function(i) {
          return y(new Uint8Array(i));
        }, array: function(i) {
          return n(new Uint8Array(i), new Array(i.byteLength));
        }, arraybuffer: v, uint8array: function(i) {
          return new Uint8Array(i);
        }, nodebuffer: function(i) {
          return r.newBufferFrom(new Uint8Array(i));
        } }, d.uint8array = { string: y, array: function(i) {
          return n(i, new Array(i.length));
        }, arraybuffer: function(i) {
          return i.buffer;
        }, uint8array: v, nodebuffer: function(i) {
          return r.newBufferFrom(i);
        } }, d.nodebuffer = { string: y, array: function(i) {
          return n(i, new Array(i.length));
        }, arraybuffer: function(i) {
          return d.nodebuffer.uint8array(i).buffer;
        }, uint8array: function(i) {
          return n(i, new Uint8Array(i.length));
        }, nodebuffer: v }, w.transformTo = function(i, f) {
          if (f = f || "", !i) return f;
          w.checkSupport(i);
          var o = w.getTypeOf(f);
          return d[o][i](f);
        }, w.resolve = function(i) {
          for (var f = i.split("/"), o = [], g = 0; g < f.length; g++) {
            var k = f[g];
            k === "." || k === "" && g !== 0 && g !== f.length - 1 || (k === ".." ? o.pop() : o.push(k));
          }
          return o.join("/");
        }, w.getTypeOf = function(i) {
          return typeof i == "string" ? "string" : Object.prototype.toString.call(i) === "[object Array]" ? "array" : a.nodebuffer && r.isBuffer(i) ? "nodebuffer" : a.uint8array && i instanceof Uint8Array ? "uint8array" : a.arraybuffer && i instanceof ArrayBuffer ? "arraybuffer" : void 0;
        }, w.checkSupport = function(i) {
          if (!a[i.toLowerCase()]) throw new Error(i + " is not supported by this platform");
        }, w.MAX_VALUE_16BITS = 65535, w.MAX_VALUE_32BITS = -1, w.pretty = function(i) {
          var f, o, g = "";
          for (o = 0; o < (i || "").length; o++) g += "\\x" + ((f = i.charCodeAt(o)) < 16 ? "0" : "") + f.toString(16).toUpperCase();
          return g;
        }, w.delay = function(i, f, o) {
          setImmediate(function() {
            i.apply(o || null, f || []);
          });
        }, w.inherits = function(i, f) {
          function o() {
          }
          o.prototype = f.prototype, i.prototype = new o();
        }, w.extend = function() {
          var i, f, o = {};
          for (i = 0; i < arguments.length; i++) for (f in arguments[i]) Object.prototype.hasOwnProperty.call(arguments[i], f) && o[f] === void 0 && (o[f] = arguments[i][f]);
          return o;
        }, w.prepareContent = function(i, f, o, g, k) {
          return l.Promise.resolve(f).then(function(C) {
            return a.blob && (C instanceof Blob || ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(C)) !== -1) && typeof FileReader < "u" ? new l.Promise(function(S, j) {
              var R = new FileReader();
              R.onload = function(W) {
                S(W.target.result);
              }, R.onerror = function(W) {
                j(W.target.error);
              }, R.readAsArrayBuffer(C);
            }) : C;
          }).then(function(C) {
            var S = w.getTypeOf(C);
            return S ? (S === "arraybuffer" ? C = w.transformTo("uint8array", C) : S === "string" && (k ? C = s.decode(C) : o && g !== !0 && (C = (function(j) {
              return c(j, a.uint8array ? new Uint8Array(j.length) : new Array(j.length));
            })(C))), C) : l.Promise.reject(new Error("Can't read the data of '" + i + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(m, z, w) {
        var a = m("./reader/readerFor"), s = m("./utils"), r = m("./signature"), l = m("./zipEntry"), v = m("./support");
        function c(_) {
          this.files = [], this.loadOptions = _;
        }
        c.prototype = { checkSignature: function(_) {
          if (!this.reader.readAndCheckSignature(_)) {
            this.reader.index -= 4;
            var y = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + s.pretty(y) + ", expected " + s.pretty(_) + ")");
          }
        }, isSignature: function(_, y) {
          var n = this.reader.index;
          this.reader.setIndex(_);
          var d = this.reader.readString(4) === y;
          return this.reader.setIndex(n), d;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var _ = this.reader.readData(this.zipCommentLength), y = v.uint8array ? "uint8array" : "array", n = s.transformTo(y, _);
          this.zipComment = this.loadOptions.decodeFileName(n);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var _, y, n, d = this.zip64EndOfCentralSize - 44; 0 < d; ) _ = this.reader.readInt(2), y = this.reader.readInt(4), n = this.reader.readData(y), this.zip64ExtensibleData[_] = { id: _, length: y, value: n };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var _, y;
          for (_ = 0; _ < this.files.length; _++) y = this.files[_], this.reader.setIndex(y.localHeaderOffset), this.checkSignature(r.LOCAL_FILE_HEADER), y.readLocalPart(this.reader), y.handleUTF8(), y.processAttributes();
        }, readCentralDir: function() {
          var _;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(r.CENTRAL_FILE_HEADER); ) (_ = new l({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(_);
          if (this.centralDirRecords !== this.files.length && this.centralDirRecords !== 0 && this.files.length === 0) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var _ = this.reader.lastIndexOfSignature(r.CENTRAL_DIRECTORY_END);
          if (_ < 0) throw this.isSignature(0, r.LOCAL_FILE_HEADER) ? new Error("Corrupted zip: can't find end of central directory") : new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html");
          this.reader.setIndex(_);
          var y = _;
          if (this.checkSignature(r.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === s.MAX_VALUE_16BITS || this.diskWithCentralDirStart === s.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === s.MAX_VALUE_16BITS || this.centralDirRecords === s.MAX_VALUE_16BITS || this.centralDirSize === s.MAX_VALUE_32BITS || this.centralDirOffset === s.MAX_VALUE_32BITS) {
            if (this.zip64 = !0, (_ = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(_), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, r.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(r.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var n = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (n += 20, n += 12 + this.zip64EndOfCentralSize);
          var d = y - n;
          if (0 < d) this.isSignature(y, r.CENTRAL_FILE_HEADER) || (this.reader.zero = d);
          else if (d < 0) throw new Error("Corrupted zip: missing " + Math.abs(d) + " bytes.");
        }, prepareReader: function(_) {
          this.reader = a(_);
        }, load: function(_) {
          this.prepareReader(_), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, z.exports = c;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(m, z, w) {
        var a = m("./reader/readerFor"), s = m("./utils"), r = m("./compressedObject"), l = m("./crc32"), v = m("./utf8"), c = m("./compressions"), _ = m("./support");
        function y(n, d) {
          this.options = n, this.loadOptions = d;
        }
        y.prototype = { isEncrypted: function() {
          return (1 & this.bitFlag) == 1;
        }, useUTF8: function() {
          return (2048 & this.bitFlag) == 2048;
        }, readLocalPart: function(n) {
          var d, i;
          if (n.skip(22), this.fileNameLength = n.readInt(2), i = n.readInt(2), this.fileName = n.readData(this.fileNameLength), n.skip(i), this.compressedSize === -1 || this.uncompressedSize === -1) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if ((d = (function(f) {
            for (var o in c) if (Object.prototype.hasOwnProperty.call(c, o) && c[o].magic === f) return c[o];
            return null;
          })(this.compressionMethod)) === null) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new r(this.compressedSize, this.uncompressedSize, this.crc32, d, n.readData(this.compressedSize));
        }, readCentralPart: function(n) {
          this.versionMadeBy = n.readInt(2), n.skip(2), this.bitFlag = n.readInt(2), this.compressionMethod = n.readString(2), this.date = n.readDate(), this.crc32 = n.readInt(4), this.compressedSize = n.readInt(4), this.uncompressedSize = n.readInt(4);
          var d = n.readInt(2);
          if (this.extraFieldsLength = n.readInt(2), this.fileCommentLength = n.readInt(2), this.diskNumberStart = n.readInt(2), this.internalFileAttributes = n.readInt(2), this.externalFileAttributes = n.readInt(4), this.localHeaderOffset = n.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          n.skip(d), this.readExtraFields(n), this.parseZIP64ExtraField(n), this.fileComment = n.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var n = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), n == 0 && (this.dosPermissions = 63 & this.externalFileAttributes), n == 3 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || this.fileNameStr.slice(-1) !== "/" || (this.dir = !0);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var n = a(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = n.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = n.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = n.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = n.readInt(4));
          }
        }, readExtraFields: function(n) {
          var d, i, f, o = n.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); n.index + 4 < o; ) d = n.readInt(2), i = n.readInt(2), f = n.readData(i), this.extraFields[d] = { id: d, length: i, value: f };
          n.setIndex(o);
        }, handleUTF8: function() {
          var n = _.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = v.utf8decode(this.fileName), this.fileCommentStr = v.utf8decode(this.fileComment);
          else {
            var d = this.findExtraFieldUnicodePath();
            if (d !== null) this.fileNameStr = d;
            else {
              var i = s.transformTo(n, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(i);
            }
            var f = this.findExtraFieldUnicodeComment();
            if (f !== null) this.fileCommentStr = f;
            else {
              var o = s.transformTo(n, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(o);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var n = this.extraFields[28789];
          if (n) {
            var d = a(n.value);
            return d.readInt(1) !== 1 || l(this.fileName) !== d.readInt(4) ? null : v.utf8decode(d.readData(n.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var n = this.extraFields[25461];
          if (n) {
            var d = a(n.value);
            return d.readInt(1) !== 1 || l(this.fileComment) !== d.readInt(4) ? null : v.utf8decode(d.readData(n.length - 5));
          }
          return null;
        } }, z.exports = y;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(m, z, w) {
        function a(d, i, f) {
          this.name = d, this.dir = f.dir, this.date = f.date, this.comment = f.comment, this.unixPermissions = f.unixPermissions, this.dosPermissions = f.dosPermissions, this._data = i, this._dataBinary = f.binary, this.options = { compression: f.compression, compressionOptions: f.compressionOptions };
        }
        var s = m("./stream/StreamHelper"), r = m("./stream/DataWorker"), l = m("./utf8"), v = m("./compressedObject"), c = m("./stream/GenericWorker");
        a.prototype = { internalStream: function(d) {
          var i = null, f = "string";
          try {
            if (!d) throw new Error("No output type specified.");
            var o = (f = d.toLowerCase()) === "string" || f === "text";
            f !== "binarystring" && f !== "text" || (f = "string"), i = this._decompressWorker();
            var g = !this._dataBinary;
            g && !o && (i = i.pipe(new l.Utf8EncodeWorker())), !g && o && (i = i.pipe(new l.Utf8DecodeWorker()));
          } catch (k) {
            (i = new c("error")).error(k);
          }
          return new s(i, f, "");
        }, async: function(d, i) {
          return this.internalStream(d).accumulate(i);
        }, nodeStream: function(d, i) {
          return this.internalStream(d || "nodebuffer").toNodejsStream(i);
        }, _compressWorker: function(d, i) {
          if (this._data instanceof v && this._data.compression.magic === d.magic) return this._data.getCompressedWorker();
          var f = this._decompressWorker();
          return this._dataBinary || (f = f.pipe(new l.Utf8EncodeWorker())), v.createWorkerFrom(f, d, i);
        }, _decompressWorker: function() {
          return this._data instanceof v ? this._data.getContentWorker() : this._data instanceof c ? this._data : new r(this._data);
        } };
        for (var _ = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], y = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, n = 0; n < _.length; n++) a.prototype[_[n]] = y;
        z.exports = a;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(m, z, w) {
        (function(a) {
          var s, r, l = a.MutationObserver || a.WebKitMutationObserver;
          if (l) {
            var v = 0, c = new l(d), _ = a.document.createTextNode("");
            c.observe(_, { characterData: !0 }), s = function() {
              _.data = v = ++v % 2;
            };
          } else if (a.setImmediate || a.MessageChannel === void 0) s = "document" in a && "onreadystatechange" in a.document.createElement("script") ? function() {
            var i = a.document.createElement("script");
            i.onreadystatechange = function() {
              d(), i.onreadystatechange = null, i.parentNode.removeChild(i), i = null;
            }, a.document.documentElement.appendChild(i);
          } : function() {
            setTimeout(d, 0);
          };
          else {
            var y = new a.MessageChannel();
            y.port1.onmessage = d, s = function() {
              y.port2.postMessage(0);
            };
          }
          var n = [];
          function d() {
            var i, f;
            r = !0;
            for (var o = n.length; o; ) {
              for (f = n, n = [], i = -1; ++i < o; ) f[i]();
              o = n.length;
            }
            r = !1;
          }
          z.exports = function(i) {
            n.push(i) !== 1 || r || s();
          };
        }).call(this, typeof yt < "u" ? yt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 37: [function(m, z, w) {
        var a = m("immediate");
        function s() {
        }
        var r = {}, l = ["REJECTED"], v = ["FULFILLED"], c = ["PENDING"];
        function _(o) {
          if (typeof o != "function") throw new TypeError("resolver must be a function");
          this.state = c, this.queue = [], this.outcome = void 0, o !== s && i(this, o);
        }
        function y(o, g, k) {
          this.promise = o, typeof g == "function" && (this.onFulfilled = g, this.callFulfilled = this.otherCallFulfilled), typeof k == "function" && (this.onRejected = k, this.callRejected = this.otherCallRejected);
        }
        function n(o, g, k) {
          a(function() {
            var C;
            try {
              C = g(k);
            } catch (S) {
              return r.reject(o, S);
            }
            C === o ? r.reject(o, new TypeError("Cannot resolve promise with itself")) : r.resolve(o, C);
          });
        }
        function d(o) {
          var g = o && o.then;
          if (o && (typeof o == "object" || typeof o == "function") && typeof g == "function") return function() {
            g.apply(o, arguments);
          };
        }
        function i(o, g) {
          var k = !1;
          function C(R) {
            k || (k = !0, r.reject(o, R));
          }
          function S(R) {
            k || (k = !0, r.resolve(o, R));
          }
          var j = f(function() {
            g(S, C);
          });
          j.status === "error" && C(j.value);
        }
        function f(o, g) {
          var k = {};
          try {
            k.value = o(g), k.status = "success";
          } catch (C) {
            k.status = "error", k.value = C;
          }
          return k;
        }
        (z.exports = _).prototype.finally = function(o) {
          if (typeof o != "function") return this;
          var g = this.constructor;
          return this.then(function(k) {
            return g.resolve(o()).then(function() {
              return k;
            });
          }, function(k) {
            return g.resolve(o()).then(function() {
              throw k;
            });
          });
        }, _.prototype.catch = function(o) {
          return this.then(null, o);
        }, _.prototype.then = function(o, g) {
          if (typeof o != "function" && this.state === v || typeof g != "function" && this.state === l) return this;
          var k = new this.constructor(s);
          return this.state !== c ? n(k, this.state === v ? o : g, this.outcome) : this.queue.push(new y(k, o, g)), k;
        }, y.prototype.callFulfilled = function(o) {
          r.resolve(this.promise, o);
        }, y.prototype.otherCallFulfilled = function(o) {
          n(this.promise, this.onFulfilled, o);
        }, y.prototype.callRejected = function(o) {
          r.reject(this.promise, o);
        }, y.prototype.otherCallRejected = function(o) {
          n(this.promise, this.onRejected, o);
        }, r.resolve = function(o, g) {
          var k = f(d, g);
          if (k.status === "error") return r.reject(o, k.value);
          var C = k.value;
          if (C) i(o, C);
          else {
            o.state = v, o.outcome = g;
            for (var S = -1, j = o.queue.length; ++S < j; ) o.queue[S].callFulfilled(g);
          }
          return o;
        }, r.reject = function(o, g) {
          o.state = l, o.outcome = g;
          for (var k = -1, C = o.queue.length; ++k < C; ) o.queue[k].callRejected(g);
          return o;
        }, _.resolve = function(o) {
          return o instanceof this ? o : r.resolve(new this(s), o);
        }, _.reject = function(o) {
          var g = new this(s);
          return r.reject(g, o);
        }, _.all = function(o) {
          var g = this;
          if (Object.prototype.toString.call(o) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var k = o.length, C = !1;
          if (!k) return this.resolve([]);
          for (var S = new Array(k), j = 0, R = -1, W = new this(s); ++R < k; ) D(o[R], R);
          return W;
          function D(H, V) {
            g.resolve(H).then(function(b) {
              S[V] = b, ++j !== k || C || (C = !0, r.resolve(W, S));
            }, function(b) {
              C || (C = !0, r.reject(W, b));
            });
          }
        }, _.race = function(o) {
          var g = this;
          if (Object.prototype.toString.call(o) !== "[object Array]") return this.reject(new TypeError("must be an array"));
          var k = o.length, C = !1;
          if (!k) return this.resolve([]);
          for (var S = -1, j = new this(s); ++S < k; ) R = o[S], g.resolve(R).then(function(W) {
            C || (C = !0, r.resolve(j, W));
          }, function(W) {
            C || (C = !0, r.reject(j, W));
          });
          var R;
          return j;
        };
      }, { immediate: 36 }], 38: [function(m, z, w) {
        var a = {};
        (0, m("./lib/utils/common").assign)(a, m("./lib/deflate"), m("./lib/inflate"), m("./lib/zlib/constants")), z.exports = a;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(m, z, w) {
        var a = m("./zlib/deflate"), s = m("./utils/common"), r = m("./utils/strings"), l = m("./zlib/messages"), v = m("./zlib/zstream"), c = Object.prototype.toString, _ = 0, y = -1, n = 0, d = 8;
        function i(o) {
          if (!(this instanceof i)) return new i(o);
          this.options = s.assign({ level: y, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: n, to: "" }, o || {});
          var g = this.options;
          g.raw && 0 < g.windowBits ? g.windowBits = -g.windowBits : g.gzip && 0 < g.windowBits && g.windowBits < 16 && (g.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new v(), this.strm.avail_out = 0;
          var k = a.deflateInit2(this.strm, g.level, g.method, g.windowBits, g.memLevel, g.strategy);
          if (k !== _) throw new Error(l[k]);
          if (g.header && a.deflateSetHeader(this.strm, g.header), g.dictionary) {
            var C;
            if (C = typeof g.dictionary == "string" ? r.string2buf(g.dictionary) : c.call(g.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(g.dictionary) : g.dictionary, (k = a.deflateSetDictionary(this.strm, C)) !== _) throw new Error(l[k]);
            this._dict_set = !0;
          }
        }
        function f(o, g) {
          var k = new i(g);
          if (k.push(o, !0), k.err) throw k.msg || l[k.err];
          return k.result;
        }
        i.prototype.push = function(o, g) {
          var k, C, S = this.strm, j = this.options.chunkSize;
          if (this.ended) return !1;
          C = g === ~~g ? g : g === !0 ? 4 : 0, typeof o == "string" ? S.input = r.string2buf(o) : c.call(o) === "[object ArrayBuffer]" ? S.input = new Uint8Array(o) : S.input = o, S.next_in = 0, S.avail_in = S.input.length;
          do {
            if (S.avail_out === 0 && (S.output = new s.Buf8(j), S.next_out = 0, S.avail_out = j), (k = a.deflate(S, C)) !== 1 && k !== _) return this.onEnd(k), !(this.ended = !0);
            S.avail_out !== 0 && (S.avail_in !== 0 || C !== 4 && C !== 2) || (this.options.to === "string" ? this.onData(r.buf2binstring(s.shrinkBuf(S.output, S.next_out))) : this.onData(s.shrinkBuf(S.output, S.next_out)));
          } while ((0 < S.avail_in || S.avail_out === 0) && k !== 1);
          return C === 4 ? (k = a.deflateEnd(this.strm), this.onEnd(k), this.ended = !0, k === _) : C !== 2 || (this.onEnd(_), !(S.avail_out = 0));
        }, i.prototype.onData = function(o) {
          this.chunks.push(o);
        }, i.prototype.onEnd = function(o) {
          o === _ && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = o, this.msg = this.strm.msg;
        }, w.Deflate = i, w.deflate = f, w.deflateRaw = function(o, g) {
          return (g = g || {}).raw = !0, f(o, g);
        }, w.gzip = function(o, g) {
          return (g = g || {}).gzip = !0, f(o, g);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(m, z, w) {
        var a = m("./zlib/inflate"), s = m("./utils/common"), r = m("./utils/strings"), l = m("./zlib/constants"), v = m("./zlib/messages"), c = m("./zlib/zstream"), _ = m("./zlib/gzheader"), y = Object.prototype.toString;
        function n(i) {
          if (!(this instanceof n)) return new n(i);
          this.options = s.assign({ chunkSize: 16384, windowBits: 0, to: "" }, i || {});
          var f = this.options;
          f.raw && 0 <= f.windowBits && f.windowBits < 16 && (f.windowBits = -f.windowBits, f.windowBits === 0 && (f.windowBits = -15)), !(0 <= f.windowBits && f.windowBits < 16) || i && i.windowBits || (f.windowBits += 32), 15 < f.windowBits && f.windowBits < 48 && (15 & f.windowBits) == 0 && (f.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new c(), this.strm.avail_out = 0;
          var o = a.inflateInit2(this.strm, f.windowBits);
          if (o !== l.Z_OK) throw new Error(v[o]);
          this.header = new _(), a.inflateGetHeader(this.strm, this.header);
        }
        function d(i, f) {
          var o = new n(f);
          if (o.push(i, !0), o.err) throw o.msg || v[o.err];
          return o.result;
        }
        n.prototype.push = function(i, f) {
          var o, g, k, C, S, j, R = this.strm, W = this.options.chunkSize, D = this.options.dictionary, H = !1;
          if (this.ended) return !1;
          g = f === ~~f ? f : f === !0 ? l.Z_FINISH : l.Z_NO_FLUSH, typeof i == "string" ? R.input = r.binstring2buf(i) : y.call(i) === "[object ArrayBuffer]" ? R.input = new Uint8Array(i) : R.input = i, R.next_in = 0, R.avail_in = R.input.length;
          do {
            if (R.avail_out === 0 && (R.output = new s.Buf8(W), R.next_out = 0, R.avail_out = W), (o = a.inflate(R, l.Z_NO_FLUSH)) === l.Z_NEED_DICT && D && (j = typeof D == "string" ? r.string2buf(D) : y.call(D) === "[object ArrayBuffer]" ? new Uint8Array(D) : D, o = a.inflateSetDictionary(this.strm, j)), o === l.Z_BUF_ERROR && H === !0 && (o = l.Z_OK, H = !1), o !== l.Z_STREAM_END && o !== l.Z_OK) return this.onEnd(o), !(this.ended = !0);
            R.next_out && (R.avail_out !== 0 && o !== l.Z_STREAM_END && (R.avail_in !== 0 || g !== l.Z_FINISH && g !== l.Z_SYNC_FLUSH) || (this.options.to === "string" ? (k = r.utf8border(R.output, R.next_out), C = R.next_out - k, S = r.buf2string(R.output, k), R.next_out = C, R.avail_out = W - C, C && s.arraySet(R.output, R.output, k, C, 0), this.onData(S)) : this.onData(s.shrinkBuf(R.output, R.next_out)))), R.avail_in === 0 && R.avail_out === 0 && (H = !0);
          } while ((0 < R.avail_in || R.avail_out === 0) && o !== l.Z_STREAM_END);
          return o === l.Z_STREAM_END && (g = l.Z_FINISH), g === l.Z_FINISH ? (o = a.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, o === l.Z_OK) : g !== l.Z_SYNC_FLUSH || (this.onEnd(l.Z_OK), !(R.avail_out = 0));
        }, n.prototype.onData = function(i) {
          this.chunks.push(i);
        }, n.prototype.onEnd = function(i) {
          i === l.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = s.flattenChunks(this.chunks)), this.chunks = [], this.err = i, this.msg = this.strm.msg;
        }, w.Inflate = n, w.inflate = d, w.inflateRaw = function(i, f) {
          return (f = f || {}).raw = !0, d(i, f);
        }, w.ungzip = d;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(m, z, w) {
        var a = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        w.assign = function(l) {
          for (var v = Array.prototype.slice.call(arguments, 1); v.length; ) {
            var c = v.shift();
            if (c) {
              if (typeof c != "object") throw new TypeError(c + "must be non-object");
              for (var _ in c) c.hasOwnProperty(_) && (l[_] = c[_]);
            }
          }
          return l;
        }, w.shrinkBuf = function(l, v) {
          return l.length === v ? l : l.subarray ? l.subarray(0, v) : (l.length = v, l);
        };
        var s = { arraySet: function(l, v, c, _, y) {
          if (v.subarray && l.subarray) l.set(v.subarray(c, c + _), y);
          else for (var n = 0; n < _; n++) l[y + n] = v[c + n];
        }, flattenChunks: function(l) {
          var v, c, _, y, n, d;
          for (v = _ = 0, c = l.length; v < c; v++) _ += l[v].length;
          for (d = new Uint8Array(_), v = y = 0, c = l.length; v < c; v++) n = l[v], d.set(n, y), y += n.length;
          return d;
        } }, r = { arraySet: function(l, v, c, _, y) {
          for (var n = 0; n < _; n++) l[y + n] = v[c + n];
        }, flattenChunks: function(l) {
          return [].concat.apply([], l);
        } };
        w.setTyped = function(l) {
          l ? (w.Buf8 = Uint8Array, w.Buf16 = Uint16Array, w.Buf32 = Int32Array, w.assign(w, s)) : (w.Buf8 = Array, w.Buf16 = Array, w.Buf32 = Array, w.assign(w, r));
        }, w.setTyped(a);
      }, {}], 42: [function(m, z, w) {
        var a = m("./common"), s = !0, r = !0;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch {
          s = !1;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch {
          r = !1;
        }
        for (var l = new a.Buf8(256), v = 0; v < 256; v++) l[v] = 252 <= v ? 6 : 248 <= v ? 5 : 240 <= v ? 4 : 224 <= v ? 3 : 192 <= v ? 2 : 1;
        function c(_, y) {
          if (y < 65537 && (_.subarray && r || !_.subarray && s)) return String.fromCharCode.apply(null, a.shrinkBuf(_, y));
          for (var n = "", d = 0; d < y; d++) n += String.fromCharCode(_[d]);
          return n;
        }
        l[254] = l[254] = 1, w.string2buf = function(_) {
          var y, n, d, i, f, o = _.length, g = 0;
          for (i = 0; i < o; i++) (64512 & (n = _.charCodeAt(i))) == 55296 && i + 1 < o && (64512 & (d = _.charCodeAt(i + 1))) == 56320 && (n = 65536 + (n - 55296 << 10) + (d - 56320), i++), g += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
          for (y = new a.Buf8(g), i = f = 0; f < g; i++) (64512 & (n = _.charCodeAt(i))) == 55296 && i + 1 < o && (64512 & (d = _.charCodeAt(i + 1))) == 56320 && (n = 65536 + (n - 55296 << 10) + (d - 56320), i++), n < 128 ? y[f++] = n : (n < 2048 ? y[f++] = 192 | n >>> 6 : (n < 65536 ? y[f++] = 224 | n >>> 12 : (y[f++] = 240 | n >>> 18, y[f++] = 128 | n >>> 12 & 63), y[f++] = 128 | n >>> 6 & 63), y[f++] = 128 | 63 & n);
          return y;
        }, w.buf2binstring = function(_) {
          return c(_, _.length);
        }, w.binstring2buf = function(_) {
          for (var y = new a.Buf8(_.length), n = 0, d = y.length; n < d; n++) y[n] = _.charCodeAt(n);
          return y;
        }, w.buf2string = function(_, y) {
          var n, d, i, f, o = y || _.length, g = new Array(2 * o);
          for (n = d = 0; n < o; ) if ((i = _[n++]) < 128) g[d++] = i;
          else if (4 < (f = l[i])) g[d++] = 65533, n += f - 1;
          else {
            for (i &= f === 2 ? 31 : f === 3 ? 15 : 7; 1 < f && n < o; ) i = i << 6 | 63 & _[n++], f--;
            1 < f ? g[d++] = 65533 : i < 65536 ? g[d++] = i : (i -= 65536, g[d++] = 55296 | i >> 10 & 1023, g[d++] = 56320 | 1023 & i);
          }
          return c(g, d);
        }, w.utf8border = function(_, y) {
          var n;
          for ((y = y || _.length) > _.length && (y = _.length), n = y - 1; 0 <= n && (192 & _[n]) == 128; ) n--;
          return n < 0 || n === 0 ? y : n + l[_[n]] > y ? n : y;
        };
      }, { "./common": 41 }], 43: [function(m, z, w) {
        z.exports = function(a, s, r, l) {
          for (var v = 65535 & a | 0, c = a >>> 16 & 65535 | 0, _ = 0; r !== 0; ) {
            for (r -= _ = 2e3 < r ? 2e3 : r; c = c + (v = v + s[l++] | 0) | 0, --_; ) ;
            v %= 65521, c %= 65521;
          }
          return v | c << 16 | 0;
        };
      }, {}], 44: [function(m, z, w) {
        z.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(m, z, w) {
        var a = (function() {
          for (var s, r = [], l = 0; l < 256; l++) {
            s = l;
            for (var v = 0; v < 8; v++) s = 1 & s ? 3988292384 ^ s >>> 1 : s >>> 1;
            r[l] = s;
          }
          return r;
        })();
        z.exports = function(s, r, l, v) {
          var c = a, _ = v + l;
          s ^= -1;
          for (var y = v; y < _; y++) s = s >>> 8 ^ c[255 & (s ^ r[y])];
          return -1 ^ s;
        };
      }, {}], 46: [function(m, z, w) {
        var a, s = m("../utils/common"), r = m("./trees"), l = m("./adler32"), v = m("./crc32"), c = m("./messages"), _ = 0, y = 4, n = 0, d = -2, i = -1, f = 4, o = 2, g = 8, k = 9, C = 286, S = 30, j = 19, R = 2 * C + 1, W = 15, D = 3, H = 258, V = H + D + 1, b = 42, F = 113, e = 1, U = 2, tt = 3, Z = 4;
        function X(t, P) {
          return t.msg = c[P], P;
        }
        function M(t) {
          return (t << 1) - (4 < t ? 9 : 0);
        }
        function Q(t) {
          for (var P = t.length; 0 <= --P; ) t[P] = 0;
        }
        function I(t) {
          var P = t.state, T = P.pending;
          T > t.avail_out && (T = t.avail_out), T !== 0 && (s.arraySet(t.output, P.pending_buf, P.pending_out, T, t.next_out), t.next_out += T, P.pending_out += T, t.total_out += T, t.avail_out -= T, P.pending -= T, P.pending === 0 && (P.pending_out = 0));
        }
        function A(t, P) {
          r._tr_flush_block(t, 0 <= t.block_start ? t.block_start : -1, t.strstart - t.block_start, P), t.block_start = t.strstart, I(t.strm);
        }
        function Y(t, P) {
          t.pending_buf[t.pending++] = P;
        }
        function q(t, P) {
          t.pending_buf[t.pending++] = P >>> 8 & 255, t.pending_buf[t.pending++] = 255 & P;
        }
        function $(t, P) {
          var T, p, u = t.max_chain_length, E = t.strstart, N = t.prev_length, L = t.nice_match, h = t.strstart > t.w_size - V ? t.strstart - (t.w_size - V) : 0, x = t.window, O = t.w_mask, B = t.prev, G = t.strstart + H, K = x[E + N - 1], et = x[E + N];
          t.prev_length >= t.good_match && (u >>= 2), L > t.lookahead && (L = t.lookahead);
          do
            if (x[(T = P) + N] === et && x[T + N - 1] === K && x[T] === x[E] && x[++T] === x[E + 1]) {
              E += 2, T++;
              do
                ;
              while (x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && x[++E] === x[++T] && E < G);
              if (p = H - (G - E), E = G - H, N < p) {
                if (t.match_start = P, L <= (N = p)) break;
                K = x[E + N - 1], et = x[E + N];
              }
            }
          while ((P = B[P & O]) > h && --u != 0);
          return N <= t.lookahead ? N : t.lookahead;
        }
        function at(t) {
          var P, T, p, u, E, N, L, h, x, O, B = t.w_size;
          do {
            if (u = t.window_size - t.lookahead - t.strstart, t.strstart >= B + (B - V)) {
              for (s.arraySet(t.window, t.window, B, B, 0), t.match_start -= B, t.strstart -= B, t.block_start -= B, P = T = t.hash_size; p = t.head[--P], t.head[P] = B <= p ? p - B : 0, --T; ) ;
              for (P = T = B; p = t.prev[--P], t.prev[P] = B <= p ? p - B : 0, --T; ) ;
              u += B;
            }
            if (t.strm.avail_in === 0) break;
            if (N = t.strm, L = t.window, h = t.strstart + t.lookahead, x = u, O = void 0, O = N.avail_in, x < O && (O = x), T = O === 0 ? 0 : (N.avail_in -= O, s.arraySet(L, N.input, N.next_in, O, h), N.state.wrap === 1 ? N.adler = l(N.adler, L, O, h) : N.state.wrap === 2 && (N.adler = v(N.adler, L, O, h)), N.next_in += O, N.total_in += O, O), t.lookahead += T, t.lookahead + t.insert >= D) for (E = t.strstart - t.insert, t.ins_h = t.window[E], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[E + 1]) & t.hash_mask; t.insert && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[E + D - 1]) & t.hash_mask, t.prev[E & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = E, E++, t.insert--, !(t.lookahead + t.insert < D)); ) ;
          } while (t.lookahead < V && t.strm.avail_in !== 0);
        }
        function ft(t, P) {
          for (var T, p; ; ) {
            if (t.lookahead < V) {
              if (at(t), t.lookahead < V && P === _) return e;
              if (t.lookahead === 0) break;
            }
            if (T = 0, t.lookahead >= D && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + D - 1]) & t.hash_mask, T = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), T !== 0 && t.strstart - T <= t.w_size - V && (t.match_length = $(t, T)), t.match_length >= D) if (p = r._tr_tally(t, t.strstart - t.match_start, t.match_length - D), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= D) {
              for (t.match_length--; t.strstart++, t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + D - 1]) & t.hash_mask, T = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart, --t.match_length != 0; ) ;
              t.strstart++;
            } else t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + 1]) & t.hash_mask;
            else p = r._tr_tally(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
            if (p && (A(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = t.strstart < D - 1 ? t.strstart : D - 1, P === y ? (A(t, !0), t.strm.avail_out === 0 ? tt : Z) : t.last_lit && (A(t, !1), t.strm.avail_out === 0) ? e : U;
        }
        function nt(t, P) {
          for (var T, p, u; ; ) {
            if (t.lookahead < V) {
              if (at(t), t.lookahead < V && P === _) return e;
              if (t.lookahead === 0) break;
            }
            if (T = 0, t.lookahead >= D && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + D - 1]) & t.hash_mask, T = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = D - 1, T !== 0 && t.prev_length < t.max_lazy_match && t.strstart - T <= t.w_size - V && (t.match_length = $(t, T), t.match_length <= 5 && (t.strategy === 1 || t.match_length === D && 4096 < t.strstart - t.match_start) && (t.match_length = D - 1)), t.prev_length >= D && t.match_length <= t.prev_length) {
              for (u = t.strstart + t.lookahead - D, p = r._tr_tally(t, t.strstart - 1 - t.prev_match, t.prev_length - D), t.lookahead -= t.prev_length - 1, t.prev_length -= 2; ++t.strstart <= u && (t.ins_h = (t.ins_h << t.hash_shift ^ t.window[t.strstart + D - 1]) & t.hash_mask, T = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), --t.prev_length != 0; ) ;
              if (t.match_available = 0, t.match_length = D - 1, t.strstart++, p && (A(t, !1), t.strm.avail_out === 0)) return e;
            } else if (t.match_available) {
              if ((p = r._tr_tally(t, 0, t.window[t.strstart - 1])) && A(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0) return e;
            } else t.match_available = 1, t.strstart++, t.lookahead--;
          }
          return t.match_available && (p = r._tr_tally(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < D - 1 ? t.strstart : D - 1, P === y ? (A(t, !0), t.strm.avail_out === 0 ? tt : Z) : t.last_lit && (A(t, !1), t.strm.avail_out === 0) ? e : U;
        }
        function it(t, P, T, p, u) {
          this.good_length = t, this.max_lazy = P, this.nice_length = T, this.max_chain = p, this.func = u;
        }
        function ut() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = g, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new s.Buf16(2 * R), this.dyn_dtree = new s.Buf16(2 * (2 * S + 1)), this.bl_tree = new s.Buf16(2 * (2 * j + 1)), Q(this.dyn_ltree), Q(this.dyn_dtree), Q(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new s.Buf16(W + 1), this.heap = new s.Buf16(2 * C + 1), Q(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new s.Buf16(2 * C + 1), Q(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function st(t) {
          var P;
          return t && t.state ? (t.total_in = t.total_out = 0, t.data_type = o, (P = t.state).pending = 0, P.pending_out = 0, P.wrap < 0 && (P.wrap = -P.wrap), P.status = P.wrap ? b : F, t.adler = P.wrap === 2 ? 0 : 1, P.last_flush = _, r._tr_init(P), n) : X(t, d);
        }
        function ct(t) {
          var P = st(t);
          return P === n && (function(T) {
            T.window_size = 2 * T.w_size, Q(T.head), T.max_lazy_match = a[T.level].max_lazy, T.good_match = a[T.level].good_length, T.nice_match = a[T.level].nice_length, T.max_chain_length = a[T.level].max_chain, T.strstart = 0, T.block_start = 0, T.lookahead = 0, T.insert = 0, T.match_length = T.prev_length = D - 1, T.match_available = 0, T.ins_h = 0;
          })(t.state), P;
        }
        function dt(t, P, T, p, u, E) {
          if (!t) return d;
          var N = 1;
          if (P === i && (P = 6), p < 0 ? (N = 0, p = -p) : 15 < p && (N = 2, p -= 16), u < 1 || k < u || T !== g || p < 8 || 15 < p || P < 0 || 9 < P || E < 0 || f < E) return X(t, d);
          p === 8 && (p = 9);
          var L = new ut();
          return (t.state = L).strm = t, L.wrap = N, L.gzhead = null, L.w_bits = p, L.w_size = 1 << L.w_bits, L.w_mask = L.w_size - 1, L.hash_bits = u + 7, L.hash_size = 1 << L.hash_bits, L.hash_mask = L.hash_size - 1, L.hash_shift = ~~((L.hash_bits + D - 1) / D), L.window = new s.Buf8(2 * L.w_size), L.head = new s.Buf16(L.hash_size), L.prev = new s.Buf16(L.w_size), L.lit_bufsize = 1 << u + 6, L.pending_buf_size = 4 * L.lit_bufsize, L.pending_buf = new s.Buf8(L.pending_buf_size), L.d_buf = 1 * L.lit_bufsize, L.l_buf = 3 * L.lit_bufsize, L.level = P, L.strategy = E, L.method = T, ct(t);
        }
        a = [new it(0, 0, 0, 0, function(t, P) {
          var T = 65535;
          for (T > t.pending_buf_size - 5 && (T = t.pending_buf_size - 5); ; ) {
            if (t.lookahead <= 1) {
              if (at(t), t.lookahead === 0 && P === _) return e;
              if (t.lookahead === 0) break;
            }
            t.strstart += t.lookahead, t.lookahead = 0;
            var p = t.block_start + T;
            if ((t.strstart === 0 || t.strstart >= p) && (t.lookahead = t.strstart - p, t.strstart = p, A(t, !1), t.strm.avail_out === 0) || t.strstart - t.block_start >= t.w_size - V && (A(t, !1), t.strm.avail_out === 0)) return e;
          }
          return t.insert = 0, P === y ? (A(t, !0), t.strm.avail_out === 0 ? tt : Z) : (t.strstart > t.block_start && (A(t, !1), t.strm.avail_out), e);
        }), new it(4, 4, 8, 4, ft), new it(4, 5, 16, 8, ft), new it(4, 6, 32, 32, ft), new it(4, 4, 16, 16, nt), new it(8, 16, 32, 32, nt), new it(8, 16, 128, 128, nt), new it(8, 32, 128, 256, nt), new it(32, 128, 258, 1024, nt), new it(32, 258, 258, 4096, nt)], w.deflateInit = function(t, P) {
          return dt(t, P, g, 15, 8, 0);
        }, w.deflateInit2 = dt, w.deflateReset = ct, w.deflateResetKeep = st, w.deflateSetHeader = function(t, P) {
          return t && t.state ? t.state.wrap !== 2 ? d : (t.state.gzhead = P, n) : d;
        }, w.deflate = function(t, P) {
          var T, p, u, E;
          if (!t || !t.state || 5 < P || P < 0) return t ? X(t, d) : d;
          if (p = t.state, !t.output || !t.input && t.avail_in !== 0 || p.status === 666 && P !== y) return X(t, t.avail_out === 0 ? -5 : d);
          if (p.strm = t, T = p.last_flush, p.last_flush = P, p.status === b) if (p.wrap === 2) t.adler = 0, Y(p, 31), Y(p, 139), Y(p, 8), p.gzhead ? (Y(p, (p.gzhead.text ? 1 : 0) + (p.gzhead.hcrc ? 2 : 0) + (p.gzhead.extra ? 4 : 0) + (p.gzhead.name ? 8 : 0) + (p.gzhead.comment ? 16 : 0)), Y(p, 255 & p.gzhead.time), Y(p, p.gzhead.time >> 8 & 255), Y(p, p.gzhead.time >> 16 & 255), Y(p, p.gzhead.time >> 24 & 255), Y(p, p.level === 9 ? 2 : 2 <= p.strategy || p.level < 2 ? 4 : 0), Y(p, 255 & p.gzhead.os), p.gzhead.extra && p.gzhead.extra.length && (Y(p, 255 & p.gzhead.extra.length), Y(p, p.gzhead.extra.length >> 8 & 255)), p.gzhead.hcrc && (t.adler = v(t.adler, p.pending_buf, p.pending, 0)), p.gzindex = 0, p.status = 69) : (Y(p, 0), Y(p, 0), Y(p, 0), Y(p, 0), Y(p, 0), Y(p, p.level === 9 ? 2 : 2 <= p.strategy || p.level < 2 ? 4 : 0), Y(p, 3), p.status = F);
          else {
            var N = g + (p.w_bits - 8 << 4) << 8;
            N |= (2 <= p.strategy || p.level < 2 ? 0 : p.level < 6 ? 1 : p.level === 6 ? 2 : 3) << 6, p.strstart !== 0 && (N |= 32), N += 31 - N % 31, p.status = F, q(p, N), p.strstart !== 0 && (q(p, t.adler >>> 16), q(p, 65535 & t.adler)), t.adler = 1;
          }
          if (p.status === 69) if (p.gzhead.extra) {
            for (u = p.pending; p.gzindex < (65535 & p.gzhead.extra.length) && (p.pending !== p.pending_buf_size || (p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), I(t), u = p.pending, p.pending !== p.pending_buf_size)); ) Y(p, 255 & p.gzhead.extra[p.gzindex]), p.gzindex++;
            p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), p.gzindex === p.gzhead.extra.length && (p.gzindex = 0, p.status = 73);
          } else p.status = 73;
          if (p.status === 73) if (p.gzhead.name) {
            u = p.pending;
            do {
              if (p.pending === p.pending_buf_size && (p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), I(t), u = p.pending, p.pending === p.pending_buf_size)) {
                E = 1;
                break;
              }
              E = p.gzindex < p.gzhead.name.length ? 255 & p.gzhead.name.charCodeAt(p.gzindex++) : 0, Y(p, E);
            } while (E !== 0);
            p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), E === 0 && (p.gzindex = 0, p.status = 91);
          } else p.status = 91;
          if (p.status === 91) if (p.gzhead.comment) {
            u = p.pending;
            do {
              if (p.pending === p.pending_buf_size && (p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), I(t), u = p.pending, p.pending === p.pending_buf_size)) {
                E = 1;
                break;
              }
              E = p.gzindex < p.gzhead.comment.length ? 255 & p.gzhead.comment.charCodeAt(p.gzindex++) : 0, Y(p, E);
            } while (E !== 0);
            p.gzhead.hcrc && p.pending > u && (t.adler = v(t.adler, p.pending_buf, p.pending - u, u)), E === 0 && (p.status = 103);
          } else p.status = 103;
          if (p.status === 103 && (p.gzhead.hcrc ? (p.pending + 2 > p.pending_buf_size && I(t), p.pending + 2 <= p.pending_buf_size && (Y(p, 255 & t.adler), Y(p, t.adler >> 8 & 255), t.adler = 0, p.status = F)) : p.status = F), p.pending !== 0) {
            if (I(t), t.avail_out === 0) return p.last_flush = -1, n;
          } else if (t.avail_in === 0 && M(P) <= M(T) && P !== y) return X(t, -5);
          if (p.status === 666 && t.avail_in !== 0) return X(t, -5);
          if (t.avail_in !== 0 || p.lookahead !== 0 || P !== _ && p.status !== 666) {
            var L = p.strategy === 2 ? (function(h, x) {
              for (var O; ; ) {
                if (h.lookahead === 0 && (at(h), h.lookahead === 0)) {
                  if (x === _) return e;
                  break;
                }
                if (h.match_length = 0, O = r._tr_tally(h, 0, h.window[h.strstart]), h.lookahead--, h.strstart++, O && (A(h, !1), h.strm.avail_out === 0)) return e;
              }
              return h.insert = 0, x === y ? (A(h, !0), h.strm.avail_out === 0 ? tt : Z) : h.last_lit && (A(h, !1), h.strm.avail_out === 0) ? e : U;
            })(p, P) : p.strategy === 3 ? (function(h, x) {
              for (var O, B, G, K, et = h.window; ; ) {
                if (h.lookahead <= H) {
                  if (at(h), h.lookahead <= H && x === _) return e;
                  if (h.lookahead === 0) break;
                }
                if (h.match_length = 0, h.lookahead >= D && 0 < h.strstart && (B = et[G = h.strstart - 1]) === et[++G] && B === et[++G] && B === et[++G]) {
                  K = h.strstart + H;
                  do
                    ;
                  while (B === et[++G] && B === et[++G] && B === et[++G] && B === et[++G] && B === et[++G] && B === et[++G] && B === et[++G] && B === et[++G] && G < K);
                  h.match_length = H - (K - G), h.match_length > h.lookahead && (h.match_length = h.lookahead);
                }
                if (h.match_length >= D ? (O = r._tr_tally(h, 1, h.match_length - D), h.lookahead -= h.match_length, h.strstart += h.match_length, h.match_length = 0) : (O = r._tr_tally(h, 0, h.window[h.strstart]), h.lookahead--, h.strstart++), O && (A(h, !1), h.strm.avail_out === 0)) return e;
              }
              return h.insert = 0, x === y ? (A(h, !0), h.strm.avail_out === 0 ? tt : Z) : h.last_lit && (A(h, !1), h.strm.avail_out === 0) ? e : U;
            })(p, P) : a[p.level].func(p, P);
            if (L !== tt && L !== Z || (p.status = 666), L === e || L === tt) return t.avail_out === 0 && (p.last_flush = -1), n;
            if (L === U && (P === 1 ? r._tr_align(p) : P !== 5 && (r._tr_stored_block(p, 0, 0, !1), P === 3 && (Q(p.head), p.lookahead === 0 && (p.strstart = 0, p.block_start = 0, p.insert = 0))), I(t), t.avail_out === 0)) return p.last_flush = -1, n;
          }
          return P !== y ? n : p.wrap <= 0 ? 1 : (p.wrap === 2 ? (Y(p, 255 & t.adler), Y(p, t.adler >> 8 & 255), Y(p, t.adler >> 16 & 255), Y(p, t.adler >> 24 & 255), Y(p, 255 & t.total_in), Y(p, t.total_in >> 8 & 255), Y(p, t.total_in >> 16 & 255), Y(p, t.total_in >> 24 & 255)) : (q(p, t.adler >>> 16), q(p, 65535 & t.adler)), I(t), 0 < p.wrap && (p.wrap = -p.wrap), p.pending !== 0 ? n : 1);
        }, w.deflateEnd = function(t) {
          var P;
          return t && t.state ? (P = t.state.status) !== b && P !== 69 && P !== 73 && P !== 91 && P !== 103 && P !== F && P !== 666 ? X(t, d) : (t.state = null, P === F ? X(t, -3) : n) : d;
        }, w.deflateSetDictionary = function(t, P) {
          var T, p, u, E, N, L, h, x, O = P.length;
          if (!t || !t.state || (E = (T = t.state).wrap) === 2 || E === 1 && T.status !== b || T.lookahead) return d;
          for (E === 1 && (t.adler = l(t.adler, P, O, 0)), T.wrap = 0, O >= T.w_size && (E === 0 && (Q(T.head), T.strstart = 0, T.block_start = 0, T.insert = 0), x = new s.Buf8(T.w_size), s.arraySet(x, P, O - T.w_size, T.w_size, 0), P = x, O = T.w_size), N = t.avail_in, L = t.next_in, h = t.input, t.avail_in = O, t.next_in = 0, t.input = P, at(T); T.lookahead >= D; ) {
            for (p = T.strstart, u = T.lookahead - (D - 1); T.ins_h = (T.ins_h << T.hash_shift ^ T.window[p + D - 1]) & T.hash_mask, T.prev[p & T.w_mask] = T.head[T.ins_h], T.head[T.ins_h] = p, p++, --u; ) ;
            T.strstart = p, T.lookahead = D - 1, at(T);
          }
          return T.strstart += T.lookahead, T.block_start = T.strstart, T.insert = T.lookahead, T.lookahead = 0, T.match_length = T.prev_length = D - 1, T.match_available = 0, t.next_in = L, t.input = h, t.avail_in = N, T.wrap = E, n;
        }, w.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(m, z, w) {
        z.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
        };
      }, {}], 48: [function(m, z, w) {
        z.exports = function(a, s) {
          var r, l, v, c, _, y, n, d, i, f, o, g, k, C, S, j, R, W, D, H, V, b, F, e, U;
          r = a.state, l = a.next_in, e = a.input, v = l + (a.avail_in - 5), c = a.next_out, U = a.output, _ = c - (s - a.avail_out), y = c + (a.avail_out - 257), n = r.dmax, d = r.wsize, i = r.whave, f = r.wnext, o = r.window, g = r.hold, k = r.bits, C = r.lencode, S = r.distcode, j = (1 << r.lenbits) - 1, R = (1 << r.distbits) - 1;
          t: do {
            k < 15 && (g += e[l++] << k, k += 8, g += e[l++] << k, k += 8), W = C[g & j];
            e: for (; ; ) {
              if (g >>>= D = W >>> 24, k -= D, (D = W >>> 16 & 255) === 0) U[c++] = 65535 & W;
              else {
                if (!(16 & D)) {
                  if ((64 & D) == 0) {
                    W = C[(65535 & W) + (g & (1 << D) - 1)];
                    continue e;
                  }
                  if (32 & D) {
                    r.mode = 12;
                    break t;
                  }
                  a.msg = "invalid literal/length code", r.mode = 30;
                  break t;
                }
                H = 65535 & W, (D &= 15) && (k < D && (g += e[l++] << k, k += 8), H += g & (1 << D) - 1, g >>>= D, k -= D), k < 15 && (g += e[l++] << k, k += 8, g += e[l++] << k, k += 8), W = S[g & R];
                r: for (; ; ) {
                  if (g >>>= D = W >>> 24, k -= D, !(16 & (D = W >>> 16 & 255))) {
                    if ((64 & D) == 0) {
                      W = S[(65535 & W) + (g & (1 << D) - 1)];
                      continue r;
                    }
                    a.msg = "invalid distance code", r.mode = 30;
                    break t;
                  }
                  if (V = 65535 & W, k < (D &= 15) && (g += e[l++] << k, (k += 8) < D && (g += e[l++] << k, k += 8)), n < (V += g & (1 << D) - 1)) {
                    a.msg = "invalid distance too far back", r.mode = 30;
                    break t;
                  }
                  if (g >>>= D, k -= D, (D = c - _) < V) {
                    if (i < (D = V - D) && r.sane) {
                      a.msg = "invalid distance too far back", r.mode = 30;
                      break t;
                    }
                    if (F = o, (b = 0) === f) {
                      if (b += d - D, D < H) {
                        for (H -= D; U[c++] = o[b++], --D; ) ;
                        b = c - V, F = U;
                      }
                    } else if (f < D) {
                      if (b += d + f - D, (D -= f) < H) {
                        for (H -= D; U[c++] = o[b++], --D; ) ;
                        if (b = 0, f < H) {
                          for (H -= D = f; U[c++] = o[b++], --D; ) ;
                          b = c - V, F = U;
                        }
                      }
                    } else if (b += f - D, D < H) {
                      for (H -= D; U[c++] = o[b++], --D; ) ;
                      b = c - V, F = U;
                    }
                    for (; 2 < H; ) U[c++] = F[b++], U[c++] = F[b++], U[c++] = F[b++], H -= 3;
                    H && (U[c++] = F[b++], 1 < H && (U[c++] = F[b++]));
                  } else {
                    for (b = c - V; U[c++] = U[b++], U[c++] = U[b++], U[c++] = U[b++], 2 < (H -= 3); ) ;
                    H && (U[c++] = U[b++], 1 < H && (U[c++] = U[b++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (l < v && c < y);
          l -= H = k >> 3, g &= (1 << (k -= H << 3)) - 1, a.next_in = l, a.next_out = c, a.avail_in = l < v ? v - l + 5 : 5 - (l - v), a.avail_out = c < y ? y - c + 257 : 257 - (c - y), r.hold = g, r.bits = k;
        };
      }, {}], 49: [function(m, z, w) {
        var a = m("../utils/common"), s = m("./adler32"), r = m("./crc32"), l = m("./inffast"), v = m("./inftrees"), c = 1, _ = 2, y = 0, n = -2, d = 1, i = 852, f = 592;
        function o(b) {
          return (b >>> 24 & 255) + (b >>> 8 & 65280) + ((65280 & b) << 8) + ((255 & b) << 24);
        }
        function g() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new a.Buf16(320), this.work = new a.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function k(b) {
          var F;
          return b && b.state ? (F = b.state, b.total_in = b.total_out = F.total = 0, b.msg = "", F.wrap && (b.adler = 1 & F.wrap), F.mode = d, F.last = 0, F.havedict = 0, F.dmax = 32768, F.head = null, F.hold = 0, F.bits = 0, F.lencode = F.lendyn = new a.Buf32(i), F.distcode = F.distdyn = new a.Buf32(f), F.sane = 1, F.back = -1, y) : n;
        }
        function C(b) {
          var F;
          return b && b.state ? ((F = b.state).wsize = 0, F.whave = 0, F.wnext = 0, k(b)) : n;
        }
        function S(b, F) {
          var e, U;
          return b && b.state ? (U = b.state, F < 0 ? (e = 0, F = -F) : (e = 1 + (F >> 4), F < 48 && (F &= 15)), F && (F < 8 || 15 < F) ? n : (U.window !== null && U.wbits !== F && (U.window = null), U.wrap = e, U.wbits = F, C(b))) : n;
        }
        function j(b, F) {
          var e, U;
          return b ? (U = new g(), (b.state = U).window = null, (e = S(b, F)) !== y && (b.state = null), e) : n;
        }
        var R, W, D = !0;
        function H(b) {
          if (D) {
            var F;
            for (R = new a.Buf32(512), W = new a.Buf32(32), F = 0; F < 144; ) b.lens[F++] = 8;
            for (; F < 256; ) b.lens[F++] = 9;
            for (; F < 280; ) b.lens[F++] = 7;
            for (; F < 288; ) b.lens[F++] = 8;
            for (v(c, b.lens, 0, 288, R, 0, b.work, { bits: 9 }), F = 0; F < 32; ) b.lens[F++] = 5;
            v(_, b.lens, 0, 32, W, 0, b.work, { bits: 5 }), D = !1;
          }
          b.lencode = R, b.lenbits = 9, b.distcode = W, b.distbits = 5;
        }
        function V(b, F, e, U) {
          var tt, Z = b.state;
          return Z.window === null && (Z.wsize = 1 << Z.wbits, Z.wnext = 0, Z.whave = 0, Z.window = new a.Buf8(Z.wsize)), U >= Z.wsize ? (a.arraySet(Z.window, F, e - Z.wsize, Z.wsize, 0), Z.wnext = 0, Z.whave = Z.wsize) : (U < (tt = Z.wsize - Z.wnext) && (tt = U), a.arraySet(Z.window, F, e - U, tt, Z.wnext), (U -= tt) ? (a.arraySet(Z.window, F, e - U, U, 0), Z.wnext = U, Z.whave = Z.wsize) : (Z.wnext += tt, Z.wnext === Z.wsize && (Z.wnext = 0), Z.whave < Z.wsize && (Z.whave += tt))), 0;
        }
        w.inflateReset = C, w.inflateReset2 = S, w.inflateResetKeep = k, w.inflateInit = function(b) {
          return j(b, 15);
        }, w.inflateInit2 = j, w.inflate = function(b, F) {
          var e, U, tt, Z, X, M, Q, I, A, Y, q, $, at, ft, nt, it, ut, st, ct, dt, t, P, T, p, u = 0, E = new a.Buf8(4), N = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!b || !b.state || !b.output || !b.input && b.avail_in !== 0) return n;
          (e = b.state).mode === 12 && (e.mode = 13), X = b.next_out, tt = b.output, Q = b.avail_out, Z = b.next_in, U = b.input, M = b.avail_in, I = e.hold, A = e.bits, Y = M, q = Q, P = y;
          t: for (; ; ) switch (e.mode) {
            case d:
              if (e.wrap === 0) {
                e.mode = 13;
                break;
              }
              for (; A < 16; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if (2 & e.wrap && I === 35615) {
                E[e.check = 0] = 255 & I, E[1] = I >>> 8 & 255, e.check = r(e.check, E, 2, 0), A = I = 0, e.mode = 2;
                break;
              }
              if (e.flags = 0, e.head && (e.head.done = !1), !(1 & e.wrap) || (((255 & I) << 8) + (I >> 8)) % 31) {
                b.msg = "incorrect header check", e.mode = 30;
                break;
              }
              if ((15 & I) != 8) {
                b.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (A -= 4, t = 8 + (15 & (I >>>= 4)), e.wbits === 0) e.wbits = t;
              else if (t > e.wbits) {
                b.msg = "invalid window size", e.mode = 30;
                break;
              }
              e.dmax = 1 << t, b.adler = e.check = 1, e.mode = 512 & I ? 10 : 12, A = I = 0;
              break;
            case 2:
              for (; A < 16; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if (e.flags = I, (255 & e.flags) != 8) {
                b.msg = "unknown compression method", e.mode = 30;
                break;
              }
              if (57344 & e.flags) {
                b.msg = "unknown header flags set", e.mode = 30;
                break;
              }
              e.head && (e.head.text = I >> 8 & 1), 512 & e.flags && (E[0] = 255 & I, E[1] = I >>> 8 & 255, e.check = r(e.check, E, 2, 0)), A = I = 0, e.mode = 3;
            case 3:
              for (; A < 32; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              e.head && (e.head.time = I), 512 & e.flags && (E[0] = 255 & I, E[1] = I >>> 8 & 255, E[2] = I >>> 16 & 255, E[3] = I >>> 24 & 255, e.check = r(e.check, E, 4, 0)), A = I = 0, e.mode = 4;
            case 4:
              for (; A < 16; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              e.head && (e.head.xflags = 255 & I, e.head.os = I >> 8), 512 & e.flags && (E[0] = 255 & I, E[1] = I >>> 8 & 255, e.check = r(e.check, E, 2, 0)), A = I = 0, e.mode = 5;
            case 5:
              if (1024 & e.flags) {
                for (; A < 16; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                e.length = I, e.head && (e.head.extra_len = I), 512 & e.flags && (E[0] = 255 & I, E[1] = I >>> 8 & 255, e.check = r(e.check, E, 2, 0)), A = I = 0;
              } else e.head && (e.head.extra = null);
              e.mode = 6;
            case 6:
              if (1024 & e.flags && (M < ($ = e.length) && ($ = M), $ && (e.head && (t = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), a.arraySet(e.head.extra, U, Z, $, t)), 512 & e.flags && (e.check = r(e.check, U, $, Z)), M -= $, Z += $, e.length -= $), e.length)) break t;
              e.length = 0, e.mode = 7;
            case 7:
              if (2048 & e.flags) {
                if (M === 0) break t;
                for ($ = 0; t = U[Z + $++], e.head && t && e.length < 65536 && (e.head.name += String.fromCharCode(t)), t && $ < M; ) ;
                if (512 & e.flags && (e.check = r(e.check, U, $, Z)), M -= $, Z += $, t) break t;
              } else e.head && (e.head.name = null);
              e.length = 0, e.mode = 8;
            case 8:
              if (4096 & e.flags) {
                if (M === 0) break t;
                for ($ = 0; t = U[Z + $++], e.head && t && e.length < 65536 && (e.head.comment += String.fromCharCode(t)), t && $ < M; ) ;
                if (512 & e.flags && (e.check = r(e.check, U, $, Z)), M -= $, Z += $, t) break t;
              } else e.head && (e.head.comment = null);
              e.mode = 9;
            case 9:
              if (512 & e.flags) {
                for (; A < 16; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                if (I !== (65535 & e.check)) {
                  b.msg = "header crc mismatch", e.mode = 30;
                  break;
                }
                A = I = 0;
              }
              e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), b.adler = e.check = 0, e.mode = 12;
              break;
            case 10:
              for (; A < 32; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              b.adler = e.check = o(I), A = I = 0, e.mode = 11;
            case 11:
              if (e.havedict === 0) return b.next_out = X, b.avail_out = Q, b.next_in = Z, b.avail_in = M, e.hold = I, e.bits = A, 2;
              b.adler = e.check = 1, e.mode = 12;
            case 12:
              if (F === 5 || F === 6) break t;
            case 13:
              if (e.last) {
                I >>>= 7 & A, A -= 7 & A, e.mode = 27;
                break;
              }
              for (; A < 3; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              switch (e.last = 1 & I, A -= 1, 3 & (I >>>= 1)) {
                case 0:
                  e.mode = 14;
                  break;
                case 1:
                  if (H(e), e.mode = 20, F !== 6) break;
                  I >>>= 2, A -= 2;
                  break t;
                case 2:
                  e.mode = 17;
                  break;
                case 3:
                  b.msg = "invalid block type", e.mode = 30;
              }
              I >>>= 2, A -= 2;
              break;
            case 14:
              for (I >>>= 7 & A, A -= 7 & A; A < 32; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if ((65535 & I) != (I >>> 16 ^ 65535)) {
                b.msg = "invalid stored block lengths", e.mode = 30;
                break;
              }
              if (e.length = 65535 & I, A = I = 0, e.mode = 15, F === 6) break t;
            case 15:
              e.mode = 16;
            case 16:
              if ($ = e.length) {
                if (M < $ && ($ = M), Q < $ && ($ = Q), $ === 0) break t;
                a.arraySet(tt, U, Z, $, X), M -= $, Z += $, Q -= $, X += $, e.length -= $;
                break;
              }
              e.mode = 12;
              break;
            case 17:
              for (; A < 14; ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if (e.nlen = 257 + (31 & I), I >>>= 5, A -= 5, e.ndist = 1 + (31 & I), I >>>= 5, A -= 5, e.ncode = 4 + (15 & I), I >>>= 4, A -= 4, 286 < e.nlen || 30 < e.ndist) {
                b.msg = "too many length or distance symbols", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 18;
            case 18:
              for (; e.have < e.ncode; ) {
                for (; A < 3; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                e.lens[N[e.have++]] = 7 & I, I >>>= 3, A -= 3;
              }
              for (; e.have < 19; ) e.lens[N[e.have++]] = 0;
              if (e.lencode = e.lendyn, e.lenbits = 7, T = { bits: e.lenbits }, P = v(0, e.lens, 0, 19, e.lencode, 0, e.work, T), e.lenbits = T.bits, P) {
                b.msg = "invalid code lengths set", e.mode = 30;
                break;
              }
              e.have = 0, e.mode = 19;
            case 19:
              for (; e.have < e.nlen + e.ndist; ) {
                for (; it = (u = e.lencode[I & (1 << e.lenbits) - 1]) >>> 16 & 255, ut = 65535 & u, !((nt = u >>> 24) <= A); ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                if (ut < 16) I >>>= nt, A -= nt, e.lens[e.have++] = ut;
                else {
                  if (ut === 16) {
                    for (p = nt + 2; A < p; ) {
                      if (M === 0) break t;
                      M--, I += U[Z++] << A, A += 8;
                    }
                    if (I >>>= nt, A -= nt, e.have === 0) {
                      b.msg = "invalid bit length repeat", e.mode = 30;
                      break;
                    }
                    t = e.lens[e.have - 1], $ = 3 + (3 & I), I >>>= 2, A -= 2;
                  } else if (ut === 17) {
                    for (p = nt + 3; A < p; ) {
                      if (M === 0) break t;
                      M--, I += U[Z++] << A, A += 8;
                    }
                    A -= nt, t = 0, $ = 3 + (7 & (I >>>= nt)), I >>>= 3, A -= 3;
                  } else {
                    for (p = nt + 7; A < p; ) {
                      if (M === 0) break t;
                      M--, I += U[Z++] << A, A += 8;
                    }
                    A -= nt, t = 0, $ = 11 + (127 & (I >>>= nt)), I >>>= 7, A -= 7;
                  }
                  if (e.have + $ > e.nlen + e.ndist) {
                    b.msg = "invalid bit length repeat", e.mode = 30;
                    break;
                  }
                  for (; $--; ) e.lens[e.have++] = t;
                }
              }
              if (e.mode === 30) break;
              if (e.lens[256] === 0) {
                b.msg = "invalid code -- missing end-of-block", e.mode = 30;
                break;
              }
              if (e.lenbits = 9, T = { bits: e.lenbits }, P = v(c, e.lens, 0, e.nlen, e.lencode, 0, e.work, T), e.lenbits = T.bits, P) {
                b.msg = "invalid literal/lengths set", e.mode = 30;
                break;
              }
              if (e.distbits = 6, e.distcode = e.distdyn, T = { bits: e.distbits }, P = v(_, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, T), e.distbits = T.bits, P) {
                b.msg = "invalid distances set", e.mode = 30;
                break;
              }
              if (e.mode = 20, F === 6) break t;
            case 20:
              e.mode = 21;
            case 21:
              if (6 <= M && 258 <= Q) {
                b.next_out = X, b.avail_out = Q, b.next_in = Z, b.avail_in = M, e.hold = I, e.bits = A, l(b, q), X = b.next_out, tt = b.output, Q = b.avail_out, Z = b.next_in, U = b.input, M = b.avail_in, I = e.hold, A = e.bits, e.mode === 12 && (e.back = -1);
                break;
              }
              for (e.back = 0; it = (u = e.lencode[I & (1 << e.lenbits) - 1]) >>> 16 & 255, ut = 65535 & u, !((nt = u >>> 24) <= A); ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if (it && (240 & it) == 0) {
                for (st = nt, ct = it, dt = ut; it = (u = e.lencode[dt + ((I & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, ut = 65535 & u, !(st + (nt = u >>> 24) <= A); ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                I >>>= st, A -= st, e.back += st;
              }
              if (I >>>= nt, A -= nt, e.back += nt, e.length = ut, it === 0) {
                e.mode = 26;
                break;
              }
              if (32 & it) {
                e.back = -1, e.mode = 12;
                break;
              }
              if (64 & it) {
                b.msg = "invalid literal/length code", e.mode = 30;
                break;
              }
              e.extra = 15 & it, e.mode = 22;
            case 22:
              if (e.extra) {
                for (p = e.extra; A < p; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                e.length += I & (1 << e.extra) - 1, I >>>= e.extra, A -= e.extra, e.back += e.extra;
              }
              e.was = e.length, e.mode = 23;
            case 23:
              for (; it = (u = e.distcode[I & (1 << e.distbits) - 1]) >>> 16 & 255, ut = 65535 & u, !((nt = u >>> 24) <= A); ) {
                if (M === 0) break t;
                M--, I += U[Z++] << A, A += 8;
              }
              if ((240 & it) == 0) {
                for (st = nt, ct = it, dt = ut; it = (u = e.distcode[dt + ((I & (1 << st + ct) - 1) >> st)]) >>> 16 & 255, ut = 65535 & u, !(st + (nt = u >>> 24) <= A); ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                I >>>= st, A -= st, e.back += st;
              }
              if (I >>>= nt, A -= nt, e.back += nt, 64 & it) {
                b.msg = "invalid distance code", e.mode = 30;
                break;
              }
              e.offset = ut, e.extra = 15 & it, e.mode = 24;
            case 24:
              if (e.extra) {
                for (p = e.extra; A < p; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                e.offset += I & (1 << e.extra) - 1, I >>>= e.extra, A -= e.extra, e.back += e.extra;
              }
              if (e.offset > e.dmax) {
                b.msg = "invalid distance too far back", e.mode = 30;
                break;
              }
              e.mode = 25;
            case 25:
              if (Q === 0) break t;
              if ($ = q - Q, e.offset > $) {
                if (($ = e.offset - $) > e.whave && e.sane) {
                  b.msg = "invalid distance too far back", e.mode = 30;
                  break;
                }
                at = $ > e.wnext ? ($ -= e.wnext, e.wsize - $) : e.wnext - $, $ > e.length && ($ = e.length), ft = e.window;
              } else ft = tt, at = X - e.offset, $ = e.length;
              for (Q < $ && ($ = Q), Q -= $, e.length -= $; tt[X++] = ft[at++], --$; ) ;
              e.length === 0 && (e.mode = 21);
              break;
            case 26:
              if (Q === 0) break t;
              tt[X++] = e.length, Q--, e.mode = 21;
              break;
            case 27:
              if (e.wrap) {
                for (; A < 32; ) {
                  if (M === 0) break t;
                  M--, I |= U[Z++] << A, A += 8;
                }
                if (q -= Q, b.total_out += q, e.total += q, q && (b.adler = e.check = e.flags ? r(e.check, tt, q, X - q) : s(e.check, tt, q, X - q)), q = Q, (e.flags ? I : o(I)) !== e.check) {
                  b.msg = "incorrect data check", e.mode = 30;
                  break;
                }
                A = I = 0;
              }
              e.mode = 28;
            case 28:
              if (e.wrap && e.flags) {
                for (; A < 32; ) {
                  if (M === 0) break t;
                  M--, I += U[Z++] << A, A += 8;
                }
                if (I !== (4294967295 & e.total)) {
                  b.msg = "incorrect length check", e.mode = 30;
                  break;
                }
                A = I = 0;
              }
              e.mode = 29;
            case 29:
              P = 1;
              break t;
            case 30:
              P = -3;
              break t;
            case 31:
              return -4;
            case 32:
            default:
              return n;
          }
          return b.next_out = X, b.avail_out = Q, b.next_in = Z, b.avail_in = M, e.hold = I, e.bits = A, (e.wsize || q !== b.avail_out && e.mode < 30 && (e.mode < 27 || F !== 4)) && V(b, b.output, b.next_out, q - b.avail_out) ? (e.mode = 31, -4) : (Y -= b.avail_in, q -= b.avail_out, b.total_in += Y, b.total_out += q, e.total += q, e.wrap && q && (b.adler = e.check = e.flags ? r(e.check, tt, q, b.next_out - q) : s(e.check, tt, q, b.next_out - q)), b.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === 12 ? 128 : 0) + (e.mode === 20 || e.mode === 15 ? 256 : 0), (Y == 0 && q === 0 || F === 4) && P === y && (P = -5), P);
        }, w.inflateEnd = function(b) {
          if (!b || !b.state) return n;
          var F = b.state;
          return F.window && (F.window = null), b.state = null, y;
        }, w.inflateGetHeader = function(b, F) {
          var e;
          return b && b.state ? (2 & (e = b.state).wrap) == 0 ? n : ((e.head = F).done = !1, y) : n;
        }, w.inflateSetDictionary = function(b, F) {
          var e, U = F.length;
          return b && b.state ? (e = b.state).wrap !== 0 && e.mode !== 11 ? n : e.mode === 11 && s(1, F, U, 0) !== e.check ? -3 : V(b, F, U, U) ? (e.mode = 31, -4) : (e.havedict = 1, y) : n;
        }, w.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(m, z, w) {
        var a = m("../utils/common"), s = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], r = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], l = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], v = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        z.exports = function(c, _, y, n, d, i, f, o) {
          var g, k, C, S, j, R, W, D, H, V = o.bits, b = 0, F = 0, e = 0, U = 0, tt = 0, Z = 0, X = 0, M = 0, Q = 0, I = 0, A = null, Y = 0, q = new a.Buf16(16), $ = new a.Buf16(16), at = null, ft = 0;
          for (b = 0; b <= 15; b++) q[b] = 0;
          for (F = 0; F < n; F++) q[_[y + F]]++;
          for (tt = V, U = 15; 1 <= U && q[U] === 0; U--) ;
          if (U < tt && (tt = U), U === 0) return d[i++] = 20971520, d[i++] = 20971520, o.bits = 1, 0;
          for (e = 1; e < U && q[e] === 0; e++) ;
          for (tt < e && (tt = e), b = M = 1; b <= 15; b++) if (M <<= 1, (M -= q[b]) < 0) return -1;
          if (0 < M && (c === 0 || U !== 1)) return -1;
          for ($[1] = 0, b = 1; b < 15; b++) $[b + 1] = $[b] + q[b];
          for (F = 0; F < n; F++) _[y + F] !== 0 && (f[$[_[y + F]]++] = F);
          if (R = c === 0 ? (A = at = f, 19) : c === 1 ? (A = s, Y -= 257, at = r, ft -= 257, 256) : (A = l, at = v, -1), b = e, j = i, X = F = I = 0, C = -1, S = (Q = 1 << (Z = tt)) - 1, c === 1 && 852 < Q || c === 2 && 592 < Q) return 1;
          for (; ; ) {
            for (W = b - X, H = f[F] < R ? (D = 0, f[F]) : f[F] > R ? (D = at[ft + f[F]], A[Y + f[F]]) : (D = 96, 0), g = 1 << b - X, e = k = 1 << Z; d[j + (I >> X) + (k -= g)] = W << 24 | D << 16 | H | 0, k !== 0; ) ;
            for (g = 1 << b - 1; I & g; ) g >>= 1;
            if (g !== 0 ? (I &= g - 1, I += g) : I = 0, F++, --q[b] == 0) {
              if (b === U) break;
              b = _[y + f[F]];
            }
            if (tt < b && (I & S) !== C) {
              for (X === 0 && (X = tt), j += e, M = 1 << (Z = b - X); Z + X < U && !((M -= q[Z + X]) <= 0); ) Z++, M <<= 1;
              if (Q += 1 << Z, c === 1 && 852 < Q || c === 2 && 592 < Q) return 1;
              d[C = I & S] = tt << 24 | Z << 16 | j - i | 0;
            }
          }
          return I !== 0 && (d[j + I] = b - X << 24 | 64 << 16 | 0), o.bits = tt, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(m, z, w) {
        z.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(m, z, w) {
        var a = m("../utils/common"), s = 0, r = 1;
        function l(u) {
          for (var E = u.length; 0 <= --E; ) u[E] = 0;
        }
        var v = 0, c = 29, _ = 256, y = _ + 1 + c, n = 30, d = 19, i = 2 * y + 1, f = 15, o = 16, g = 7, k = 256, C = 16, S = 17, j = 18, R = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], W = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], D = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], H = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], V = new Array(2 * (y + 2));
        l(V);
        var b = new Array(2 * n);
        l(b);
        var F = new Array(512);
        l(F);
        var e = new Array(256);
        l(e);
        var U = new Array(c);
        l(U);
        var tt, Z, X, M = new Array(n);
        function Q(u, E, N, L, h) {
          this.static_tree = u, this.extra_bits = E, this.extra_base = N, this.elems = L, this.max_length = h, this.has_stree = u && u.length;
        }
        function I(u, E) {
          this.dyn_tree = u, this.max_code = 0, this.stat_desc = E;
        }
        function A(u) {
          return u < 256 ? F[u] : F[256 + (u >>> 7)];
        }
        function Y(u, E) {
          u.pending_buf[u.pending++] = 255 & E, u.pending_buf[u.pending++] = E >>> 8 & 255;
        }
        function q(u, E, N) {
          u.bi_valid > o - N ? (u.bi_buf |= E << u.bi_valid & 65535, Y(u, u.bi_buf), u.bi_buf = E >> o - u.bi_valid, u.bi_valid += N - o) : (u.bi_buf |= E << u.bi_valid & 65535, u.bi_valid += N);
        }
        function $(u, E, N) {
          q(u, N[2 * E], N[2 * E + 1]);
        }
        function at(u, E) {
          for (var N = 0; N |= 1 & u, u >>>= 1, N <<= 1, 0 < --E; ) ;
          return N >>> 1;
        }
        function ft(u, E, N) {
          var L, h, x = new Array(f + 1), O = 0;
          for (L = 1; L <= f; L++) x[L] = O = O + N[L - 1] << 1;
          for (h = 0; h <= E; h++) {
            var B = u[2 * h + 1];
            B !== 0 && (u[2 * h] = at(x[B]++, B));
          }
        }
        function nt(u) {
          var E;
          for (E = 0; E < y; E++) u.dyn_ltree[2 * E] = 0;
          for (E = 0; E < n; E++) u.dyn_dtree[2 * E] = 0;
          for (E = 0; E < d; E++) u.bl_tree[2 * E] = 0;
          u.dyn_ltree[2 * k] = 1, u.opt_len = u.static_len = 0, u.last_lit = u.matches = 0;
        }
        function it(u) {
          8 < u.bi_valid ? Y(u, u.bi_buf) : 0 < u.bi_valid && (u.pending_buf[u.pending++] = u.bi_buf), u.bi_buf = 0, u.bi_valid = 0;
        }
        function ut(u, E, N, L) {
          var h = 2 * E, x = 2 * N;
          return u[h] < u[x] || u[h] === u[x] && L[E] <= L[N];
        }
        function st(u, E, N) {
          for (var L = u.heap[N], h = N << 1; h <= u.heap_len && (h < u.heap_len && ut(E, u.heap[h + 1], u.heap[h], u.depth) && h++, !ut(E, L, u.heap[h], u.depth)); ) u.heap[N] = u.heap[h], N = h, h <<= 1;
          u.heap[N] = L;
        }
        function ct(u, E, N) {
          var L, h, x, O, B = 0;
          if (u.last_lit !== 0) for (; L = u.pending_buf[u.d_buf + 2 * B] << 8 | u.pending_buf[u.d_buf + 2 * B + 1], h = u.pending_buf[u.l_buf + B], B++, L === 0 ? $(u, h, E) : ($(u, (x = e[h]) + _ + 1, E), (O = R[x]) !== 0 && q(u, h -= U[x], O), $(u, x = A(--L), N), (O = W[x]) !== 0 && q(u, L -= M[x], O)), B < u.last_lit; ) ;
          $(u, k, E);
        }
        function dt(u, E) {
          var N, L, h, x = E.dyn_tree, O = E.stat_desc.static_tree, B = E.stat_desc.has_stree, G = E.stat_desc.elems, K = -1;
          for (u.heap_len = 0, u.heap_max = i, N = 0; N < G; N++) x[2 * N] !== 0 ? (u.heap[++u.heap_len] = K = N, u.depth[N] = 0) : x[2 * N + 1] = 0;
          for (; u.heap_len < 2; ) x[2 * (h = u.heap[++u.heap_len] = K < 2 ? ++K : 0)] = 1, u.depth[h] = 0, u.opt_len--, B && (u.static_len -= O[2 * h + 1]);
          for (E.max_code = K, N = u.heap_len >> 1; 1 <= N; N--) st(u, x, N);
          for (h = G; N = u.heap[1], u.heap[1] = u.heap[u.heap_len--], st(u, x, 1), L = u.heap[1], u.heap[--u.heap_max] = N, u.heap[--u.heap_max] = L, x[2 * h] = x[2 * N] + x[2 * L], u.depth[h] = (u.depth[N] >= u.depth[L] ? u.depth[N] : u.depth[L]) + 1, x[2 * N + 1] = x[2 * L + 1] = h, u.heap[1] = h++, st(u, x, 1), 2 <= u.heap_len; ) ;
          u.heap[--u.heap_max] = u.heap[1], (function(et, ot) {
            var _t, pt, gt, lt, wt, St, mt = ot.dyn_tree, Dt = ot.max_code, qt = ot.stat_desc.static_tree, Vt = ot.stat_desc.has_stree, Yt = ot.stat_desc.extra_bits, Ft = ot.stat_desc.extra_base, vt = ot.stat_desc.max_length, bt = 0;
            for (lt = 0; lt <= f; lt++) et.bl_count[lt] = 0;
            for (mt[2 * et.heap[et.heap_max] + 1] = 0, _t = et.heap_max + 1; _t < i; _t++) vt < (lt = mt[2 * mt[2 * (pt = et.heap[_t]) + 1] + 1] + 1) && (lt = vt, bt++), mt[2 * pt + 1] = lt, Dt < pt || (et.bl_count[lt]++, wt = 0, Ft <= pt && (wt = Yt[pt - Ft]), St = mt[2 * pt], et.opt_len += St * (lt + wt), Vt && (et.static_len += St * (qt[2 * pt + 1] + wt)));
            if (bt !== 0) {
              do {
                for (lt = vt - 1; et.bl_count[lt] === 0; ) lt--;
                et.bl_count[lt]--, et.bl_count[lt + 1] += 2, et.bl_count[vt]--, bt -= 2;
              } while (0 < bt);
              for (lt = vt; lt !== 0; lt--) for (pt = et.bl_count[lt]; pt !== 0; ) Dt < (gt = et.heap[--_t]) || (mt[2 * gt + 1] !== lt && (et.opt_len += (lt - mt[2 * gt + 1]) * mt[2 * gt], mt[2 * gt + 1] = lt), pt--);
            }
          })(u, E), ft(x, K, u.bl_count);
        }
        function t(u, E, N) {
          var L, h, x = -1, O = E[1], B = 0, G = 7, K = 4;
          for (O === 0 && (G = 138, K = 3), E[2 * (N + 1) + 1] = 65535, L = 0; L <= N; L++) h = O, O = E[2 * (L + 1) + 1], ++B < G && h === O || (B < K ? u.bl_tree[2 * h] += B : h !== 0 ? (h !== x && u.bl_tree[2 * h]++, u.bl_tree[2 * C]++) : B <= 10 ? u.bl_tree[2 * S]++ : u.bl_tree[2 * j]++, x = h, K = (B = 0) === O ? (G = 138, 3) : h === O ? (G = 6, 3) : (G = 7, 4));
        }
        function P(u, E, N) {
          var L, h, x = -1, O = E[1], B = 0, G = 7, K = 4;
          for (O === 0 && (G = 138, K = 3), L = 0; L <= N; L++) if (h = O, O = E[2 * (L + 1) + 1], !(++B < G && h === O)) {
            if (B < K) for (; $(u, h, u.bl_tree), --B != 0; ) ;
            else h !== 0 ? (h !== x && ($(u, h, u.bl_tree), B--), $(u, C, u.bl_tree), q(u, B - 3, 2)) : B <= 10 ? ($(u, S, u.bl_tree), q(u, B - 3, 3)) : ($(u, j, u.bl_tree), q(u, B - 11, 7));
            x = h, K = (B = 0) === O ? (G = 138, 3) : h === O ? (G = 6, 3) : (G = 7, 4);
          }
        }
        l(M);
        var T = !1;
        function p(u, E, N, L) {
          q(u, (v << 1) + (L ? 1 : 0), 3), (function(h, x, O, B) {
            it(h), Y(h, O), Y(h, ~O), a.arraySet(h.pending_buf, h.window, x, O, h.pending), h.pending += O;
          })(u, E, N);
        }
        w._tr_init = function(u) {
          T || ((function() {
            var E, N, L, h, x, O = new Array(f + 1);
            for (h = L = 0; h < c - 1; h++) for (U[h] = L, E = 0; E < 1 << R[h]; E++) e[L++] = h;
            for (e[L - 1] = h, h = x = 0; h < 16; h++) for (M[h] = x, E = 0; E < 1 << W[h]; E++) F[x++] = h;
            for (x >>= 7; h < n; h++) for (M[h] = x << 7, E = 0; E < 1 << W[h] - 7; E++) F[256 + x++] = h;
            for (N = 0; N <= f; N++) O[N] = 0;
            for (E = 0; E <= 143; ) V[2 * E + 1] = 8, E++, O[8]++;
            for (; E <= 255; ) V[2 * E + 1] = 9, E++, O[9]++;
            for (; E <= 279; ) V[2 * E + 1] = 7, E++, O[7]++;
            for (; E <= 287; ) V[2 * E + 1] = 8, E++, O[8]++;
            for (ft(V, y + 1, O), E = 0; E < n; E++) b[2 * E + 1] = 5, b[2 * E] = at(E, 5);
            tt = new Q(V, R, _ + 1, y, f), Z = new Q(b, W, 0, n, f), X = new Q(new Array(0), D, 0, d, g);
          })(), T = !0), u.l_desc = new I(u.dyn_ltree, tt), u.d_desc = new I(u.dyn_dtree, Z), u.bl_desc = new I(u.bl_tree, X), u.bi_buf = 0, u.bi_valid = 0, nt(u);
        }, w._tr_stored_block = p, w._tr_flush_block = function(u, E, N, L) {
          var h, x, O = 0;
          0 < u.level ? (u.strm.data_type === 2 && (u.strm.data_type = (function(B) {
            var G, K = 4093624447;
            for (G = 0; G <= 31; G++, K >>>= 1) if (1 & K && B.dyn_ltree[2 * G] !== 0) return s;
            if (B.dyn_ltree[18] !== 0 || B.dyn_ltree[20] !== 0 || B.dyn_ltree[26] !== 0) return r;
            for (G = 32; G < _; G++) if (B.dyn_ltree[2 * G] !== 0) return r;
            return s;
          })(u)), dt(u, u.l_desc), dt(u, u.d_desc), O = (function(B) {
            var G;
            for (t(B, B.dyn_ltree, B.l_desc.max_code), t(B, B.dyn_dtree, B.d_desc.max_code), dt(B, B.bl_desc), G = d - 1; 3 <= G && B.bl_tree[2 * H[G] + 1] === 0; G--) ;
            return B.opt_len += 3 * (G + 1) + 5 + 5 + 4, G;
          })(u), h = u.opt_len + 3 + 7 >>> 3, (x = u.static_len + 3 + 7 >>> 3) <= h && (h = x)) : h = x = N + 5, N + 4 <= h && E !== -1 ? p(u, E, N, L) : u.strategy === 4 || x === h ? (q(u, 2 + (L ? 1 : 0), 3), ct(u, V, b)) : (q(u, 4 + (L ? 1 : 0), 3), (function(B, G, K, et) {
            var ot;
            for (q(B, G - 257, 5), q(B, K - 1, 5), q(B, et - 4, 4), ot = 0; ot < et; ot++) q(B, B.bl_tree[2 * H[ot] + 1], 3);
            P(B, B.dyn_ltree, G - 1), P(B, B.dyn_dtree, K - 1);
          })(u, u.l_desc.max_code + 1, u.d_desc.max_code + 1, O + 1), ct(u, u.dyn_ltree, u.dyn_dtree)), nt(u), L && it(u);
        }, w._tr_tally = function(u, E, N) {
          return u.pending_buf[u.d_buf + 2 * u.last_lit] = E >>> 8 & 255, u.pending_buf[u.d_buf + 2 * u.last_lit + 1] = 255 & E, u.pending_buf[u.l_buf + u.last_lit] = 255 & N, u.last_lit++, E === 0 ? u.dyn_ltree[2 * N]++ : (u.matches++, E--, u.dyn_ltree[2 * (e[N] + _ + 1)]++, u.dyn_dtree[2 * A(E)]++), u.last_lit === u.lit_bufsize - 1;
        }, w._tr_align = function(u) {
          q(u, 2, 3), $(u, k, V), (function(E) {
            E.bi_valid === 16 ? (Y(E, E.bi_buf), E.bi_buf = 0, E.bi_valid = 0) : 8 <= E.bi_valid && (E.pending_buf[E.pending++] = 255 & E.bi_buf, E.bi_buf >>= 8, E.bi_valid -= 8);
          })(u);
        };
      }, { "../utils/common": 41 }], 53: [function(m, z, w) {
        z.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(m, z, w) {
        (function(a) {
          (function(s, r) {
            if (!s.setImmediate) {
              var l, v, c, _, y = 1, n = {}, d = !1, i = s.document, f = Object.getPrototypeOf && Object.getPrototypeOf(s);
              f = f && f.setTimeout ? f : s, l = {}.toString.call(s.process) === "[object process]" ? function(C) {
                process.nextTick(function() {
                  g(C);
                });
              } : (function() {
                if (s.postMessage && !s.importScripts) {
                  var C = !0, S = s.onmessage;
                  return s.onmessage = function() {
                    C = !1;
                  }, s.postMessage("", "*"), s.onmessage = S, C;
                }
              })() ? (_ = "setImmediate$" + Math.random() + "$", s.addEventListener ? s.addEventListener("message", k, !1) : s.attachEvent("onmessage", k), function(C) {
                s.postMessage(_ + C, "*");
              }) : s.MessageChannel ? ((c = new MessageChannel()).port1.onmessage = function(C) {
                g(C.data);
              }, function(C) {
                c.port2.postMessage(C);
              }) : i && "onreadystatechange" in i.createElement("script") ? (v = i.documentElement, function(C) {
                var S = i.createElement("script");
                S.onreadystatechange = function() {
                  g(C), S.onreadystatechange = null, v.removeChild(S), S = null;
                }, v.appendChild(S);
              }) : function(C) {
                setTimeout(g, 0, C);
              }, f.setImmediate = function(C) {
                typeof C != "function" && (C = new Function("" + C));
                for (var S = new Array(arguments.length - 1), j = 0; j < S.length; j++) S[j] = arguments[j + 1];
                var R = { callback: C, args: S };
                return n[y] = R, l(y), y++;
              }, f.clearImmediate = o;
            }
            function o(C) {
              delete n[C];
            }
            function g(C) {
              if (d) setTimeout(g, 0, C);
              else {
                var S = n[C];
                if (S) {
                  d = !0;
                  try {
                    (function(j) {
                      var R = j.callback, W = j.args;
                      switch (W.length) {
                        case 0:
                          R();
                          break;
                        case 1:
                          R(W[0]);
                          break;
                        case 2:
                          R(W[0], W[1]);
                          break;
                        case 3:
                          R(W[0], W[1], W[2]);
                          break;
                        default:
                          R.apply(r, W);
                      }
                    })(S);
                  } finally {
                    o(C), d = !1;
                  }
                }
              }
            }
            function k(C) {
              C.source === s && typeof C.data == "string" && C.data.indexOf(_) === 0 && g(+C.data.slice(_.length));
            }
          })(typeof self > "u" ? a === void 0 ? this : a : self);
        }).call(this, typeof yt < "u" ? yt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(At)), At.exports;
}
var Ot, Ut;
function ee() {
  if (Ut) return Ot;
  Ut = 1;
  var rt = Et, J = xt, m = parseInt("0777", 8);
  Ot = z.mkdirp = z.mkdirP = z;
  function z(w, a, s, r) {
    typeof a == "function" ? (s = a, a = {}) : (!a || typeof a != "object") && (a = { mode: a });
    var l = a.mode, v = a.fs || J;
    l === void 0 && (l = m), r || (r = null);
    var c = s || /* istanbul ignore next */
    function() {
    };
    w = rt.resolve(w), v.mkdir(w, l, function(_) {
      if (!_)
        return r = r || w, c(null, r);
      switch (_.code) {
        case "ENOENT":
          if (rt.dirname(w) === w) return c(_);
          z(rt.dirname(w), a, function(y, n) {
            y ? c(y, n) : z(w, a, c, n);
          });
          break;
        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          v.stat(w, function(y, n) {
            y || !n.isDirectory() ? c(_, r) : c(null, r);
          });
          break;
      }
    });
  }
  return z.sync = function w(a, s, r) {
    (!s || typeof s != "object") && (s = { mode: s });
    var l = s.mode, v = s.fs || J;
    l === void 0 && (l = m), r || (r = null), a = rt.resolve(a);
    try {
      v.mkdirSync(a, l), r = r || a;
    } catch (_) {
      switch (_.code) {
        case "ENOENT":
          r = w(rt.dirname(a), s, r), w(a, s, r);
          break;
        // In the case of any other error, just see if there's a dir
        // there already.  If so, then hooray!  If not, then something
        // is borked.
        default:
          var c;
          try {
            c = v.statSync(a);
          } catch {
            throw _;
          }
          if (!c.isDirectory()) throw _;
          break;
      }
    }
    return r;
  }, Ot;
}
var It = { exports: {} }, Nt;
function re() {
  return Nt || (Nt = 1, (function() {
    var rt, J = null, m = typeof window == "object" ? window : yt, z = !1, w = m.process, a = Array, s = Error, r = 0, l = 1, v = 2, c = "Symbol", _ = "iterator", y = "species", n = c + "(" + y + ")", d = "return", i = "_uh", f = "_pt", o = "_st", g = "Invalid this", k = "Invalid argument", C = `
From previous `, S = "Chaining cycle detected for promise", j = "Uncaught (in promise)", R = "rejectionHandled", W = "unhandledRejection", D, H, V = { e: J }, b = function() {
    }, F = /^.+\/node_modules\/yaku\/.+\n?/mg, e = It.exports = function(x) {
      var O = this, B;
      if (!Z(O) || O._s !== rt)
        throw at(g);
      if (O._s = v, z && (O[f] = ft()), x !== b) {
        if (!X(x))
          throw at(k);
        B = Y(x)(
          dt(O, l),
          dt(O, r)
        ), B === V && u(O, r, B.e);
      }
    };
    e.default = e, tt(e, {
      /**
       * Appends fulfillment and rejection handlers to the promise,
       * and returns a new promise resolving to the return value of the called handler.
       * @param  {Function} onFulfilled Optional. Called when the Promise is resolved.
       * @param  {Function} onRejected  Optional. Called when the Promise is rejected.
       * @return {Yaku} It will return a new Yaku which will resolve or reject after
       * @example
       * the current Promise.
       * ```js
       * var Promise = require('yaku');
       * var p = Promise.resolve(10);
       *
       * p.then((v) => {
       *     console.log(v);
       * });
       * ```
       */
      then: function(x, O) {
        if (this._s === void 0) throw at();
        return t(
          this,
          ct(e.speciesConstructor(this, e)),
          x,
          O
        );
      },
      /**
       * The `catch()` method returns a Promise and deals with rejected cases only.
       * It behaves the same as calling `Promise.prototype.then(undefined, onRejected)`.
       * @param  {Function} onRejected A Function called when the Promise is rejected.
       * This function has one argument, the rejection reason.
       * @return {Yaku} A Promise that deals with rejected cases only.
       * @example
       * ```js
       * var Promise = require('yaku');
       * var p = Promise.reject(new Error("ERR"));
       *
       * p['catch']((v) => {
       *     console.log(v);
       * });
       * ```
       */
      catch: function(h) {
        return this.then(rt, h);
      },
      // The number of current promises that attach to this Yaku instance.
      _pCount: 0,
      // The parent Yaku.
      _pre: J,
      // A unique type flag, it helps different versions of Yaku know each other.
      _Yaku: 1
    }), e.resolve = function(x) {
      return st(x) ? x : E(ct(this), x);
    }, e.reject = function(x) {
      return u(ct(this), r, x);
    }, e.race = function(x) {
      var O = this, B = ct(O), G = function(ot) {
        u(B, l, ot);
      }, K = function(ot) {
        u(B, r, ot);
      }, et = Y($)(x, function(ot) {
        O.resolve(ot).then(G, K);
      });
      return et === V ? O.reject(et.e) : B;
    }, e.all = function(x) {
      var O = this, B = ct(O), G = [], K;
      function et(ot) {
        u(B, r, ot);
      }
      return K = Y($)(x, function(ot, _t) {
        O.resolve(ot).then(function(pt) {
          G[_t] = pt, --K || u(B, l, G);
        }, et);
      }), K === V ? O.reject(K.e) : (K || u(B, l, []), B);
    }, e.Symbol = m[c] || {}, Y(function() {
      Object.defineProperty(e, U(), {
        get: function() {
          return this;
        }
      });
    })(), e.speciesConstructor = function(h, x) {
      var O = h.constructor;
      return O && O[U()] || x;
    }, e.unhandledRejection = function(h, x) {
      try {
        m.console.error(
          j,
          z ? x.longStack : T(h, x)
        );
      } catch {
      }
    }, e.rejectionHandled = b, e.enableLongStackTrace = function() {
      z = !0;
    }, e.nextTick = w ? w.nextTick : function(h) {
      setTimeout(h);
    }, e._Yaku = 1;
    function U() {
      return e[c][y] || n;
    }
    function tt(h, x) {
      for (var O in x)
        h.prototype[O] = x[O];
      return h;
    }
    function Z(h) {
      return h && typeof h == "object";
    }
    function X(h) {
      return typeof h == "function";
    }
    function M(h, x) {
      return h instanceof x;
    }
    function Q(h) {
      return M(h, s);
    }
    function I(h, x, O) {
      if (!x(h)) throw at(O);
    }
    function A() {
      try {
        return D.apply(H, arguments);
      } catch (h) {
        return V.e = h, V;
      }
    }
    function Y(h, x) {
      return D = h, H = x, A;
    }
    function q(h, x) {
      var O = a(h), B = 0;
      function G() {
        for (var K = 0; K < B; )
          x(O[K], O[K + 1]), O[K++] = rt, O[K++] = rt;
        B = 0, O.length > h && (O.length = h);
      }
      return function(K, et) {
        O[B++] = K, O[B++] = et, B === 2 && e.nextTick(G);
      };
    }
    function $(h, x) {
      var O, B = 0, G, K, et;
      if (!h) throw at(k);
      var ot = h[e[c][_]];
      if (X(ot))
        G = ot.call(h);
      else if (X(h.next))
        G = h;
      else if (M(h, a)) {
        for (O = h.length; B < O; )
          x(h[B], B++);
        return B;
      } else
        throw at(k);
      for (; !(K = G.next()).done; )
        if (et = Y(x)(K.value, B++), et === V)
          throw X(G[d]) && G[d](), et.e;
      return B;
    }
    function at(h) {
      return new TypeError(h);
    }
    function ft(h) {
      return (h ? "" : C) + new s().stack;
    }
    var nt = q(999, function(h, x) {
      var O, B;
      if (B = h._s ? x._onFulfilled : x._onRejected, B === rt) {
        u(x, h._s, h._v);
        return;
      }
      if (O = Y(p)(B, h._v), O === V) {
        u(x, r, O.e);
        return;
      }
      E(x, O);
    }), it = q(9, function(h) {
      P(h) || (h[i] = 1, ut(W, h));
    });
    function ut(h, x) {
      var O = "on" + h.toLowerCase(), B = m[O];
      w && w.listeners(h).length ? h === W ? w.emit(h, x._v, x) : w.emit(h, x) : B ? B({ reason: x._v, promise: x }) : e[h](x._v, x);
    }
    function st(h) {
      return h && h._Yaku;
    }
    function ct(h) {
      if (st(h)) return new h(b);
      var x, O, B;
      return x = new h(function(G, K) {
        if (x) throw at();
        O = G, B = K;
      }), I(O, X), I(B, X), x;
    }
    function dt(h, x) {
      return function(O) {
        z && (h[o] = ft(!0)), x === l ? E(h, O) : u(h, x, O);
      };
    }
    function t(h, x, O, B) {
      return X(O) && (x._onFulfilled = O), X(B) && (h[i] && ut(R, h), x._onRejected = B), z && (x._pre = h), h[h._pCount++] = x, h._s !== v && nt(h, x), x;
    }
    function P(h) {
      if (h._umark)
        return !0;
      h._umark = !0;
      for (var x = 0, O = h._pCount, B; x < O; )
        if (B = h[x++], B._onRejected || P(B)) return !0;
    }
    function T(h, x) {
      var O = [];
      function B(G) {
        return O.push(G.replace(/^\s+|\s+$/g, ""));
      }
      return z && (x[o] && B(x[o]), (function G(K) {
        K && f in K && (G(K._next), B(K[f] + ""), G(K._pre));
      })(x)), (h && h.stack ? h.stack : h) + (`
` + O.join(`
`)).replace(F, "");
    }
    function p(h, x) {
      return h(x);
    }
    function u(h, x, O) {
      var B = 0, G = h._pCount;
      if (h._s === v)
        for (h._s = x, h._v = O, x === r && (z && Q(O) && (O.longStack = T(O, h)), it(h)); B < G; )
          nt(h, h[B++]);
      return h;
    }
    function E(h, x) {
      if (x === h && x)
        return u(h, r, at(S)), h;
      if (x !== J && (X(x) || Z(x))) {
        var O = Y(N)(x);
        if (O === V)
          return u(h, r, O.e), h;
        X(O) ? (z && st(x) && (h._next = x), st(x) ? L(h, x, O) : e.nextTick(function() {
          L(h, x, O);
        })) : u(h, l, x);
      } else
        u(h, l, x);
      return h;
    }
    function N(h) {
      return h.then;
    }
    function L(h, x, O) {
      var B = Y(O, x)(function(G) {
        x && (x = J, E(h, G));
      }, function(G) {
        x && (x = J, u(h, r, G));
      });
      B === V && x && (u(h, r, B.e), x = J);
    }
  })()), It.exports;
}
var Tt, Lt;
function ne() {
  if (Lt) return Tt;
  Lt = 1;
  var rt = re();
  return Tt = {
    extendPrototype: function(J, m) {
      for (var z in m)
        J.prototype[z] = m[z];
      return J;
    },
    isFunction: function(J) {
      return typeof J == "function";
    },
    isNumber: function(J) {
      return typeof J == "number";
    },
    Promise: rt,
    slice: [].slice
  }, Tt;
}
var Bt, Zt;
function ie() {
  if (Zt) return Bt;
  Zt = 1;
  var rt = ne(), J = rt.isFunction;
  return Bt = function(m, z) {
    return function(w, a, s, r, l) {
      var v = arguments.length, c, _, y, n;
      _ = new rt.Promise(function(f, o) {
        y = f, n = o;
      });
      function d(f, o) {
        f == null ? y(o) : n(f);
      }
      switch (v) {
        case 0:
          m.call(z, d);
          break;
        case 1:
          J(w) ? m.call(z, w) : m.call(z, w, d);
          break;
        case 2:
          J(a) ? m.call(z, w, a) : m.call(z, w, a, d);
          break;
        case 3:
          J(s) ? m.call(z, w, a, s) : m.call(z, w, a, s, d);
          break;
        case 4:
          J(r) ? m.call(z, w, a, s, r) : m.call(z, w, a, s, r, d);
          break;
        case 5:
          J(l) ? m.call(z, w, a, s, r, l) : m.call(z, w, a, s, r, l, d);
          break;
        default:
          c = new Array(v);
          for (var i = 0; i < v; i++)
            c[i] = arguments[i];
          if (J(c[v - 1]))
            return m.apply(z, c);
          c[i] = d, m.apply(z, c);
      }
      return _;
    };
  }, Bt;
}
var Rt, Wt;
function ae() {
  if (Wt) return Rt;
  Wt = 1;
  var rt = xt, J = Et, m = te(), z = ee(), w = ie(), a = w(rt.writeFile), s = w(rt.readFile), r = w(z);
  function l(c) {
    function _(k, C, S, j) {
      var R = 0;
      return R += k, R += C << 8, R += S << 16, R += j << 24, R;
    }
    if (c[0] === 80 && c[1] === 75 && c[2] === 3 && c[3] === 4)
      return c;
    if (c[0] !== 67 || c[1] !== 114 || c[2] !== 50 || c[3] !== 52)
      throw new Error("Invalid header: Does not start with Cr24");
    var y = c[4] === 3, n = c[4] === 2;
    if (!n && !y || c[5] || c[6] || c[7])
      throw new Error("Unexpected crx format version number.");
    if (n) {
      var d = _(c[8], c[9], c[10], c[11]), i = _(c[12], c[13], c[14], c[15]), f = 16 + d + i;
      return c.slice(f, c.length);
    }
    var o = _(c[8], c[9], c[10], c[11]), g = 12 + o;
    return c.slice(g, c.length);
  }
  function v(c, _) {
    var y = J.resolve(c), n = J.extname(c), d = J.basename(c, n), i = J.dirname(c);
    return _ = _ || J.resolve(i, d), s(y).then(function(f) {
      return m.loadAsync(l(f));
    }).then(function(f) {
      var o = Object.keys(f.files);
      return Promise.all(o.map(function(g) {
        var k = !f.files[g].dir, C = J.join(_, g), S = k && J.dirname(C) || C, j = f.files[g].async("nodebuffer");
        return r(S).then(function() {
          return k ? j : !1;
        }).then(function(R) {
          return R ? a(C, R) : !0;
        });
      }));
    });
  }
  return Rt = v, Rt;
}
var Mt;
function se() {
  return Mt || (Mt = 1, (function(rt) {
    Object.defineProperty(rt, "__esModule", { value: !0 }), rt.downloadChromeExtension = void 0;
    const J = xt, m = Et, z = Qt(), w = ae(), a = async (s, { forceDownload: r = !1, attempts: l = 5 } = {}) => {
      const v = (0, z.getPath)();
      J.existsSync(v) || await J.promises.mkdir(v, { recursive: !0 });
      const c = m.resolve(`${v}/${s}`);
      if (!J.existsSync(c) || r) {
        J.existsSync(c) && await J.promises.rmdir(c, {
          recursive: !0
        });
        const _ = `https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D${s}%26uc&prodversion=${process.versions.chrome}`, y = m.resolve(`${c}.crx`);
        try {
          await (0, z.downloadFile)(_, y);
          try {
            return await w(y, c), (0, z.changePermissions)(c, 755), c;
          } catch (n) {
            if (!J.existsSync(m.resolve(c, "manifest.json")))
              throw n;
          }
        } catch (n) {
          if (console.error(`Failed to fetch extension, trying ${l - 1} more times`), l <= 1)
            throw n;
          return await new Promise((d) => setTimeout(d, 200)), await (0, rt.downloadChromeExtension)(s, {
            forceDownload: r,
            attempts: l - 1
          });
        }
      }
      return c;
    };
    rt.downloadChromeExtension = a;
  })(Ct)), Ct;
}
var Ht;
function oe() {
  if (Ht) return ht;
  Ht = 1, Object.defineProperty(ht, "__esModule", { value: !0 }), ht.MOBX_DEVTOOLS = ht.REDUX_DEVTOOLS = ht.VUEJS_DEVTOOLS_BETA = ht.VUEJS_DEVTOOLS = ht.JQUERY_DEBUGGER = ht.BACKBONE_DEBUGGER = ht.REACT_DEVELOPER_TOOLS = ht.EMBER_INSPECTOR = void 0, ht.installExtension = m;
  const rt = $t, J = se();
  async function m(z, w = {}) {
    const { forceDownload: a, loadExtensionOptions: s, session: r } = w, l = r || rt.session.defaultSession;
    if (process.type !== "browser")
      return Promise.reject(new Error("electron-devtools-installer can only be used from the main process"));
    if (Array.isArray(z))
      return z.reduce((y, n) => y.then(async (d) => {
        const i = await m(n, w);
        return [...d, i];
      }), Promise.resolve([]));
    let v;
    if (typeof z == "object" && z.id)
      v = z.id;
    else if (typeof z == "string")
      v = z;
    else
      throw new Error(`Invalid extensionReference passed in: "${z}"`);
    const c = l.getAllExtensions().find((y) => y.id === v);
    if (!a && c)
      return c;
    const _ = await (0, J.downloadChromeExtension)(v, {
      forceDownload: a || !1
    });
    if (c?.id) {
      const y = new Promise((n) => {
        const d = (i, f) => {
          f.id === c.id && (l.removeListener("extension-unloaded", d), n());
        };
        l.on("extension-unloaded", d);
      });
      l.removeExtension(c.id), await y;
    }
    return l.loadExtension(_, s);
  }
  return ht.default = m, ht.EMBER_INSPECTOR = {
    id: "bmdblncegkenkacieihfhpjfppoconhi"
  }, ht.REACT_DEVELOPER_TOOLS = {
    id: "fmkadmapgofadopljbjfkapdkoienihi"
  }, ht.BACKBONE_DEBUGGER = {
    id: "bhljhndlimiafopmmhjlgfpnnchjjbhd"
  }, ht.JQUERY_DEBUGGER = {
    id: "dbhhnnnpaeobfddmlalhnehgclcmjimi"
  }, ht.VUEJS_DEVTOOLS = {
    id: "nhdogjmejiglipccpnnnanhbledajbpd"
  }, ht.VUEJS_DEVTOOLS_BETA = {
    id: "ljjemllljcmogpfapbkkighbhhppjdbg"
  }, ht.REDUX_DEVTOOLS = {
    id: "lmhkpmbekcpmknklioeibfkpmmfibljd"
  }, ht.MOBX_DEVTOOLS = {
    id: "pfgnfdagidkfgccljigdamigbcnndkod"
  }, ht;
}
var Gt = oe();
const ue = /* @__PURE__ */ Kt(Gt), pe = /* @__PURE__ */ Jt({
  __proto__: null,
  default: ue
}, [Gt]);
export {
  pe as i
};
