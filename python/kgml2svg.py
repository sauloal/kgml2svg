#!/usr/bin/python
import os
import sys
import re
import time
import datetime

from pprint import pprint as pp

PROG_NAME = 'kgml2svg'
PROG_VER  = '201509111735'
RUN_TIME  = datetime.datetime.fromtimestamp(time.time()).strftime('%Y-%m-%d %H:%M:%S')

#http://rest.kegg.jp/list/pathway/pti
#wget http://rest.kegg.jp/get/pti00630/kgml -O /pti00630.kgml


#https://docs.python.org/2/library/xml.dom.html
#https://docs.python.org/2/library/re.html

out_folder = 'out'



def get_keys(line):
	keys = {}
	for m in re.findall('(\S+?)="(.+?)"', line):
		keys[m[0]] = m[1]
	return keys

def clean_name(name):
	return re.sub('_+', '_', name.replace(':', '_').replace(' ', '_').replace('.', '_') )
	
def data2svg(data):
	svg      = ''
	g_images = ''
	g_areas  = ''
	g_labels = ''
	g_links  = ''

	#add filters to convert green into white and the background into transparency 
	#http://docs.webplatform.org/wiki/svg/elements/feColorMatrix
	"""
	PATHWAY {
		'name': 'path:pti00630', 
		'title': 'Glyoxylate and dicarboxylate metabolism', 
		'image': 'http://www.kegg.jp/kegg/pathway/pti/pti00630.png', 
		'number': '00630', 
		'link': 'http://www.kegg.jp/kegg-bin/show_pathway?pti00630', 
		'org': 'pti'}
	ENTRY {
		'link': 'http://www.kegg.jp/dbget-bin/www_bget?K01816', 
		'reaction': 'rn:R01394', 
		'type': 'ortholog', 
		'id': '75', 
		'name': 'ko:K01816'}
	GRAPHICS {
		'name': 'K01816', 
		'width': '46', 
		'height': '17', 
		'bgcolor': '#FFFFFF', 
		'y': '519', 
		'x': '382', 
		'type': 'rectangle', 
		'fgcolor': '#000000'}
	"""

	"""
		keys[ '_entries' ] = keys
		en = data[ last_path ][ '_entries' ].append( keys )
		gr = data[ last_path ][ '_entries' ][ last_entry ][ -1 ][ '_graphs' ]
	"""
	doc = ""
	default_pathway_keys  = 'image'.split(' ')
	default_entry_keys    = 'link id'.split(' ')
	default_graphics_keys = 'type x y width height id name'.split(' ')
	default_color         = '#000'
	default_opacity       = '0.0'
	for pathway_name in data:
		pathway_name_clean = clean_name( pathway_name )
		svg_tag_id         = 'kegg_svg_' + pathway_name_clean
		print 'pathway_name', pathway_name, 'pathway_name_clean', pathway_name_clean, 'svg_tag_id', svg_tag_id
		
		g_images    += '\t<g id="%s_image">\n' % svg_tag_id
		g_areas     += '\t<g id="%s_areas">\n' % svg_tag_id
		g_labels    += '\t<g id="%s_labels" filter="url(#%s_matrix-invert)">\n' % (svg_tag_id, svg_tag_id)
		g_links     += '\t<g id="%s_links">\n' % svg_tag_id
		
		pathway      = data[pathway_name]
		p_image      = pathway['image']
		p_image_tag  = '\t\t<image x="0" y="0" render-order="1" filter="url(#%s_matrix-black)" xlink:href="%s" ' % ( svg_tag_id, p_image )
		#p_image_tag  = '\t\t<image x="0" y="0" render-order="1" filter="url(#%s_matrix-black)" width="0px" height="0px" xlink:href="%s" ' % ( svg_tag_id, p_image )
		# p_image_tag  = '\t\t<image x="0" y="0" render-order="1" filter="url(#%s_matrix-black)" width="0px" height="0px" xlink:href="%s" ' % ( svg_tag_id, 'html1/pti00630.png' )

		for pk in list(set(pathway.keys()) - set(default_pathway_keys)):
			if pk[0] == '_':
				continue
			val          = pathway[pk]
			kv           = ' ' + pk + '="' + val + '"'
			p_image_tag += kv

		g_images += p_image_tag +'></image>\n'
		g_labels += p_image_tag +' mask="url(#%s_name_inverter)"></image>\n' % (svg_tag_id)
		
		entries_names = pathway['_entries']
		for entries_name in entries_names:
			print ' entries_name', entries_name
			entries = entries_names[entries_name]
			for entry in entries:
				entry_name       = entry['name']
				entry_id         = entry['id'  ]
				entry_id_clean   = clean_name(entry_id)
				entry_tag_id     = svg_tag_id + '_' + entry_id_clean
				print '  entry_name', entry_name
				graphs_names = entry['_graphs']
				
				entry_link  = entry['link']
				g_link    = '\t\t<a xlink:href="'+entry_link+'"' + ' id="'+entry_tag_id+'_link"'
				for ek in list(set(entry.keys()) - set(default_entry_keys)):
					if ek[0] == '_':
						continue
					ev = entry[ek]
					g_link    += " " + ek + '="' + ev + '"'
				g_link    += '>\n'

				for graphs_name in graphs_names:
					graphs_name_clean = clean_name(graphs_name)
					print '   graphs_name', graphs_name, 'graphs_name_clean', graphs_name_clean
					graphs = graphs_names[graphs_name]
					for graph in graphs:
						graph_name     =     graph['name'  ]
						graph_type     =     graph['type'  ]
						graph_x        = int(graph['x'     ])
						graph_y        = int(graph['y'     ])
						graph_width    = int(graph['width' ])
						graph_height   = int(graph['height'])
						graph_extra    = ''
						graph_tag_id   = entry_tag_id + '_' + graphs_name_clean + '_' + str(graph_x) + '_' + str(graph_y)
						graph_tag_name = ''
						
						print '    graph_name', graph_name, 'graph_type', graph_type, 'graph_x', graph_x, 'graph_y', graph_y, 'graph_width', graph_width, 'graph_height', graph_height, 'graph_tag_id', graph_tag_id

						if   graph_type == 'rectangle':
							graph_tag_name = 'rect'
						
						elif graph_type == 'roundrectangle':
							graph_tag_name = 'rect'
							graph_extra    = ' rx="10"'

						elif graph_type == 'circle':
							graph_tag_name = 'circle'

							
						graph_width_name = ''
						
						if   graph_tag_name == 'rect':
							graph_x           = (graph_x-(graph_width /2.0))
							graph_y           = (graph_y-(graph_height/2.0))
							graph_width_name  = 'width'
							graph_extra      += ' x="%d" y="%d"' % ( graph_x, graph_y )
							
						elif graph_tag_name == 'circle':
							graph_width = graph_width / 2.0
							graph_width_name = 'r'
							graph_extra      += ' cx="%d" cy="%d"' % ( graph_x, graph_y )
						
						g_graph = ' %s="%d" height="%d"%s' % (graph_width_name, graph_width, graph_height, graph_extra)
						
						for gk in list(set(graph.keys()) - set(default_graphics_keys)):
							if gk[0] == '_':
								continue
							gv       = graph[gk]
							g_graph += ' %s="%s"' % ( gk, gv )
						
						g_graph += '/>\n'

						g_graphA = '\t\t<%s id="%s" nick="%s" name="%s" fill="%s" fill-opacity="%s" %s' % (
							graph_tag_name, graph_tag_id + '_area', graph_name, entry_name, default_color, default_opacity, g_graph)
						g_graphL = '\t\t\t<%s id="%s" nick="%s" name="%s" fill="%s" fill-opacity="%s" %s' % (
							graph_tag_name, graph_tag_id + '_link', graph_name, entry_name, default_color, default_opacity, g_graph)

						g_areas += g_graphA
						g_link  += g_graphL
						
				g_link    += '\t\t</a>\n'
				g_links   += g_link

		g_images += '\t</g>\n'
		g_areas  += '\t</g>\n'
		g_labels += '\t</g>\n'
		g_links  += '\t</g>\n'

		svg       = '<svg id="%s" progName="%s" progVer="%s" creationDate="%s" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">\n' % (svg_tag_id, PROG_NAME, PROG_VER, RUN_TIME)
		#svg       = '<svg id="%s" progName="%s" progVer="%s" creationDate="%s" viewbox="0 0 0 0" width="0px" height="0px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd">\n' % (svg_tag_id, PROG_NAME, PROG_VER, RUN_TIME)
		svg      += filters.replace('id="', 'id="%s_' % svg_tag_id)
		svg      += g_images + g_areas + g_labels + g_links + "</svg>\n"
		
		doc      += svg
	print doc
	
	return doc
	
