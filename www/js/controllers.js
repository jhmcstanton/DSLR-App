angular.module('dslr.controllers', ['dslr.services', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, 
				BluetoothService, BackendService, 
				$ionicPopup, Debug, $state) {
    var textarea = document.getElementById("logRegion");    

    $scope.debug    = false; 
    $scope.debugLog = Debug.getDebugLog();

    $scope.loggedIn = BackendService.getLoggedIn;
    $scope.username = BackendService.getUsername;
    $scope.logout   = BackendService.logout;


    $scope.loginForm = function(){
	$state.go('app.login');
    };

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
					 BluetoothService, $ionicLoading 
					 ){
    $scope.fav         = {
	name: ''
    };
   
    $scope.favoritesReady = function(){
	return $scope.keyframes().length > 0;
    };

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
	return $scope.keyframes().length >= 2 && $scope.paired();
    };

    $scope.disconnect = BluetoothService.disconnect;
    $scope.edit       = function(index){
	$ionicPopup.show({
	    title: 'Edit Keyframe',
	    scope: $scope,
	    template: 'What would you like to do with this keyframe?',
	    buttons: [
		{ text : 'Cancel' },
		{ 
		    text: 'Edit',
		    type: 'button-positive',
		    onTap: function(e){
			$state.go('app.single_keyframe', {
			    keyIndex: index
			});
		    }
		},
		{
		    text: 'Delete',
		    type: 'button-assertive',
		    onTap: function(e){
			KeyframeService.removeFrame(index);
		    }
		}
	    ]	    
	});	
    };
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

    $scope.saveToFavorites = function(){
	var namePopup = $ionicPopup.show({
	    templateUrl: 'templates/includes/single-field.html',
	    title: 'Enter Favorite Name',
	    scope: $scope,
	    buttons: [
		{ text: 'Cancel' },
		{ 
		    text: 'Save',
		    type: 'button-positive',
		    onTap: function(e){
			if($scope.fav.name === ''){
			    e.preventDefault();
			} else {
			    KeyframeService.pushFavorite($scope.fav.name);
			    KeyframeService.saveFavorites();
			}
		    }
		}
	    ]
	});
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

    $scope.totalDuration = 0;
    $scope.$watch(function(){
	return KeyframeService.findDuration();
    }, function(newDuration, _) {
	$scope.totalDuration = newDuration;
  });

})

.controller('AddKeyframeCtrl', function($scope, $stateParams, $state, 
					$ionicPopup, $stateParams,
					KeyframeService){
    if($stateParams.favIndex !== ''){
	$scope.newFrame = 
	    KeyframeService.getFavorites()[+$stateParams.favIndex][+$stateParams.keyIndex];
    } else if ($stateParams.keyIndex !== ''){
	$scope.newFrame = 
	    KeyframeService.getKeyframes()[+$stateParams.keyIndex];
    } else {
	$scope.newFrame = KeyframeService.keyframe('', '', '', '');
    }
    

    $scope.addKeyframe = function(){
	var parsedKeyframe = {};
	for(key in $scope.newFrame){
	    parsedKeyframe[key] = parseInt($scope.newFrame[key]);
	}
	
	if(!Number.isNaN(parsedKeyframe.time) &&
	   !Number.isNaN(parsedKeyframe.position) &&
	   !Number.isNaN(parsedKeyframe.panAngle) &&
	   !Number.isNaN(parsedKeyframe.tiltAngle)){

	    if(KeyframeService.uniqueTime(parsedKeyframe,
					  $stateParams.keyIndex,
					  $stateParams.favIndex)){
		// default case, just building a new set of keyframes
		if($stateParams.keyIndex === ''){ 
		    KeyframeService.appendKeyframe(parsedKeyframe);
		} else if($stateParams.favIndex === ''){ 
		    // editing the current keyframe set
		    KeyframeService.editKeyframes(
			parsedKeyframe,
			$stateParams.keyIndex
		    );
		} else { // editing a favorite
		    KeyframeService.editFavorite(
			parsedKeyframe,
			$stateParams.keyIndex,
			$stateParams.favIndex
		    );
		}
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

.controller('BluetoothDisplayCtrl', function($scope, BluetoothService, 
					     $ionicLoading, $state, 
					     $timeout, $ionicPopup){
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

.controller('FavoritesCtrl', function($scope, $state, 
				      KeyframeService, $ionicPopup,
				      BackendService){

    var showFavorites = [];
    var showKeyframes = [];
    var durations     = []

    $scope.favorites     = KeyframeService.getFavorites;

    $scope.getDuration   = function(index){
	return durations[index];
    };

    $scope.showKeyframes = function(index) {
	return showKeyframes[index];
    };
    $scope.showFav       = function(index){
	return showFavorites[index];
    };

    $scope.toggleShowFav = function(index) { 
	showFavorites[index] = !showFavorites[index];
    };
    $scope.toggleShowKeyframes = function(index){
	showKeyframes[index] = !showKeyframes[index];
    };
    
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

    $scope.getFavorites  = function() {
	// requires previous login
	BackendService.getApiAll().then(function(res){
	    for(i = 0; i < res.data.length; i++){
		KeyframeService.addWholeSet(res.data[i]);
	    } 
	});
    }

    $scope.edit = function(fIndex){
	return function(kIndex){
	    $state.go('app.single_keyframe', {
		keyIndex: kIndex,
		favIndex: fIndex
	    });
	};
    };

    $scope.$watch($scope.favorites, function(newFavs, _){
	for(var i = 0; i < newFavs.length; i++){
	    showFavorites[i] = false;
	    showKeyframes[i] = false;
	    durations[i]     = KeyframeService.findDuration(i);
	}
    });
})

.controller('LoginCtrl', function($scope, $ionicPopup, BackendService, $state){

    var validateForm = function(form){
	for(key in form){
	    if(typeof (form[key]) === 'object' && !validateForm(form[key])){
		return false;
	    }else if(typeof form[key] !== 'undefined' && form[key].length === 0){
		$ionicPopup.alert({
		    title : 'Malformed Form',
		    template : 'All fields are required!'
		});
		return false;
	    }    
	}
	return true;
    };

    // clear the form to get password and other info out of memory
    // absolutely not guaranteed to be safe. 
    var clearForm = function(form){	
	for(key in form){
	    if(typeof form[key] === 'object'){
		clearForm(form[key])
	    } else {
		form[key] = '';
	    }
	}
    };

    $scope.newUser = {
	userData : {
	    username : '',
	    email    : '',
	    firstName: '',
	    lastName : ''
	},
	password : ''
    };
    $scope.loginForm = {
	username: '',
	password: ''
    };

    $scope.login = function(){
	if(validateForm($scope.loginForm)){

	    BackendService.loginUser($scope.loginForm.username, 
				     $scope.loginForm.password)
	    .then(function(res){
		clearForm($scope.newUser);
		clearForm($scope.loginForm);
		$state.go('app.keyframes');
	    }, function(res){
		alert('failed to login user');
		for(k in res){
		    alert(k + ' : ' + res[k]);
		}
	    });
	}
    };

    $scope.signup = function(){
	// slight validation
	if(validateForm($scope.newUser)){
	    
	    BackendService.postApiUserNew([$scope.newUser.userData, $scope.newUser.password])
		.then(function(res){
		    clearForm($scope.newUser);
		    clearForm($scope.loginForm);
		    $state.go('app.keyframes');
		}, function(res){
		alert('failed to create user: ');
		for(k in res){
		    alert(k + ' : ' + res[k]);
		}
		});
	}
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
