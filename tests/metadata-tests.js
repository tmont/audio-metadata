var should = require('should'),
	path = require('path'),
	fs = require('fs'),
	metaDataReader = require('../');

describe('ogg', function() {
	it('should read comments from avconv-generated ogg', function(done) {
		var file = path.join(__dirname, 'files', 'test.ogg');
		fs.readFile(file, function(err, buffer) {
			if (err) {
				done(err);
				return;
			}

			var metadata = metaDataReader.ogg(buffer);
			should.exist(metadata);
			metadata.should.have.property('title', 'Contra Base Snippet');
			metadata.should.have.property('artist', 'Konami');
			metadata.should.have.property('album', 'Bill and Lance\'s Excellent Adventure');
			metadata.should.have.property('year', '1988');
			metadata.should.have.property('encoder', 'Lavf53.21.1');
			metadata.should.have.property('tracknumber', '1');
			done();
		});
	});
});

describe('id3', function() {
	it('should read id3v2.4.0', function(done) {
		var file = path.join(__dirname, 'files', 'test_id3v2.4.mp3');
		fs.readFile(file, function(err, buffer) {
			if (err) {
				done(err);
				return;
			}

			var metadata = metaDataReader.id3v2(buffer);
			should.exist(metadata);
			metadata.should.have.property('title', 'Contra');
			metadata.should.have.property('artist', 'Bill & Ted');
			metadata.should.have.property('album', 'Konami');
			metadata.should.have.property('year', '2000');
			metadata.should.have.property('encoder', 'Lavf53.21.1');
			metadata.should.have.property('track', '2');
			done();
		});
	});
});