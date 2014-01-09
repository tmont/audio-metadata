var utils = require('./utils');

function checkMagicId3(view, offset) {
	var id3Magic = utils.readBytes(view, offset, 3);
	//"ID3"
	return id3Magic[0] === 73 && id3Magic[1] === 68 && id3Magic[2] === 51;
}

function getUint28(view, offset) {
	var sizeBytes = utils.readBytes(view, offset, 4);
	var mask = 0xfffffff;
	return ((sizeBytes[0] & mask) << 21) |
		((sizeBytes[1] & mask) << 14) |
		((sizeBytes[2] & mask) << 7) |
		(sizeBytes[3] & mask);
}

module.exports = function(buffer) {
	var view = utils.createView(buffer);
	if (!checkMagicId3(view, 0)) {
		throw new Error('Magic ID3 failed');
	}

	var offset = 3;
	offset += 2;
	var flags = view.getUint8(offset);
	offset++;
	var size = getUint28(view, offset);
	offset += 4;

	var extendedHeader = (flags & 128) > 0;

	if (extendedHeader) {
		offset += getUint28(view, offset);
	}

	function readFrame(offset) {
		var id = utils.readAscii(view, offset, 4);
		var size = getUint28(view, offset + 4);
		offset += 10;

		var encoding = view.getUint8(offset),
			data = null;

		if (encoding <= 3) {
			offset++;
			if (encoding === 3) {
				//UTF8 - null terminated
				data = utils.readUtf8(view, offset, size - 2);
			} else {
				//ISO-8859-1, UTF-16, UTF-16BE
				//UTF-16 and UTF-16BE are $FF $00 terminated
				//ISO is null terminated

				//screw these encodings, read it as ascii
				data = utils.readAscii(view, offset, size - (encoding === 0 ? 2 : 3));
			}
		} else {
			//no encoding info, read it as ascii
			data = utils.readAscii(view, offset, size);
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