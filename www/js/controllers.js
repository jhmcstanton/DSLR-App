angular.module('dslr.controllers', ['dslr.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, BluetoothService, $ionicPopup, Debug) {
    var textarea = document.getElementById("logRegion");

    $scope.debugLog = Debug.getDebugLog();
    
/*    if(ionic.Platform.isIOS() || ionic.Platform.isAndroid()){
	$scope.bluetoothEnabled = BluetoothService.enabled();
    }*/
    $scope.clearDebugLog = function(){
	Debug.clearLog();
	$scope.debugLog = Debug.getDebugLog();
	textarea.style.height = 0;
    };
    $scope.toggleBT = function(){
	alert('HERE!');
	for(func in BluetoothService){
	    alert(func + ': ' );
	}
	$scope.bluetoothEnabled = BluetoothService.enabled();
	alert($scope.bluetoothEnabled);
	alert('LAST');
    };
    $scope.toggleDebug = Debug.toggleDebug;
    
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

.controller('KeyframeListCtrl', function($scope, $q, $stateParams, $ionicPopup, $state, KeyframeService, Debug, BluetoothService){
    $scope.keyframes = []; //KeyframeService.getKeyframes();

    $scope.paired   = false;

    $scope.totalDuration = 0;
    
    $scope.ready = function(){
	return $scope.keyframes.length >= 2; // && $scope.paired && BluetoothService.enabled 
    };

    $scope.send = function(){ 
	if(Debug.getDebug()){
	    $ionicPopup.alert({
		title    : 'Frames Sent!',
		template : 'Buffer: ' + KeyframeService.buildKeyframeBuffer($scope.keyframes)
	    });
	}
    };
    $scope.pairCarriage = function(){
	alert('going to discover');
	try {
	    var devices = BluetoothService.discover();
	    alert('discovered');
	    alert('length' + devices.length);
	    for(device in devices){
		alert(device);
	    }
	} catch (err){
	    alert('caught : ' + err);
	}
    };
  
  $scope.addKeyframe = function() {
      $state.go('app.single_keyframe');      
  };

  $scope.$watch(function(){
      return KeyframeService.getKeyframes();
  }, function(newframes, _){
      $scope.keyframes = newframes;
  }); // these 2 watches might be easily combined

  // watch the length of the keyframes - first function is the watching function, second is the comparator
  $scope.$watch(function(){
      return $scope.keyframes.length;
  }, function(newLength, _) {
      if(newLength >= 2){ // minimum of 2 frames are required to transmit
	  $scope.totalDuration = $scope.keyframes[newLength - 1].time - $scope.keyframes[0].time;
      } else { 
	  $scope.totalDuration = 0;
      }
  });

})

.controller('AddKeyframeCtrl', function($scope, $stateParams, $state, $ionicPopup, KeyframeService){
    $scope.newFrame = {};
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
		KeyframeService.appendKeyframe(parsedKeyframe);
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
		template:  "All fields must be numeric"
	    });
	}     
    }; 
});
