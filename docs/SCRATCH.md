## Feature request/bug reports/tweaks to make:
* The arrows and markers are not looking cohesive. The arrow looks disconnected from the line. It should be a line with arrow at the end.
* Most imported and most exported panels are janky. They are showing a scroll wheel inside it and only a couple lines instead of using all the veritcal room they have. Also I want the rows of imports to be shown as a striped table for easy visuals.
* Graph rendering log:  console.log(`Graph rendering completed in ${renderTime.toFixed(2)}ms with ${tickCount} ticks`); doesnt seem to be resetting properly - it just keeps growing over time
* multi-select mode is weird: the purple modal flashes when shift key is held down. Also there is no visual indicator on the nodes that its being selected. Lets be really clear that the first click is selecting the target and the additional selects are the things we want to understand the interfaces of with respect to the target.
* Need to get rid of the legacy graph handling code
* Add eslint, prettier, typescript, vite