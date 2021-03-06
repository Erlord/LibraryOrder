var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var player = models.player;
var library = models.library;

exports.init = init;

function init() {
	console.log('init');
	
	fillViewWithData($('#ArtistsList'), getArtistsFromAlbums(library.albums), true);
	addClickEventToList($('#ArtistsList'), onClickedArtist, 1);
	
	var albumsList = $('#AlbumsList');
	fillViewWithData(albumsList, library.albums, true);
	addClickEventToList(albumsList, onClickedAlbum, 1);
	addClickEventToList(albumsList, onDoubleClickedAlbum, 2);

	fillViewWithData($('#SongsList'), library.tracks, false);
	addClickEventToList($('#SongsList'), onDoubleClickedSong, 2);

	addSongChangedEvent();
}

function getArtistsFromAlbums (albums) {
	var artists = [];

	for (var i = albums.length - 1; i >= 0; i--) {
		artists.push(albums[i].artist);
	};

	return artists;
}

function fillViewWithData (view, data, sort) {
  var alreadyAddedList = [];
  var match = false;

  if (sort) {
  	data.sort();
  };

  for(var i=0; i<data.length; i++) {
		var name = data[i].name;
		console.log('Adding: ' + name + ' to view');

		match = false;

		for (var j = alreadyAddedList.length - 1; j >= 0; j--) {
			if (alreadyAddedList[j] === name) {
				match = true;
				console.log(name + ' already added');
				break;
			};
			
		};

		if (match === false) {
			view.append('<li>' + name + '</li>');
			alreadyAddedList.push(name);	
		};
	}
}

 function addClickEventToList (list, clickCallback, numberOfClicks) {
 	var click;

 	if (numberOfClicks === 1) {
 		click = 'click';
 	} else {
 		click = 'dblclick';
 	};

 	list.delegate('li', click, function () {
    	console.log(click + ' : '+ $(this).text());
    	clickCallback($(this).text().toString());
	});
}

function onClickedArtist (artist) {
	var albumsMatchingArtist = getAlbumsMatchingArtist(artist);
	showOnlyListElementsInList($("#AlbumsList li"), albumsMatchingArtist);

	var tracksMatchingArtist = getTracksMatchingArtist(artist);
	showOnlyListElementsInList($("#SongsList li"), tracksMatchingArtist);
}

function onDoubleClickedSong (song) {
	var libraryTrack = getMatchingFromLibrary(song, library.tracks);
	loadAlbum(libraryTrack.album, playAlbum, libraryTrack.number-1);
}

function onClickedAlbum (album) {
	var libraryAlbum = getMatchingFromLibrary(album, library.albums);
	loadAlbum(libraryAlbum, filterTracksByAlbum);
}

function onDoubleClickedAlbum (album) {
	var libraryAlbum = getMatchingFromLibrary(album, library.albums);
	loadAlbum(libraryAlbum, playAlbum);
}

function getMatchingFromLibrary (name, library) {
	for(var i=0; i<library.length; i++)	{
		if (library[i].name === name) {
			console.log('Adding match: ' + library[i].name);
			
			return library[i];
		};
	};	
}

function loadAlbum (album, callback, callbackArgs) {	
	models.Album.fromURI(album.uri, function (album) {
		console.log('album loaded from backend: ' + album.name);
		callback(album, callbackArgs);
	});
}

function playAlbum (album, startIndex) {
	console.log('Playing album: ' + album + ' startIndex: ' + startIndex);
	player.play(album.get(startIndex), album);
}

function filterTracksByAlbum (loadedAlbum) {
	showOnlyListElementsInList($("#SongsList li"), loadedAlbum.tracks);
}

function getAlbumsMatchingArtist(artist) {
	var albumsMatchingArtist = [];
	var allAlbums = library.albums;

	for(var i=0; i<allAlbums.length; i++)	{
		if (allAlbums[i].artist.name === artist) {
			console.log('Adding album match: ' + allAlbums[i].name);
			albumsMatchingArtist.push(allAlbums[i]);
		};
	};	

	return albumsMatchingArtist;
}

function getTracksMatchingArtist(artist) {
	var tracksMatchingArtist = [];
	var allTracks = library.tracks;
	var artists = [];

	for (var i = allTracks.length - 1; i >= 0; i--) {
		artists = allTracks[i].artists;
		for (var j = artists.length - 1; j >= 0; j--) {
			if(artists[j].name === artist) {
				console.log('Adding track match: ' + allTracks[i].name);
				tracksMatchingArtist.push(allTracks[i]);
			}
			break;
		};
	};

	return tracksMatchingArtist;
}

function showOnlyListElementsInList(listElements, list) {
	console.log('# list elements: ' + listElements.length + ' list match: ' + list.length);
	var match, liElement, liText, i;

	listElements.each(function(){
     	match = false;
     	liElement = $(this); 
     	liText = liElement.text();
		
		for (i = list.length - 1; i >= 0; i--) {
			if (liText === list[i].name) {
				console.log('Element match found: ' + liText);
				match = true;
				break;
			};
		};

		if(match) {
			liElement.show();
		} 
		else {
	    	liElement.hide();	 
		}
    });
}

function addSongChangedEvent () {
	player.observe(models.EVENT.CHANGE, function(event) {
		if (event.data.curtrack === true) {
			console.log('Track changed: ' + player.track.name);

			$('#SongsList li:visible.selected').each(function () {
				if ($(this).text() !== player.track.name) {
					$(this).removeClass('selected');
				};
			});

			markSongAsPlaying(player.track.name);
		};
	});
}

function markSongAsPlaying(song) {
	$("#SongsList li:visible").each(function () {
		if (song === $(this).text()) {
			$(this).addClass('selected');
			console.log('Selected class added to: ' + $(this).text());
		};
	});	
}