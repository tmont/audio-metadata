function toArrayBuffer(buffer) {
	var arrayBuffer = new ArrayBuffer(buffer.length);
	var view = new Uint8Array(arrayBuffer);
	for (var i = 0; i < buffer.length; ++i) {
		view[i] = buffer[i];
	}
	return arrayBuffer;
}

function readBytes(view, offset, length, target) {
	var bytes = [];
	for (var i = 0; i < length; i++) {
		var value = view.getUint8(offset + i);
		bytes.push(value);
		if (target) {
			target.setUint8(i, value);
		}
	}

	return bytes;
}

function readString(view, offset, length) {
	var buffer = view.buffer.slice(offset, offset + length);

	//http://stackoverflow.com/a/17192845 - convert byte array to UTF8 string
	var encodedString = String.fromCharCode.apply(null, new Uint8Array(buffer));
	return decodeURIComponent(escape(encodedString));
}

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param {Buffer|ArrayBuffer} buffer
 */
exports.ogg = function(buffer) {
	if (typeof(Buffer) !== 'undefined' && buffer instanceof Buffer) {
		//convert nodejs buffers to ArrayBuffer
		buffer = toArrayBuffer(buffer);
	}

	if (!(buffer instanceof ArrayBuffer)) {
		throw new Error('Expected instance of Buffer or ArrayBuffer');
	}

	var view = new DataView(buffer);

	function parsePage(offset, withPacket) {
		var numPageSegments = view.getUint8(offset + 26),
			segmentTable = readBytes(view, offset + 27, numPageSegments),
			headerSize = 27 + segmentTable.length,
			pageSize = headerSize + segmentTable.reduce(function(cur, next) { return cur + next; }),
			length = headerSize + 1 + 'vorbis'.length,
			packetView = null;

		if (withPacket) {
			packetView = new DataView(new ArrayBuffer(pageSize - length));
			readBytes(view, offset + length, pageSize - length, packetView);
		}

		return {
			pageSize: pageSize,
			packet: packetView
		};
	}

	function parseComments(packet) {
		var vendorLength = packet.getUint32(0, true),
			commentListLength = packet.getUint32(4 + vendorLength, true),
			comments = {},
			offset = 8 + vendorLength;

		for (var i = 0; i < commentListLength; i++) {
			var commentLength = packet.getUint32(offset, true),
				comment = readString(packet, offset + 4, commentLength),
				equals = comment.indexOf('=');

			comments[comment.substring(0, equals).toLowerCase()] = comment.substring(equals + 1);
			offset += 4 + commentLength;
		}

		return comments;
	}

	return parseComments(parsePage(parsePage(0).pageSize, true).packet);
};