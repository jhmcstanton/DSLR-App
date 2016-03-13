# TODO

1. ~~Reorder the keyframe fields before being sent so they match the Arduino expectations (high
priority)~~
1. Proper keyframe validation

   1. ~~All fields filled (not undefined, which is probably the current issue)~~
   1. ~~Sorted by time~~
   1. ~~Without *direct* time collisions~~
   1. Within acceptable parameters

1. GUI Updates and Cleanup

   - Cleanup

     1. ~~Remove Toggle BT from left pane that does nothing (or edit to do something)~~
       
        Now notifies user to check BT settings if no devices are found

     1. ~~Add dropdown views for individual keyframe info~~ 

     1. ~~Add dropdown views for individual device info~~

     1. Convert KeyframeList and ~~KeyframeAdd~~ controllers to use 
        keyframe constructor from keyframeservice. 

     1. Possibly convert localStorage use to sqlite if problems occur.

   - Updates
     1. Add ~~editing~~ / ~~deleting~~ of existing keyframes
        
	Should favorites be directly editable?

     1. ~~Add preloaded keyframes~~

     1. ~~Allow users to save keyframes to favorites~~

     1. Add a track view for adding keyframes (v 2)

1. Add logging (low priority)

   1. Internal app logging
   1. Logging from Arduino (requires changes to Arduino)