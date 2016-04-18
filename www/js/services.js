angular.module('dslr.services', ['ngCordova', 'ionic', 'angular-jwt'])

.service('KeyframeService', function($q, $filter, $window){
    var keyframe = function(time, position, pan, tilt){
	this.time      = time;
	this.position  = position;
	this.panAngle  = pan;
	this.tiltAngle = tilt;
    };
    var storageKey  = 'KeyframeService-favorites';
    var keyframes   = [];
    var favorites   = [];
    var defaultFavorites = [
	{ 
	    name: 'Short Transitions', 
	    keyframes: [
		new keyframe(0, 0, 0, 0),
		new keyframe(5, 30, 60, 80),
		new keyframe(12, 60, 200, 0)		
	    ]
	},
	{
	    name: 'Single Transition',
	    keyframes: [
		new keyframe(0, 0, 0, 0),
		new keyframe(10, 60, 45, 45)
	    ]
	},
	{
	    name: 'Starter Incomplete',
	    keyframes: [
		new keyframe(0, 0, 0, 0)
	    ]
	}
    ];
    return {
	init: function(){
	    favorites = $window.localStorage[storageKey];
	    if(favorites === 'undefined' || 
	       typeof favorites == 'undefined'){  // nothing has been saved ever
		favorites = defaultFavorites; 
		this.saveFavorites();
	    } else {
		favorites = JSON.parse(favorites);
	    }
	},
	keyframe: function(time, pos, pan, tilt){
	    return new keyframe(time, pos, pan, tilt);
	},
	getFavorites: function(){
	    return favorites;
	},
	loadFavorite: function(favIndex){
	    this.clearFrames(); 
	    keyframes = favorites[favIndex].keyframes;
	},
	deleteFavorite: function(favIndex){
	    favorites.splice(favIndex, 1);
	    this.saveFavorites(favorites);
	},
	editFavorite: function(keyframe, kIndex, fIndex){
	    favorites[fIndex].keyframes[kIndex] = keyframe;
	    favorites[fIndex].keyframes = 
		$filter('orderBy')(favorites[fIndex].keyframes, 'time');
	},
	editKeyframes: function(keyframe, kIndex){
	    keyframes[kIndex] = keyframe;
	    keyframes = $filter('orderBy')(keyframes, 'time');
	},
	saveFavorites: function(){
	    $window.localStorage[storageKey] = JSON.stringify(favorites);
	},
	pushFavorite: function(name){
	    var fav = {
		keyframes: keyframes,
		name: name
	    };
	    favorites.push(fav);
	},
	addWholeSet: function(set){
	    favorites.push(set);
	},
	findDuration: function(favIndex){
	    var frames = [];
	    if(typeof favIndex === 'undefined'){ 
		frames = keyframes;
	    } else {
		frames = favorites[+favIndex].keyframes;
	    }
	    var len    = frames.length;
	    if(len === 0){
		return 0;
	    } else {
		return frames[len - 1].time - frames[0].time;
	    }	
	},
	clearFrames : function(){
	    keyframes = [];
	},
	removeFrame : function(index){ 
	    keyframes.splice(index, 1);
	},
	// checks to make sure that a newframe does not clash with another frame time
	uniqueTime : function(newFrame, skipIndex, favIndex){
	    var frames = [];
	    if(favIndex !== ''){
		frames = favorites[+favIndex].keyframes;
	    } else {
		frames = keyframes;
	    }
	    for(var i = 0; i < frames.length; i++){
		// skipindex is useful for editing
		if(skipIndex === '' || i !== +skipIndex){ 
		    var frame = frames[i];
		    if(frame.time === newFrame.time){
			return false;
		    }
		}
	    }
	    return true;
	},
	appendKeyframe : function(keyframe){
	    keyframes.push(keyframe);

	    keyframes = $filter('orderBy')(keyframes, 'time');
	},
	getKeyframes : function(){
	    return keyframes;
	},
	buildKeyframeBuffer: function(frames){
	    // build the JS string
	    var buffersize = 20; // nrf8001 buffer size is only 20 bytes :(

	    // helper for chunking large strings into strings of length *length*
	    // http://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript
	    var chunkString = function(str) {
		return str.match(new RegExp('.{1,' + buffersize + '}', 'g'));
	    };
	    var padZeros = function(item, totalLength){
		var newStr = '0'; 
		if(item === undefined){
		    alert('item is undefined, fix that template!');
		    item = '0';
		    newStr = '0';
		} else {
		    newStr = item.toString();
		}
		for(i = 0; i < (totalLength - item.toString().length); i++){
		    newStr = '0' + newStr;
		}
		return newStr;
	    }

	    frameStr = frames.length.toString() + "|";
	    frames.forEach(function(frame){
		frameStr += padZeros(frame.position, 3) + "|" + 
		    padZeros(frame.panAngle, 2)   + "|" + 
		    padZeros(frame.tiltAngle, 6)  + "|" + 
		    padZeros(frame.time, 6) + "|"; 
	    });

	    // now convert it to a buffer that the BLE interface can handle
	    // splitting up the string into individual keyframe buffers
	    var keyframeBuffers = [];
	    var frameChunks = chunkString(frameStr);
	    for(i = 0; i < frameChunks.length; i++){
		keyframeBuffers.push(new Uint8Array(frameChunks[i].length));
		for(j = 0; j < frameChunks[i].length; j++){
		    keyframeBuffers[i][j] = frameChunks[i].charCodeAt(j);
		}
	    }
	    
	    return keyframeBuffers; 
	},
    };
})

