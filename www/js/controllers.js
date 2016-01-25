angular.module('dslr.controllers', ['dslr.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, BluetoothService) {
    $scope.debugLog = '';
    $scope.debug    = false;
    
    var updateLog = function() {
	if($scope.debug){
	    BluetoothService.getDebugLines().forEach(function(line){
		$scope.debugLog += line + '\n';
	    });
	} else { // this should be pulled eventually
	    $scope.debugLog += 'Not debugging right now.\n';
	}
	textarea = document.getElementById("logRegion");
	textarea.style.height = textarea.scrollHeight + "px";
    }

    ionic.on('click', updateLog, document);
    ionic.on('swipeleft', updateLog, document);
})

.controller('KeyframeListCtrl', function($scope, $stateParams, $ionicPopup, $state, KeyframeService){
  $scope.keyframes = KeyframeService.getKeyframes();
  
  $scope.addKeyframe = function() {
      $state.go('app.single_keyframe');      
  };
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

	    KeyframeService.appendKeyframe(parsedKeyframe);
            $state.go('app.keyframes');
	}else {
	    $ionicPopup.alert({
		title: "Malformed Keyframe",
		template:  "All fields must be numeric"
	    });
	}     
    }; 
});
