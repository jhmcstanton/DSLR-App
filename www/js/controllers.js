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

.controller('KeyframeListCtrl', function($scope, $stateParams, $ionicPopup, $state, KeyframeService, Debug){
    $scope.keyframes = KeyframeService.getKeyframes();
    $scope.ready = false; 

    $scope.totalDuration = 0;
    
    $scope.send = function(){ 
	if(Debug.getDebug()){
	    $ionicPopup.alert({
		title    : 'Frames Sent!',
		template : 'Buffer: ' + KeyframeService.buildKeyframeBuffer($scope.keyframes)
	    });
	}
    };
  
  $scope.addKeyframe = function() {
      $state.go('app.single_keyframe');      
  };

  // watch the length of the keyframes - first function is the watching function, second is the comparator
  $scope.$watch(function(){
      return $scope.keyframes.length;
  }, function(newLength, _) {
      if(newLength >= 2){ // minimum of 2 frames are required to transmit
	  $scope.totalDuration = $scope.keyframes[newLength - 1].time - $scope.keyframes[0].time;
	  $scope.ready = true;
      } else { 
	  $scope.totalDuration = 0;
	  $scope.ready = false;
      }
  });

})

.controller('AddKeyframeCtrl', function($scope, $stateParams, $state, $ionicPopup, KeyframeService){
    $scope.newFrame = {};
    $scope.addKeyframe = function(){
	var parsedKeyframe = {};
	console.log('for loop');
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
