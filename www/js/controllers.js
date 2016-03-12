angular.module('dslr.controllers', ['dslr.services', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, BluetoothService, $ionicPopup, Debug) {
    var textarea = document.getElementById("logRegion");

    $scope.debug    = false; 
    $scope.debugLog = Debug.getDebugLog();

    $scope.clearDebugLog = function(){
	Debug.clearLog();
	$scope.debugLog = Debug.getDebugLog();
	textarea.style.height = 0;
    };
    $scope.toggleBT = function(){
	alert('HERE!');
	$scope.bluetoothEnabled = BluetoothService.enabled();
	alert($scope.bluetoothEnabled);
	alert('LAST');
    };
    $scope.toggleDebug = function() {
	Debug.toggleDebug();	
	$scope.debug = Debug.getDebug();
    };
    
    var updateLog = function() {
	if(Debug.getDebug()){
	    BluetoothService.getDebugLines().forEach(function(line){
		Debug.appendLog(line);
	    });
	    $scope.debugLog = Debug.getDebugLog();
	} else { // this should be pulled eventually
	    $scope.debugLog += 'Not debugging right now.\n';
	}
	textarea.style.height = textarea.scrollHeight + "px";
    };

    ionic.on('click', updateLog, document);
    ionic.on('swipeleft', updateLog, document);
})

.controller('KeyframeListCtrl', function($scope, $q, $stateParams, $ionicPopup, 
					 $state, KeyframeService, Debug, 
					 BluetoothService, $ionicLoading, $timeout, $interval){
    $scope.keyframes   = KeyframeService.getKeyframes;
    $scope.showFrames  = [];
    $scope.clearFrames = KeyframeService.clearFrames;

    $scope.paired         = BluetoothService.getPaired;
    $scope.loadingDevices = false;
    $scope.loadingTitle   = "Finding Devices...";

    $scope.totalDuration = 0;
    $scope.sending = false;
    
    $scope.toggleShow = function(index){
	$scope.showFrames[index] = !$scope.showFrames[index];
    };
    $scope.getShow    = function(index){
	return $scope.showFrames[index];
    };
    $scope.ready      = function(){
	return $scope.keyframes().length >= 2 && $scope.paired(); // && BluetoothService.enabled 
    };

    $scope.disconnect = BluetoothService.disconnect;
    $scope.remove     = function(keyframe){
	$ionicPopup.confirm({
	    title : 'Confirm Delete',
	    template : 'Do you want to delete this keyframe?'
	}).then(function(confirmation){
	    if(confirmation){
		KeyframeService.removeFrame(keyframe);
	    }
	});
    }

    $scope.send = function(){ 
	$scope.sending = true;
	try {
	var frameBuffers = KeyframeService.buildKeyframeBuffer($scope.keyframes());	    
	    
	BluetoothService.sendMsg(frameBuffers).then(function(){
	    $scope.sending = false;
	    if(Debug.getDebug()){
/*		$ionicPopup.alert({
		    title    : 'Frames Sent!',
		    template : 'Buffer length: ' + frameBuffer.length + '</br>Buffer: ' + frameBuffer
		});*/
	}	
	});
	} catch(err){
	    alert(err);
	}
    };
    $scope.pairCarriage = function(){
	$scope.loadingDevices = true;
	BluetoothService.discover().then(function(devices){
	    $scope.loadingDevices = false;
	});
    };
  
    $scope.addKeyframe = function() {
      $state.go('app.single_keyframe');      
    };

    $scope.toFavorites = function(){
	$state.go('app.favorites');
    };

    $scope.$watch($scope.keyframes, function(newframes, _){
	$scope.showFrames = [];
	// reset all frames to be hidden 
	for(var i = 0; i < newframes.length; i++){
	    $scope.showFrames[i] = false;
	}
    });
    
  // handle popup for sneding keyframe buffer (may not appear if transfer is fast)
  $scope.$watch(function(){
      return $scope.sending;
  }, function(newSending, oldSending){
      if(newSending){
	  $scope.loadingTitle = "Sending Keyframe Buffer..";
	  $ionicLoading.show({
	      scope: $scope,
	      templateUrl: "templates/loading.html"
	  });
      } else {
	  $ionicLoading.hide();
      }
  });

  $scope.$watch(function(){
      return BluetoothService.getInitialized()
  }, function(newInit, _){
      $scope.bluetoothInitialized = newInit;
  });

  $scope.$watch(function(){
      return $scope.loadingDevices;
  }, function(newLoadingDevices, oldLoadingDevices){
      if(newLoadingDevices){ // loading device list right now
	  $scope.loadingTitle = "Finding Devices..";
	  $ionicLoading.show({
	      scope: $scope,
	      templateUrl: "templates/loading.html"
	  });
      } else if (newLoadingDevices !== oldLoadingDevices) {
	  $ionicLoading.hide(); // done loading
	  $state.go('app.choose_device');  
      }
  });

  // watch the length of the keyframes - first function is the watching function, second is the comparator
  $scope.$watch(function(){
      return $scope.keyframes().length;
  }, function(newLength, _) {
      if(newLength >= 2){ // minimum of 2 frames are required to transmit
	  $scope.totalDuration = $scope.keyframes()[newLength - 1].time - $scope.keyframes()[0].time;
      } else { 
	  $scope.totalDuration = 0;
      }
  });

})

