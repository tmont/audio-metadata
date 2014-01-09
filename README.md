# audio-metadata
This is a tiny (1.9K gzipped) little library to extract metadata from audio files.
Specifically, it can extract [ID3v1](http://en.wikipedia.org/wiki/ID3#ID3v1),
[ID3v2](http://en.wikipedia.org/wiki/ID3#ID3v2) and
[Xiph comments](http://www.xiph.org/vorbis/doc/v-comment.html)
(i.e. metadata in [OGG containers](http://en.wikipedia.org/wiki/Ogg)).

## What is this good for?
The purpose of this library is to be very fast and small. It's suitable
for server-side or client-side. Really any platform that supports
`ArrayBuffer` and its ilk (`Uint8Array`, etc.).

I wrote it because the other libraries were large and very robust; I just
needed something that could extract the metadata out without requiring
30KB of JavaScript. `audio-metadata.min.js` comes in at 5.5K/1.9K
minified/gzipped.

To accomplish the small size and speed, it sacrifices several things.

1. It's very naive. For example, the OGG format stipulates that the comment
   header must come second, after the identification header. This library
   assumes that's always true and completely ignores the identification header.
2. Text encoding is for losers. ID3v2 in particular has a lot of flexibility in
   terms of the encoding of text for ID3 frames. This library will handle UTF8
   properly, but everything else is just spit out as ASCII.
3. It assumes that ID3v2 tags are always the very first thing in the file (as they
   should be). The spec is mum on whether that's ''required'', but this library
   assumes it is.
4. ID3v1.1 (extended tags with "TAG+") are not supported, Wikipedia suggests they
   aren't really well-supported in media players anyway.

## Usage
The library operates solely on `ArrayBuffer`s, or `Buffer`s for Node's convenience.
So you'll need to preload your audio data before using this library.

The library defines three methods:

```javascript
// extract comments from OGG container
AudioMetaData.ogg(buffer)

// extract ID3v2 tags
AudioMetaData.id3v2(buffer);

// extract ID3v1 tags
AudioMetaData.id3v1(buffer);
```

### Node
Install it using NPM: `npm install audio-metadata`

```javascript
var audioMetaData = require('audio-metadata'),
	fs = require('fs');

var oggData = fs.readFileSync('/path/to/my.ogg');
var metadata = audioMetaData.ogg(oggData);
/*
{
  "title": "Contra Base Snippet",
  "artist": "Konami",
  "album": "Bill and Lance's Excellent Adventure",
  "year": "1988",
  "tracknumber": "1",
  "encoder": "Lavf53.21.1"
}
*/
```

### Browser
This library has been tested on current versions of Firefox and Chrome. IE
might work, since it apparently supports `ArrayBuffer`. Safari/Opera are
probably okayish since they're webkit. Your mileage may vary.

Loading `audio-metadata.min.js` will define the `AudioMetadata` global variable.

```html
<script type="text/javascript" src="audio-metadata.min.js"></script>
<script type="text/javascript">
	var req = new XMLHttpRequest();
	req.open('GET', 'http://example.com/sofine.mp3', true);
	req.responseType = 'arraybuffer';

	req.onload = function() {
		var metadata = AudioMetaData.id3v2(req.response);
		/*
		{
			"title": "Contra",
			"artist": "Bill & Ted",
			"album": "Konami",
			"year": "2000",
			"track": "2",
			"encoder": "Lavf53.21.1"
		}
		*/
	};

	req.send(null);
</script>
```

## Development
```bash
git clone git@github.com:tmont/audio-metadata.js
cd audio-metadata
npm install
npm test
```

There's a "test" (yeah, yeah) for browsers, which you can view
by running `npm start` and then pointing your browser at
[http://localhost:24578/tests/browser/](http://localhost:24578/tests/browser/).
