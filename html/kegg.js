// <img src="http://www.kegg.jp/kegg/pathway/pti/pti00630.png"/>
// http://rest.kegg.jp/get/pti00630/kgml


//http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
if (!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}


//<area shape=rect	coords=1126,440,1172,457	href="/dbget-bin/www_bget?pti:PHATRDRAFT_51088"	title="PHATRDRAFT_51088" />
//
//    <entry id="82" name="pti:PHATRDRAFT_51088" type="gene" reaction="rn:R00479"
//        link="http://www.kegg.jp/dbget-bin/www_bget?pti:PHATRDRAFT_51088">
//        <graphics name="PHATRDRAFT_51088" fgcolor="#000000" bgcolor="#BFFFBF"
//             type="rectangle" x="1149" y="449" width="46" height="17"/>
//    </entry>

// for rectangles, the position is defined by x = x="359" - (width="46" /2) y = y="510" - ( height="17" / 2 )


function add_if_dos_not_exists(obj, key, val) {
	if (!(key in obj)) { obj[key] = [ val ]; } else { if (obj[key].indexOf(val) == -1) { obj[key].push( val ) } }
}


var kgml_to_svg = function kgml_to_svg(kgml, c_id, clbk) {
	this.kgml        = kgml;
	this.c_id        = c_id;
	this.tagNames    = {"rect": 1, "circle": 1};
	var fill_opacity = '0.0';
	
	var img_src_s    = kgml.indexOf('image=');
	var img_src_e    = kgml.indexOf('"', img_src_s+7);
	var img_src      = kgml.substring(img_src_s+7, img_src_e);
	
	var ld           = this;
	var img          = new Image();
	img.src          = img_src;
	img.onload = function(){
		ld.width  = img.width;
		ld.height = img.height;
		
		console.log("loaded img", ld.width, ld.height);

		ld.svg     = kgml;
		
		console.log('width', ld.width, 'height', ld.height);
		
		ld.svg = ld.svg
			.replace(/\s*<\?xml[\s|\S]+?\n/g                       ,''  ) //delete xml
			.replace(/<!DOCTYPE[\s|\S]+?>\n/g                      ,''  ) //delete doctype
			.replace(/"\n +/g                                      ,'" ') //delete multilines
			.replace(/ +/g                                         ,' ' ) //delete multiple spaces
			.replace(/\s*<relation[\s|\S]+?<\/relation>\n/g        ,''  ) //delete relation tag
			.replace(/\s*<reaction[\s|\S]+?<\/reaction>\n/g        ,''  ) //delete reaction tag
			.replace(/\s*<substrate[\s|\S]+?\/>\n/g                ,''  ) //delete substrate tag
			.replace(/\s*<product[\s|\S]+?\/>\n/g                  ,''  ) //delete product tag
			.replace(/\s*<subtype[\s|\S]+?\/>\n/g                  ,''  ) //delete subtype tag
			.replace(/<\/pathway[\s|\S]+?>\n?/                     ,''  ) //delete closure of pathwat tag
			
			.replace(/<entry([\S|\s]+?)link="(\S+?)"/g             ,'\t<a$1xlink:href="$2"') //convert entry tag into a tag and link attribute into xlink:href attribute
			.replace(/<\/entry>/g                                  ,'\t</a>'               ) //convert closure of entry tag into closure of a tag

			//convert pathway into image
			.replace(/<pathway([\S|\s]+?)image="(\S+)"([\S|\s]+?)>/gm,'\t<image x="0" y="0" render-order="1" filter="url(#matrix-black)" width="'+ld.width+'px" height="'+ld.height+'px" $1xlink:href="$2"$3></image>')
			
			//convert graphics into rect|circle depending on its type attribute
			//converts coordinate system from center to top-left
			//converts coordinate from diameter to radius
			//converts roundrectangle to rectangle with radius 10
			.replace(/<graphics([\S|\s]+?)bgcolor="(\S+?)"([\S|\s]+?)type="(\S+)" x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"([\S|\s]+?)>/gm     , 
				function(       $all, $begin, $fill, $between, $type, $x, $y, $w, $h, $end) { 
					//console.log($all, $begin, $fill, $between, $type, $x, $y, $w, $h, $end); 
					//$fill = '#333';
					if ($type == 'rectangle') {
						return String.format('\t\t<rect   {0} fill="{1}" {2}  x="{3}"  y="{4}" width="{5}" height="{6}"          fill-opacity="'+fill_opacity+'"{7}>', $begin, $fill, $between, ($x-($w/2)), ($y-($h/2)), $w, $h, $end);
					} else 
					if ($type == 'roundrectangle'){
						return String.format('\t\t<rect   {0} fill="{1}" {2}  x="{3}"  y="{4}" width="{5}" height="{6}" rx="10"  fill-opacity="'+fill_opacity+'"{7}>', $begin, $fill, $between, ($x-($w/2)), ($y-($h/2)), $w, $h, $end);
					} else 
					if ($type == 'circle'){
						return String.format('\t\t<circle {0} fill="{1}" {2} cx="{3}" cy="{4}" r="{5}"                           fill-opacity="'+fill_opacity+'"{7}>', $begin, $fill, $between, $x,           $y,         ($w/2), $h, $end);
					}
				}
			)
			//duplicate image for background and inverted image foregound
			//create groups for links (top), labels(middle), areas (colors, bottom) and image (background)
			.replace(/(<image[\S|\s]+?)(><\/image>)/gm             , 
				function($all, $beg, $end) {
					return String.format(
						'\n'+
						'<g id="image">\n{0}{1}</g>\n'+
						'<g id="areas"></g>\n'+
						'<g id="labels" filter="url(#matrix-invert)">'+
							'{0}filter="url(#matrix-black)" mask="url(#name_inverter)"{1}'+
						'</g>\n'+
						'<g id="links"></g>\n'+
						'<g id="alls">'+
						'\n'
						, $beg, $end);
				}
		);
		

		//add filters to convert green into white and the background into transparency 
		//http://docs.webplatform.org/wiki/svg/elements/feColorMatrix
		var filters = 	'\t<defs id="svg_defs">\n'+
						'\t\t<filter id="matrix-black">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="matrix" values="1  1  0  0 0\n' +
						'\t\t\t														   0  1  0  0 0\n' +
						'\t\t\t														   0  1  1  0 0\n' +
						'\t\t\t														   0  0  0  0 1"/>\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="matrix" values="0  0  0  0 0\n' +
						'\t\t\t														   0  0  0  0 0\n' +
						'\t\t\t														   0  0  0  0 0\n' +
						'\t\t\t														   -1  -1  -1  1 0"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="saturate">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="saturate" values=".5" result="A"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="hueRotate">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="hueRotate" values="45" result="A"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="L2A">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="A"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="grayscale">\n' +
						'\t\t\t<feColorMatrix type="saturate" values="0"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="matrix-greyscale">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="matrix" values=".33 .33 .33 0 0 \n' +
						'\t\t												  		   .33 .33 .33 0 0 \n' +
						'\t\t	 													   .33 .33 .33 0 0\n' +
						'\t\t														   0 0 0 1 0"/>\n' +
						'\t\t</filter>\n' +
						'\t\t<filter id="matrix-invert">\n' +
						'\t\t\t<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 \n' +
						'\t\t                                                           0 -1 0 0 1 \n' +
						'\t\t                                                           0 0 -1 0 1\n' +
						'\t\t                                                           0 0 0 1 0"/>\n' +
						'\t\t</filter>\n'+
						'\t\t<mask id="name_inverter">\n' +
						'\t\t\t<rect fgcolor="#fff" fill="#fff" x="937.5" y="215" width="73" height="34" rx="10" fill-opacity="0.5"></rect>\n' +
						'\t\t</mask>\n'+
						'\t</defs>\n'
						;
						 //filter="url(#matrix-invert)"
			
		//add SVG header and filters
		//close the group tag
		ld.svg = '<svg id="kegg_svg" viewbox="0 0 '+ld.width+' '+ld.height+'" width="'+ld.width+'px" height="'+ld.height+'px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' + 
				filters +
				ld.svg + 
				"</g>\n</svg>"

		//console.log(ld.svg);

		//add to container
		document.getElementById(ld.c_id).innerHTML = ld.svg;
		ld.svgEl    = document.getElementById('kegg_svg'); //svg
		ld.linksEl  = document.getElementById('links');    //links
		ld.labelsEl = document.getElementById('labels');   //labels
		ld.areasEl  = document.getElementById('areas');    //areas (color)
		ld.imageEl  = document.getElementById('image');    //image (background)
		ld.allsEl   = document.getElementById('alls');     //leftover group tag
		
		ld.masker();  //reorder objects
		ld.indexer(); //index areas (colors)
		try {
			clbk(); //call callback
		}
		catch(e){
		}
	}
}


kgml_to_svg.prototype.masker = function() {
	console.log('masker');

	//get inverter mask object
	this.mask = document.getElementById('name_inverter');
	
	//get all links
	var as = this.allsEl.getElementsByTagName('a');

	//move links to group links and areas to group areas
	//console.log(' as', as.length, as);
	for ( var a = as.length-1; a >=0 ; a-- ) {
		var al   = as[a];
		var alid = al.getAttribute('id');
		//change id so that the id can be set in the area
		al.setAttribute('id', alid+'_label');

		//get respective area
		//console.log(' al', a, al);
		var children = al.childNodes;
		//console.log('  child', children.length, children);
		
		//transfer area to group areas
		for ( var c = children.length-1; c >=0 ; c-- ) {
			var cel = children[c];
			//console.log('   cel', c, cel);
			if (cel.tagName in this.tagNames ) {
				//set area id
				cel.setAttribute('id', alid);

				//clone area and add to link so that link is clickable
				var cl = cel.cloneNode(true);
				cl.removeAttribute("id");
				//append clone of area into link
				al.appendChild(cl);
			}
			//move area to group areas
			this.areasEl.appendChild(cel);
		}
		
		//move link+areaClone to links group
		this.linksEl.appendChild(al);
	}
}


kgml_to_svg.prototype.indexer = function() {
	//index all ids for easy color change
	console.log('indexing');
	
	var names = {}; //all ids and their names
	//extract ids and names from fields
	this.svg.replace(/id="([\S|\s]+?)"[\S|\s]+?name="([\S|\s]+?)"/g, 
		function($all, $id, $name){
			//console.log("id", $id, "name", $name);
			
			//add full name to names under the id
			add_if_dos_not_exists(names, $name, $id);
			
			//split if there are spaces
			var parts = $name.split(/\s/);
			//console.log(" parts", parts);
			for ( var p in parts ) {
				var part = parts[p];
				//console.log("  part", part);
				
				//add name part to names under the id
				add_if_dos_not_exists(names, part, $id);
				
				//split if there are colons
				var segs = part.split(":");
				//console.log("   segs", segs);
				if (segs.length == 1) {
					var seg = segs[0];
					//console.log("    seg1", seg);
					
					//add name without colon under the id
					add_if_dos_not_exists(names, seg, $id);
					
				} else 
				if (segs.length == 2) {
					var sty = segs[0];
					var seg = segs[1];
					//console.log("    seg2", "type:", sty, "val:", seg);
					
					//add name without colon under the id
					add_if_dos_not_exists(names, seg, $id);
				}
			}
		}
	);
	console.log("names", names);
	this.index = names;
}


kgml_to_svg.prototype.highlight = function(code, color, fill_opacity) {
	console.log('highlight','code:',code, 'color:',color, 'fill_opacity:"', fill_opacity);

	//if code in index, proceed
	if (code in this.index) {
		console.log(' EXISTS');
		var els = this.index[code];//ids containing the code
		console.log('  els',els);
		
		//for each element
		for ( var e in els ) {
			var el      = els[e];
			var nel     = document.getElementById(el);
			var tagName = nel.tagName;
			console.log('    el', el, nel, tagName);
			
			//verify if tag name is correct and change color and opacity
			if (tagName in this.tagNames) {
				nel.setAttribute('fill'        , color       );
				nel.setAttribute('fill-opacity', fill_opacity);

			} else {
				console.warn('TAG', tagName, 'NOT ALLOWED', this.tagNames);
			}
		}
		
	} else {
		console.log('highlight',code,"DOES NO EXISTS");
	}
}


















//http://gamedev.stackexchange.com/questions/19257/how-do-i-make-magenta-in-my-png-transparent-in-html5-canvas-js
// color to make transparent. Magenta here...
function make_transparency(r,g,b,file,src,dst) {
	var transparentColor = {
		r : r,
		g : g,
		b : b
	};

	var img = new Image();
	img.src = file;
	img.onload = function(){
		// create a source canvas. This is our pixel source
		var srcCanvas = document.createElement("canvas");
		srcCanvas.width  = img.width;
		srcCanvas.height = img.height;

		// create a destination canvas. Here the altered image will be placed
		var dstCanvas    = document.createElement("canvas");
		dstCanvas.width  = img.width;
		dstCanvas.height = img.height;

		// append the canvas elements to the container
		document.getElementById(src).appendChild(srcCanvas);
		document.getElementById(dst).appendChild(dstCanvas);

		// get context to work with
		var srcContext = srcCanvas.getContext("2d");
		var dstContext = dstCanvas.getContext("2d");

		// draw the loaded image on the source canvas
		srcContext.drawImage(img, 0, 0);

		// read pixels from source
		var pixels = srcContext.getImageData(0, 0, img.width, img.height);

		// iterate through pixel data (1 pixels consists of 4 ints in the array)
		for(var i = 0, len = pixels.data.length; i < len; i += 4){
			var r = pixels.data[i];
			var g = pixels.data[i+1];
			var b = pixels.data[i+2];

			// if the pixel matches our transparent color, set alpha to 0
			if(r == transparentColor.r && g == transparentColor.g && b == transparentColor.b){
				pixels.data[i+3] = 0;
			}
		}

		// write pixel data to destination context
		dstContext.putImageData(pixels,0,0);
	}
}


