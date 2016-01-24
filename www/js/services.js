angular.module('dslr.services', [])

.service('KeyframeService', function($scope, $q, $ionicPopup){
    var newKeyframe = {}
    return {
	getKeyframe : function() {
/*	    if (newKeyframe === {}){ // if the keyframe is not assigned for some reason
		$ionicPopup.alert({
		    title: 'Error!',
		    summary: 'keyFrame variable is not assigned'
		});
	    } else {*/
		return newKeyFrame;
//	    }
	},
	appendKeyframe : function(keyframe){
	    newKeyframe = keyframe;
	},
    };
});
