# sketch-framer-3

## Getting Started #NOT

Run:

    rake

to build the `sketch-framer-cmd.js` file

After that, open a sample .sketch file in Sketch, and try running the script with:

    ./coscript sketch-framer-cmd.js

That should (in theory) export the current document. Problem is: it doesn't. **coscript is segfaulting**.

Any help is welcome :)


## TODO

- [x] hidden layers should remain hidden after export
- [x] hidden layers should have metadata visibility set to none
- [x] hide artboards others than the first
- [x] fix position for nested layers
- [x] fix position for layers with shadows
- [ ] fix random crashes
- [ ] backport Cemre's mask support
- [ ] Optimization: export all assets in the same sandbox operation?

## Template Format:

    {
    	"id": 3,
    	"name": "Background",
    	"layerFrame": {
    		"x": 0,
    		"y": 0,
    		"width": 320,
    		"height": 568
    	},
    	"maskFrame": null,
    	"image": {
    		"path": "images/Background.png",
    		"frame": {
    			"x": 0,
    			"y": 0,
    			"width": 320,
    			"height": 568
    		}
    	},
    	"imageType": "png",
    	"children": [

    	],
    	"modification": "1834086366"
    }