// Some helper functionality for debugging the app in general
.service('Debug', function() {
    var debug = true;
    var debugLog = '';
    return {
	setDebug : function(setting){
	    debug = setting;
	},
	toggleDebug : function(){
	    debug = !debug;
	},
	getDebug : function() {
	    return debug
	},
	getDebugLog : function() {
	    return debugLog;
	},
	appendLog : function(log) {
	    debugLog += log + '\n';
	},
	clearLog  : function(){
	    debugLog = '';
	}
    };
})

// Allows arbitrary controllers to perform bluetooth actions
.service('BluetoothService', function($ionicPopup, $q, $cordovaBLE, $ionicPlatform, $timeout){
    // initialized is for us to keep track of library state, not the bluetooth controller itself
    var initialized = false;
    var dslrMAC = '';     
    var rcvCarriageDebug = false; // sentinel to subscribe to carriage debug feed
    var debugLines = [];
    var device = {};
    var devices = [];
    var timeoutDuration = 2000; 
    // manufacturer provided UUIDs for BLE services
    var serviceIDs = {
	UART : "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
	TX   : "6E400002-B5A3-F393-E0A9-E50E24DCCA9E",
	RX   : "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"
    };
    return {
	getTimeout: function(){
	    return timeoutDuration;
	},
	setTimeout: function(newTimeout){
	    timeoutDuration = newTimeout
	},
	getInitialized: function(){// for bluetooth users to check
	    return initialized;
	},
	getPaired : function(){
	    if (device === {}){
		return false;
	    } else {
		return $cordovaBLE.isConnected(device.id, function(connected){
		    return connected;
		}, function(err){
		    alert(err); 
		});
	    }
	},
	setInitialized: function(initState){//for the ionicplatform.ready call to set
	    initialized = initState;
	},
	enabled: function(){
	    return $cordovaBlu.isEnabled(function(){
		return true;
	    }, function(){
		return false;
	    });
	},
	// either returns a list of the devices in object form or false (as in failure);
	discover: function() {
	    //macAddress needs to be changed to dslrMAC *AND* found dynamically
	    // IOS + WP do *not* support connecting to bluetooth devices with MAC or the discover unpaired function
	    // that will need to be accounted for when we get there
	    if(ionic.Platform.isAndroid() || ionic.Platform.isIOS()){
		devices = [];
		return $timeout(function(){
		         $cordovaBLE.startScan([], function(discoveredDevice){
			     devices.push(discoveredDevice);
			 }, function(err){
			     return []; 
			 });
		}, timeoutDuration).then($cordovaBLE.stopScan())
	    } else {
		alert('Platform not supported yet');
		return [];
	    }
	},
	getDevices: function() {
	    return devices;
	},
	// connection string is either a MAC address (Android or WP) or a uuid (ios)
	// either way the call is the same
	connect: function(chosenDevice) {
	    device = chosenDevice;
	    return $cordovaBLE.connect(device.id, function(){
		this.onConnect();
	    }, function(err) {		
		return false;
	    });
	},
	disconnect: function(){
	    rcvCarriageDebug = false;
	    initialized      = false;
	    debugLines       = [];
	    device           = {};
	    $cordovaBLE.disconnect(function(){ 
		return true; // successfully disconnected		
	    }, function() {
		return false;
	    });
	},
	onConnect: function() {
	    // subscriptions are only needed if the carriage starts sending messages back
	    if(rcvCarriageDebug){
		$cordovaBluetoothSerial.subscribe("\n", this.onMessage, this.subscribeFailed); 
	    }
	}, 
	// updates internal array of debug lines with new info whenever it is received
	onMessage: function(debugLine) {
            debugLines.push(debugLine);        
	},
	// just gets debug output for a controller 
	getDebugLines: function() {
	    var tempLines = debugLines;
	    debugLines = [];
	    return tempLines;
	},
        subscribeFailed: function() {
           // maybe this should just return a boolean that the caller handles
            $ionicPopup.alert({
		title: "Subscription Failure",
                template: "Unable to subscribe to debug output from carriage"
	    });
	},
        refreshDeviceList: function() {
            $cordovaBluetoothSerial.list(function(devices) {
		return devices;
	    }, function() { 
		return false;
	    });
        },
	sendMsg: function(msgBuffers){

	    var promise = Promise.resolve();
	    
	    
	    msgBuffers.forEach(function(msgBuffer){
		promise.then(function(){
		    $cordovaBLE.writeWithoutResponse(device.id, serviceIDs.UART, serviceIDs.TX, msgBuffer.buffer);
		});
	    });
	    return promise;
		
	}
    };
})

