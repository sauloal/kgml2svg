# HTML
This script accepts a KGML file and converts it to SVG which, after loaded in a browser using the provided JS, will download the PNG from Kegg's website, mask its background and masks any box marked as green.

It also indexes the boxes ids and allows the user to color boxes by ID.

## kgml2svg.py
Whole code. that's it. Just gige the path to a KGML file and it will create a SVG file in the out folder.

It can also be used as a library to convert a KGML string and return a SVG string.

## kgml2svg.js
This script will accept an SVG string, created by the python script, and a container ID where the image will be placed, indexed and accessible to higlight.

## kgml2svg.html
Implementation example.

## data.js
In case you can't circunvent the CORS, this contains a KGML text as a JavaScript variable.

## in/pti00630.kgml
Input KGML.

## out/pti00630.svg
The output of the conversion.
