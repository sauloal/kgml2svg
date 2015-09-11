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


var kgml_svg = function (containerid, svg_data, clbk) {
	this.tagNames     = {"rect": 1, "circle": 1};
	var ld            = this;
	
	this.container_id = containerid;
	this.container_el = document.getElementById(containerid);
	
	this.svg_data     = svg_data;
	
	this.container_el.innerHTML = this.svg_data;
	
	for (var cn in this.container_el.childNodes ) {
		var ce = this.container_el.childNodes[cn];
		//console.log('ce', ce);
		if ( ce.tagName == 'svg' ) {
			this.svg_el = ce;
			break;
		}
	}
	
	this.svg_id      = this.svg_el.getAttribute('id');
	
	this.defs_id     = this.svg_id + '_svg_defs';
	this.g_image_id  = this.svg_id + '_image';
	this.g_areas_id  = this.svg_id + '_areas';
	this.g_labels_id = this.svg_id + '_labels';
	this.g_links_id  = this.svg_id + '_links';
	
	this.defs_el     = document.getElementById(this.defs_id    );
	this.g_image_el  = document.getElementById(this.g_image_id );
	this.g_areas_el  = document.getElementById(this.g_areas_id );
	this.g_labels_el = document.getElementById(this.g_labels_id);
	this.g_links_el  = document.getElementById(this.g_links_id );

	this.defs_mask_id = this.svg_id + '_name_inverter';
	this.defs_mask_el = document.getElementById(this.defs_mask_id);
	
	this.img_src = this.g_image_el.getElementsByTagName('image')[0].getAttribute('xlink:href');
	console.log('kgml_svg', 'svg_id' , this.svg_id );
	console.log('kgml_svg', 'img_src', this.img_src);

	var img          = new Image();
	img.src          = this.img_src;
	img.onload = function(){
		ld.img_width  = img.width;
		ld.img_height = img.height;
		
		console.log('kgml_svg', "loaded img", ld.img_width, ld.img_height);

		ld.resizer(); //resize svg
		ld.indexer(); //index areas (colors)
		
		try {
			clbk(); //call callback
		}
		catch(e){
		}
	}
}

kgml_svg.prototype.resizer = function() {
	console.log('kgml_svg', 'resizer');
	this.svg_el.setAttribute('viewBox', String.format("0 0 {0} {1}", this.img_width, this.img_height));
	this.svg_el.setAttribute('width'  , String.format("{0}px", this.img_width ));
	this.svg_el.setAttribute('height' , String.format("{0}px", this.img_height));
	
	var images = this.svg_el.getElementsByTagName('image');
	for ( var img = 0; img < images.length; img++ ) {
		var image_el = images[img];
		image_el.setAttribute('width'  , String.format("{0}px", this.img_width ));
		image_el.setAttribute('height' , String.format("{0}px", this.img_height));
	}
}



kgml_svg.prototype.indexer = function() {
	//index all ids for easy color change
	console.log('kgml_svg', 'indexing');

	var names = {}; //all ids and their names
	//extract ids and names from fields

	for ( var tagName in this.tagNames ) {
		var els = this.g_areas_el.getElementsByTagName(tagName);
		for ( var t = 0; t < els.length; t++ ) {
			var el      = els[t];
			var el_id   = el.getAttribute('id'  );
			var el_name = el.getAttribute('name');
	
			//console.log("id", el_id, "name", el_name);
			
			//add full name to names under the id
			add_if_dos_not_exists(names, el_name, el_id);
			
			//split if there are spaces
			var parts = el_name.split(/\s/);
			//console.log(" parts", parts);
			for ( var p in parts ) {
				var part = parts[p];
				//console.log("  part", part);
				
				//add name part to names under the id
				add_if_dos_not_exists(names, part, el_id);
				
				//split if there are colons
				var segs = part.split(":");
				//console.log("   segs", segs);
				if (segs.length == 1) {
					var seg = segs[0];
					//console.log("    seg1", seg);
					
					//add name without colon under the id
					add_if_dos_not_exists(names, seg, el_id);
					
				} else 
				if (segs.length == 2) {
					var sty = segs[0];
					var seg = segs[1];
					//console.log("    seg2", "type:", sty, "val:", seg);
					
					//add name without colon under the id
					add_if_dos_not_exists(names, seg, el_id);
				}
			}
		}
	}
	// console.log("names", names);
	this.index = names;
}


kgml_svg.prototype.highlight = function(code, color, fill_opacity) {
	console.log('highlight','code:',code, 'color:',color, 'fill_opacity:"', fill_opacity);

	//if code in index, proceed
	if (code in this.index) {
		console.log(' EXISTS');
		var els = this.index[code];//ids containing the code
		// console.log('  els',els);
		
		//for each element
		for ( var e in els ) {
			var el      = els[e];
			var nel     = document.getElementById(el);
			var tagName = nel.tagName;
			// console.log('    el', el, tagName, nel);
			
			//verify if tag name is correct and change color and opacity
			if (tagName in this.tagNames) {
				nel.setAttribute('fill'        , color       );
				nel.setAttribute('fill-opacity', fill_opacity);
				
				var mel = nel.cloneNode(true);
				mel.setAttribute('fill'        , "#fff");
				mel.setAttribute('fill-opacity', "1.0");
				mel.setAttribute('width'       ,            mel.getAttribute('width' ) -1);
				mel.setAttribute('height'      ,            mel.getAttribute('height') -1);
				mel.setAttribute('x'           , parseFloat(mel.getAttribute('x'     ))+1);
				mel.setAttribute('y'           , parseFloat(mel.getAttribute('y'     ))+1);
				this.defs_mask_el.appendChild(mel);
			} else {
				console.warn('TAG', tagName, 'NOT ALLOWED', this.tagNames);
			}
		}
		
	} else {
		console.log('highlight',code,"DOES NO EXISTS");
	}
}


