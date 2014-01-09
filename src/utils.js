function toArrayBuffer(buffer) {
	var arrayBuffer = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(arrayBuffer);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return arrayBuffer;
}

module.exports = {
	createView: function(buffer) {
		if (typeof(Buffer) !== 'undefined' && buffer instanceof Buffer) {
			//convert nodejs buffers to ArrayBuffer
			buffer = toArrayBuffer(buffer);
		}

		if (!(buffer instanceof ArrayBuffer)) {
			throw new Error('Expected instance of Buffer or ArrayBuffer');
		}

		return new DataView(buffer);
	},

	readBytes: function(view, offset, length, target) {
		var bytes = [];
		for (var i = 0; i < length; i++) {
			var value = view.getUint8(offset + i);
			bytes.push(value);
			if (target) {
				target.setUint8(i, value);
			}
		}

		return bytes;
	},

	readAscii: function(view, offset, length) {
		var s = '';
		for (var i = 0; i < length; i++) {
			s += String.fromCharCode(view.getUint8(offset + i));
		}

		return s;
	},

	readUtf8: function(view, offset, length) {
		var buffer = view.buffer.slice(offset, offset + length);

		//http://stackoverflow.com/a/17192845 - convert byte array to UTF8 string
		var encodedString = String.fromCharCode.apply(null, new Uint8Array(buffer));
		return decodeURIComponent(escape(encodedString));
	}
};