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
	buildKeyframeBuffer: function(frames){
	    buffer = frames.length.toString() + "|";
	    frames.forEach(function(frame){
		buffer += frame.time + "|" + 
		    frame.position   + "|" + 
		    frame.panAngle   + "|" + 
		    frame.titlAngle  + "|"; 
	    });
	    return buffer; 
	},
    };
});
