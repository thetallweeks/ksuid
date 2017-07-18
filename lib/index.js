'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('crypto'),
    randomBytes = _require.randomBytes;

var _require2 = require('util'),
    promisify = _require2.promisify,
    customInspectSymbol = _require2.inspect.custom;

var base62 = require('./base62');

var asyncRandomBytes = promisify(randomBytes

// KSUID's epoch starts more recently so that the 32-bit number space gives a
// significantly higher useful lifetime of around 136 years from March 2014.
// This number (14e11) was picked to be easy to remember.
);var EPOCH_IN_MS = 14e11;

var MAX_TIME_IN_MS = 1e3 * (Math.pow(2, 32) - 1) + EPOCH_IN_MS;

// Timestamp is a uint32
var TIMESTAMP_BYTE_LENGTH = 4;

// Payload is 16-bytes
var PAYLOAD_BYTE_LENGTH = 16;

// KSUIDs are 20 bytes when binary encoded
var BYTE_LENGTH = TIMESTAMP_BYTE_LENGTH + PAYLOAD_BYTE_LENGTH;

// The length of a KSUID when string (base62) encoded
var STRING_ENCODED_LENGTH = 27;

var TIME_IN_MS_ASSERTION = ('Valid KSUID timestamps must be in milliseconds since ' + new Date(0).toISOString() + ',\n  no earlier than ' + new Date(EPOCH_IN_MS).toISOString() + ' and no later than ' + new Date(MAX_TIME_IN_MS).toISOString() + '\n').trim().replace(/(\n|\s)+/g, ' ').replace(/\.000Z/g, 'Z');

var VALID_ENCODING_ASSERTION = 'Valid encoded KSUIDs are ' + STRING_ENCODED_LENGTH + ' characters';

var VALID_BUFFER_ASSERTION = 'Valid KSUID buffers are ' + BYTE_LENGTH + ' bytes';

var VALID_PAYLOAD_ASSERTION = 'Valid KSUID payloads are ' + PAYLOAD_BYTE_LENGTH + ' bytes';

function _fromParts(timeInMs, payload) {
  var timestamp = Math.floor((timeInMs - EPOCH_IN_MS) / 1e3);
  var timestampBuffer = Buffer.allocUnsafe(TIMESTAMP_BYTE_LENGTH);
  timestampBuffer.writeUInt32BE(timestamp, 0);

  return Buffer.concat([timestampBuffer, payload], BYTE_LENGTH);
}

var bufferLookup = new WeakMap();

var KSUID = function () {
  function KSUID(buffer) {
    _classCallCheck(this, KSUID);

    if (!KSUID.isValid(buffer)) {
      throw new TypeError(VALID_BUFFER_ASSERTION);
    }

    bufferLookup.set(this, buffer);
    Object.defineProperty(this, 'buffer', {
      enumerable: true,
      get: function get() {
        return Buffer.from(buffer);
      }
    });
  }

  _createClass(KSUID, [{
    key: 'compare',
    value: function compare(other) {
      if (!bufferLookup.has(other)) {
        return 0;
      }

      return bufferLookup.get(this).compare(bufferLookup.get(other), 0, BYTE_LENGTH);
    }
  }, {
    key: 'equals',
    value: function equals(other) {
      return this === other || bufferLookup.has(other) && this.compare(other) === 0;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this[Symbol.toStringTag] + ' { ' + this.string + ' }';
    }
  }, {
    key: customInspectSymbol,
    value: function value() {
      return this.toString();
    }
  }, {
    key: 'date',
    get: function get() {
      return new Date(1e3 * this.timestamp + EPOCH_IN_MS);
    }
  }, {
    key: 'timestamp',
    get: function get() {
      return bufferLookup.get(this).readUInt32BE(0);
    }
  }, {
    key: 'payload',
    get: function get() {
      var payload = bufferLookup.get(this).slice(TIMESTAMP_BYTE_LENGTH, BYTE_LENGTH);
      return Buffer.from(payload);
    }
  }, {
    key: 'string',
    get: function get() {
      var encoded = base62.encode(bufferLookup.get(this), STRING_ENCODED_LENGTH);
      return encoded.padStart(STRING_ENCODED_LENGTH, '0');
    }
  }], [{
    key: 'random',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var payload;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return asyncRandomBytes(PAYLOAD_BYTE_LENGTH);

              case 2:
                payload = _context.sent;
                return _context.abrupt('return', new KSUID(_fromParts(Date.now(), payload)));

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function random() {
        return _ref.apply(this, arguments);
      }

      return random;
    }()
  }, {
    key: 'randomSync',
    value: function randomSync() {
      var payload = randomBytes(PAYLOAD_BYTE_LENGTH);
      return new KSUID(_fromParts(Date.now(), payload));
    }
  }, {
    key: 'fromParts',
    value: function fromParts(timeInMs, payload) {
      if (!Number.isInteger(timeInMs) || timeInMs < EPOCH_IN_MS || timeInMs > MAX_TIME_IN_MS) {
        throw new TypeError(TIME_IN_MS_ASSERTION);
      }
      if (!Buffer.isBuffer(payload) || payload.byteLength !== PAYLOAD_BYTE_LENGTH) {
        throw new TypeError(VALID_PAYLOAD_ASSERTION);
      }

      return new KSUID(_fromParts(timeInMs, payload));
    }
  }, {
    key: 'isValid',
    value: function isValid(buffer) {
      return Buffer.isBuffer(buffer) && buffer.byteLength === BYTE_LENGTH;
    }
  }, {
    key: 'parse',
    value: function parse(string) {
      if (string.length !== STRING_ENCODED_LENGTH) {
        throw new TypeError(VALID_ENCODING_ASSERTION);
      }

      var decoded = base62.decode(string, BYTE_LENGTH);
      if (decoded.byteLength === BYTE_LENGTH) {
        return new KSUID(decoded);
      }

      var buffer = Buffer.allocUnsafe(BYTE_LENGTH);
      var padEnd = BYTE_LENGTH - decoded.byteLength;
      buffer.fill(0, 0, padEnd);
      decoded.copy(buffer, padEnd);
      return new KSUID(buffer);
    }
  }]);

  return KSUID;
}();

Object.defineProperty(KSUID.prototype, Symbol.toStringTag, { value: 'KSUID' }
// A string-encoded maximum value for a KSUID
);Object.defineProperty(KSUID, 'MAX_STRING_ENCODED', { value: 'aWgEPTl1tmebfsQzFP4bxwgy80V' });

module.exports = KSUID;