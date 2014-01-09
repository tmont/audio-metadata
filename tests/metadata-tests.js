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

	it('should read id3v2.3.0', function(done) {
		var file = path.join(__dirname, 'files', 'test_id3v2.3.mp3');
		fs.readFile(file, function(err, buffer) {
			if (err) {
				done(err);
				return;
			}

			var metadata = metaDataReader.id3v2(buffer);
			should.exist(metadata);
			metadata.should.have.property('title', 'Foobar');
			metadata.should.have.property('artist', 'The Foobars');
			metadata.should.have.property('album', 'FUBAR');
			metadata.should.have.property('year', '2014');
			metadata.should.have.property('encoder', 'Lavf53.21.1');
			metadata.should.have.property('track', '9');
			done();
		});
	});

	it('should read id3v1', function(done) {
		var file = path.join(__dirname, 'files', 'test_id3v1.mp3');
		fs.readFile(file, function(err, buffer) {
			if (err) {
				done(err);
				return;
			}

			var metadata = metaDataReader.id3v1(buffer);
			should.exist(metadata);
			metadata.should.have.property('title', 'Foobar');
			metadata.should.have.property('artist', 'The Foobars');
			metadata.should.have.property('album', 'FUBAR');
			metadata.should.have.property('year', '2014');
			metadata.should.have.property('track', 9);
			metadata.should.have.property('genre', 255);
			metadata.should.have.property('comment', 'oh hai mark');
			done();
		});
	});

	it('should read id3v1 with 30-byte comment and no track', function(done) {
		var file = path.join(__dirname, 'files', 'test_id3v1_notrack.mp3');
		fs.readFile(file, function(err, buffer) {
			if (err) {
				done(err);
				return;
			}

			var metadata = metaDataReader.id3v1(buffer);
			should.exist(metadata);
			metadata.should.have.property('title', 'Foobar');
			metadata.should.have.property('artist', 'The Foobars');
			metadata.should.have.property('album', 'FUBAR');
			metadata.should.have.property('year', '2014');
			metadata.should.have.property('track', null);
			metadata.should.have.property('genre', 255);
			metadata.should.have.property('comment', 'this should be exactly 30 char');
			done();
		});
	});
});