def code2svg(code):	
	code = re.sub(' +', ' ', code)
	code = re.sub('\n ', '\n', code)
	code = re.sub('"\n', '" ', code)

	code = re.sub('</?reaction.*?>\n', '', code)
	code = re.sub('</?substrate.*?>\n', '', code)
	code = re.sub('</?product.*?>\n', '', code)
	code = re.sub('</?subtype.*?>\n', '', code)
	code = re.sub('</?relatio.*?>\n', '', code)
	code = re.sub('<\?xml.*?>\n', '', code)
	code = re.sub('<\!DOCTYPE.*?>\n', '', code)

	code = re.sub('</entry>\n', '', code)
	#print code

	data	   = {}
	last_path  = None
	last_entry = None
	for line in code.split('\n'):
		#print line

		keys = get_keys(line)
		
		if line.startswith('<pathway'):
			#print 'PATH', keys
			name = keys['name']
			keys[ '_entries' ] = {}
			assert name not in data
			data[ name ] = keys
			last_path	= name

		if line.startswith('<entry'):
			#print 'ENTRY', keys
			name = keys['name']
			keys[ '_graphs' ] = {}
			en = data[ last_path ][ '_entries' ]
			if name not in en:
				en[name] = []
			en[ name ].append( keys )
			last_entry = name

		if line.startswith('<graphics'):
			#print 'GRAPHICS', keys
			name = keys['name']
			gr = data[ last_path ][ '_entries' ][ last_entry ][ -1 ][ '_graphs' ]
			assert name not in gr
			if name not in gr:
				gr[name] = []
			gr[name].append( keys )

	svg = data2svg(data)
	return svg

