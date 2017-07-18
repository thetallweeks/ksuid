'use strict';

var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Compact base conversion.
function convert(input, from, to) {
  var maxLength = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : Math.ceil(input.length * Math.log2(from) / Math.log2(to));

  var result = new Array(maxLength);

  // Each iteration prepends the resulting value, so start the offset at the
  // end.
  var offset = maxLength;
  while (input.length > 0) {
    var quotients = [];
    var remainder = 0;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = input[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var digit = _step.value;

        var acc = digit + remainder * from;
        var q = Math.floor(acc / to);
        remainder = acc % to;

        if (quotients.length > 0 || q > 0) {
          quotients.push(q);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    result[--offset] = remainder;
    input = quotients;
  }

  // Trim leading padding.
  return offset > 0 ? result.slice(offset) : result;
}

function encode(buffer, maxLength) {
  return convert(buffer, 256, 62, maxLength).map(function (value) {
    return CHARS[value];
  }).join('');
}
exports.encode = encode;

function decode(string, maxLength) {
  // Optimization from https://github.com/andrew/base62.js/pull/31.
  var input = Array.from(string, function (char) {
    var charCode = char.charCodeAt(0);
    if (charCode < 58) return charCode - 48;
    if (charCode < 91) return charCode - 55;
    return charCode - 61;
  });
  return Buffer.from(convert(input, 62, 256, maxLength));
}
exports.decode = decode;