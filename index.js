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

function readUtf8(view, offset, length) {
	var buffer = view.buffer.slice(offset, offset + length);

	//http://stackoverflow.com/a/17192845 - convert byte array to UTF8 string
	var encodedString = String.fromCharCode.apply(null, new Uint8Array(buffer));
	return decodeURIComponent(escape(encodedString));
}

function readAscii(view, offset, length) {
	var s = '';
	for (var i = 0; i < length; i++) {
		s += String.fromCharCode(view.getUint8(offset + i));
	}

	return s;
}

function normalizeCommentKey(key) {
	return key.toLowerCase();
}

function getArrayBuffer(buffer) {
	if (typeof(Buffer) !== 'undefined' && buffer instanceof Buffer) {
		//convert nodejs buffers to ArrayBuffer
		buffer = toArrayBuffer(buffer);
	}

	if (!(buffer instanceof ArrayBuffer)) {
		throw new Error('Expected instance of Buffer or ArrayBuffer');
	}

	return buffer;
}

/**
 * See http://www.ietf.org/rfc/rfc3533.txt
 * @param {Buffer|ArrayBuffer} buffer
 */
exports.ogg = function(buffer) {
	var view = new DataView(getArrayBuffer(buffer));

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
				comment = readUtf8(packet, offset + 4, commentLength),
				equals = comment.indexOf('=');

			comments[normalizeCommentKey(comment.substring(0, equals))] = comment.substring(equals + 1);
			offset += 4 + commentLength;
		}

		return comments;
	}

	return parseComments(parsePage(parsePage(0).pageSize, true).packet);
};

function checkMagicId3(view, offset) {
	var id3Magic = readBytes(view, offset, 3);
	//"ID3"
	return id3Magic[0] === 73 && id3Magic[1] === 68 && id3Magic[2] === 51;
}

function getUint28(view, offset) {
	var sizeBytes = readBytes(view, offset, 4);
	var mask = 0xfffffff;
	return ((sizeBytes[0] & mask) << 21) |
		((sizeBytes[1] & mask) << 14) |
		((sizeBytes[2] & mask) << 7) |
		(sizeBytes[3] & mask);
}

exports.id3 = function(buffer) {
	var view = new DataView(buffer);
	if (checkMagicId3(view, 0)) {
		return exports.id3v2(buffer);
	}

	//TODO id3v1
	return {};
};

exports.id3v2 = function(buffer) {
	var view = new DataView(getArrayBuffer(buffer));
	if (!checkMagicId3(view, 0)) {
		throw new Error('Magic ID3 failed');
	}

	var offset = 3;
	var majorVersion = view.getUint8(offset);
	var minorVersion = view.getUint8(offset + 1);
	offset += 2;
	var flags = view.getUint8(offset);
	offset++;
	var size = getUint28(view, offset);
	offset += 4;

	var unsynchronization = (flags & 256) > 0;
	var extendedHeader = (flags & 128) > 0;
	var experimental = (flags & 64) > 0;
	var footerPresent = (flags & 32) > 0;

	if (extendedHeader) {
		var ehSize = getUint28(view, offset);
		offset += 4;
		var ehNumFlags = view.getUint8(offset);
		offset++;
		var ehFlags = view.getUint8(offset);
		offset++;
		var ehData = readBytes(view, offset, ehSize - 6);
	}

	function readFrame(offset) {
		var id = readAscii(view, offset, 4);
		offset += 4;
		var size = getUint28(view, offset);
		offset += 4;
		var flags = view.getUint16(view, offset);
		offset += 2;

		var encoding = view.getUint8(offset),
			data = null;

		if (encoding <= 3) {
			offset++;
			if (encoding === 3) {
				//UTF8 - null terminated
				data = readUtf8(view, offset, size - 2);
			} else {
				//ISO-8859-1, UTF-16, UTF-16BE
				//UTF-16 and UTF-16BE are $FF $00 terminated
				//ISO is null terminated

				//screw these encodings, read it as ascii
				data = readAscii(view, offset, size - (encoding === 0 ? 2 : 3));
			}
		} else {
			//no encoding info, read it as ascii
			data = readAscii(view, offset, size);
		}

		return {
			id: id,
			size: size + 10,
			content: data
		};
	}

	var idMap = {
		TALB: 'album',
		TCOM: 'composer',
		TIT1: 'title',
		TIT2: 'title',
		TPE1: 'artist',
		TRCK: 'track',
		TSSE: 'encoder',
		TCOP: 'year'
	};

	var endOfTags = offset + size,
		frames = {};
	while (offset < endOfTags) {
		var frame = readFrame(offset);
		offset += frame.size;
		var id = idMap[frame.id] || frame.id;
		if (id === 'TXXX') {
			var nullByte = frame.content.indexOf('\u0000');
			id = frame.content.substring(0, nullByte);
			frames[id] = frame.content.substring(nullByte + 1);
		} else {
			frames[id] = frame.content;
		}
	}

	return frames;
};