filters = 	"""\
	<defs id="svg_defs">
		<filter id="matrix-black">
			<feColorMatrix in="SourceGraphic" type="matrix" values="1  1  0  0 0
																	   0  1  0  0 0
																	   0  1  1  0 0
																	   0  0  0  0 1"/>
			<feColorMatrix in="SourceGraphic" type="matrix" values="0  0  0  0 0
																	   0  0  0  0 0
																	   0  0  0  0 0
																	   -1  -1  -1  1 0"/>
		</filter>
		<filter id="saturate">
			<feColorMatrix in="SourceGraphic" type="saturate" values=".5" result="A"/>
		</filter>
		<filter id="hueRotate">
			<feColorMatrix in="SourceGraphic" type="hueRotate" values="45" result="A"/>
		</filter>
		<filter id="L2A">
			<feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="A"/>
		</filter>
		<filter id="grayscale">
			<feColorMatrix type="saturate" values="0"/>
		</filter>
		<filter id="matrix-greyscale">
			<feColorMatrix in="SourceGraphic" type="matrix" values=".33 .33 .33 0 0 
																	   .33 .33 .33 0 0 
																	   .33 .33 .33 0 0
																	   0 0 0 1 0"/>
		</filter>
		<filter id="matrix-invert">
			<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1 
																	   0 -1 0 0 1 
																	   0 0 -1 0 1
																	   0 0 0 1 0"/>
		</filter>
		<mask id="name_inverter">
			<rect fgcolor="#fff" fill="#fff" x="937.5" y="215" width="73" height="34" rx="10" fill-opacity="0.5"></rect>
		</mask>
	</defs>
"""

def main():
	infile  = sys.argv[1]
	outfile = os.path.join(out_folder, os.path.basename(infile)).replace('kgml','svg')

	print 'in  file', infile
	print 'out file', outfile

	incode = open(infile, 'r').read()
	outimg = code2svg(incode)

	open(outfile, 'w').write(outimg)
	
if __name__ == '__main__':
	main()

