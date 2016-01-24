angular.module('dslr.services', [])

.service('KeyframeService', function($q){
    var keyframes   = [];
    return {
	appendKeyframe : function(keyframe){
	    keyframes.push(keyframe);
	},
	getKeyframes : function(){
	    return keyframes;
	},
    };
});