.service('BackendService', function($http, jwtHelper) {
    // if this is on a mobile device then it is in prod and needs the prod environment,
    // otherwise it can just use the localhost (port may need to be changed though)

    var username = '';
    var jwt      = null;

    var toBasicAuthentication = function(username, password){
	// btoa is provided natively
	return 'Basic ' + btoa(username + ':' + password);
    }

    // returns true if jwt is expired OR null
    var checkExp              = function(){	
	return jwt === null || jwtHelper.isTokenExpired(jwt);
    }

    var baseUrl = ionic.Platform.isAndroid() || ionic.Platform.isIOS() ? 
	"https://ancient-falls-78055.herokuapp.com" : "http://localhost:8080";

    return ({
	getLoggedIn : function()
	{	    
	    return !checkExp();
	}
	,
	getUsername : function()
	{
	    return username;
	}
	,
	logout : function(){
	    username = '';
	    jwt      = null;
	}
	,
	postApiUserNew: function(body)
	{
	    return $http(
		{ url: baseUrl + '/api/user/new'
		  , data: JSON.stringify(body)
		  , contentType: 'application/json'
		  , method: 'POST'
		}).then(function(resp){
		    username = body[0].username;
		    return resp;
		});
	}
	,
	loginUser : function(usernameField, passwordField){

	    return $http(
		{ url: baseUrl + '/api/user/login'
		  , method: 'GET'
		  , headers : {
		      'Authorization' : toBasicAuthentication(usernameField, passwordField)
		  }
		}
	    ).then(function(resp){
		jwt      = resp.data;
		username = usernameField;
		return resp;
	    });
	}
	,
	getApiAll: function()
	{
	    if(checkExp()){
		return null;
	    }
	    return $http(
		{ url: baseUrl + '/api/all'
		  , headers: { "token-auth": jwt }
		  , method: 'GET'
		});
	}
	,
	getApiSingleByFrameListID: function(frameListID)
	{
	    if(checkExp()){
		return null;
	    }
	    return $http(
		{ url: baseUrl + '/api/single/' + encodeURIComponent(frameListID) + ''
		  , headers: { "token-auth": jwt }
		  , method: 'GET'
		});
	}
	,
	postApiNew: function(body)
	{
	    if(checkExp()){
		return null;
	    }
	    return $http(
		{ url: baseUrl + '/api/new'
		  , data: JSON.stringify(body)
		  , contentType: 'application/json'
		  , headers: { "token-auth": jwt }
		  , method: 'POST'
		});
	}
    });


});
