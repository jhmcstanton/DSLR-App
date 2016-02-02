angular.module('dslr.services', ['ngCordova'])

.service('KeyframeService', function($q, $filter){
    var keyframes   = [];
    return {
	// checks to make sure that a newframe does not clash with another frame time
	uniqueTime : function(newFrame){
	    for(frame in keyframes){
		if(frame.time === newFrame.time){
		    return false;
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
	    buffer = frames.length.toString() + "|";
	    frames.forEach(function(frame){
		buffer += frame.time + "|" + 
		    frame.position   + "|" + 
		    frame.panAngle   + "|" + 
		    frame.tiltAngle  + "|"; 
	    });
	    return buffer; 
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
.service('BluetoothService', function($ionicPopup, $cordovaBluetoothSerial, $ionicPlatform){
//    var bluetoothSerial = ngCordova.plugins.bluetoothSerial;
    // initialized is for us to keep track of library state, not the bluetooth controller itself
    var initialized = false;
    var dslrMAC = '';     
    var rcvCarriageDebug = false; // sentinel to subscribe to carriage debug feed
    var debugLines = [];
    var paired = false; 
    return {
	getInitialized: function(){// for bluetooth users to check
	    return initialized;
	},
	setInitialized: function(initState){//for the ionicplatform.ready call to set
	    initialized = initState;
	},
	enabled: function(){
	    return $cordovaBluetoothSerial.isEnabled(function(){
		return true;
	    }, function(){
		return false;
	    });
	},
	initialize: function(rcvDebug) {
	    if (!initialized){
		if (!$cordovaBluetoothSerial.isEnabled){ 
		    $cordovaBluetoothSerial.enable(function(){
			//success callback
			document.addEventListener('deviceready', function(){
			    initialized = true;
			}, false);
			rcvCarriageDebug = rcvDebug;
			return true; 
		    }, function(){ //failure callback
			return false;
		    }
		    );
		}
	    }
	},
	// either returns a list of the devices in object form or false (as in failure);
	discover: function() {
	    //macAddress needs to be changed to dslrMAC *AND* found dynamically
	    // IOS + WP do *not* support connecting to bluetooth devices with MAC or the discover unpaired function
	    // that will need to be accounted for when we get there
	    if(ionic.Platform.isAndroid()){
		return $cordovaBluetoothSerial.discoverUnpaired(function(devices){
			alert('success');
			return devices;
		    }, function(_){
			alert('fail');
			return false; 
		    });	   
	    } else {
		alert('Platform not supported yet');
		return [];
	    }
	},
	// connection string is either a MAC address (Android or WP) or a uuid (ios)
	// either way the call is the same
	connect: function(connectionString) {
	    $cordovaBluetoothSerial.connect(connectionString, function(){
		paired = true; 
		this.onConnect();
		return true; // successful connection
	    }, function() {
		return false;
	    });			   
	},
	disconnect: function(){
	    rcvCarriageDebug = false;
	    initialized      = false;
	    paired           = false; 
	    debugLines       = [];
	    $cordovaBluetoothSerial.disconnect(function(){ 
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
	sendMsg: function(msg){
	    $cordovaBluetoothSerial.write(msg, function() {
		return true;
	    }, function() {
		return false;
	    });
	}
    };
});
