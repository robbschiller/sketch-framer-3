# sketch-framer-3

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