.controller('AddKeyframeCtrl', function($scope, $stateParams, $state, $ionicPopup, KeyframeService){
    $scope.newFrame           = {};
    $scope.newFrame.time      = "";
    $scope.newFrame.position  = "";
    $scope.newFrame.panAngle  = "";
    $scope.newFrame.tiltAngle = "";
    $scope.addKeyframe = function(){
	var parsedKeyframe = {};
	for(key in $scope.newFrame){
	    parsedKeyframe[key] = Number.parseInt($scope.newFrame[key]);
	}
	
	if(!Number.isNaN(parsedKeyframe.time) &&
	   !Number.isNaN(parsedKeyframe.position) &&
	   !Number.isNaN(parsedKeyframe.panAngle) &&
	   !Number.isNaN(parsedKeyframe.tiltAngle)){

	    if(KeyframeService.uniqueTime(parsedKeyframe)){		
		KeyframeService.appendKeyframe(parsedKeyframe, 10);
		$scope.newFrame = {};
		$state.go('app.keyframes');
	    } else {
		$ionicPopup.alert({
		    title : 'Malformed Keyframe!',
		    template : 'This frame time clashes with another'
		});
	    }
	}else {
	    $ionicPopup.alert({
		title: "Malformed Keyframe",
		template:  "All fields must be filled."
	    });
	}     
    }; 
})

.controller('BluetoothDisplayCtrl', function($scope, BluetoothService, $ionicLoading, $state, $timeout, $ionicPopup){
    $scope.devices      = BluetoothService.getDevices;
    $scope.showDevices  = [];
        
    for(var i = 0; i < $scope.devices().length; i++){
	$scope.showDevices[i] = false;
    }

    $scope.toggleShow = function(index){
	$scope.showDevices[index] = !$scope.showDevices[index];
    };
    $scope.getShow    = function(index){
	return $scope.showDevices[index];
    };

    $scope.connecting   = false;
    $scope.loadingTitle = "Connecting to Device..."


    $scope.connect = function(device){
	$scope.connecting = true;
	BluetoothService.connect(device).
	    then(function(){
		$scope.connecting = false;
		if(!BluetoothService.getPaired()){
		    $ionicPopup.alert({
			title: "Bluetooth Connection Error!",
			template: "Unable to connect to DSLR Carriage"
		    });
		}
	    });

    };

    // return back to the keyframe screen if no devices are found!
    $scope.$watch(function(){
	return $scope.devices().length;
    }, function(newLen, _){
	if(newLen == 0){
	    $ionicPopup.alert({
		title: "No Devices Found!",
		template: "Try checking your Bluetooth settings and that the PB&J Camera Dolly System is powered on."
	    });
	}
    });
    $scope.$watch(function(){
	return $scope.connecting;
    }, function(newConnecting, oldConnecting){
	if(newConnecting){
	    $ionicLoading.show({
		scope: $scope,
		templateUrl: "templates/loading.html"
	    });
	} else {
	    $ionicLoading.hide(); 
	    if (newConnecting !== oldConnecting){  
	    // this if statement ensures that this view doesn't automatically redirect when $scope.connecting 
	    // is first set on the view load above
		$state.go('app.keyframes');	    
	    }
	}
    });
})

.controller('FavoritesCtrl', function($scope, $state, KeyframeService,
				      $ionicPopup){

    $scope.favorites = KeyframeService.getFavorites;
    $scope.getShow   = function() { return true; };
    $scope.toggleShow = function() { };
    
    $scope.loadFavorite = function(index){
	KeyframeService.loadFavorite(index);
	$state.go('app.keyframes');
    };

    $scope.deleteFavorite = function(index){
	$ionicPopup.confirm({
	    title : 'Confirm Delete',
	    template : 'Do you really want to delete ' + $scope.favorites()[index].name + '?'
	}).then(function(confirmation){
	    if(confirmation){
		KeyframeService.deleteFavorite(index);
	    }
	});
    };

    $scope.edit = function($index){
	alert('Add this!');
    };
})

.directive('dslrKeyframes', function() {
    return {
	scope: {
	    keyframes: "=keyframes",
	    hold     : "=hold",
	    touch    : "=touch",
	    show     : "=show"
	},
	templateUrl: 'templates/includes/keyframes.html',
    };
});
