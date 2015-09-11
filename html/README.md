# HTML
This script accepts a KGML string and converts to SVG which will downlaod the PNG from Kegg's website, mask its background and masks any box marked as green.
It also indexes the boxes ids and allows the user to color boxes by ID.

## kegg.js
Whole code. that's it. just send the KGML string and the ID of the container the image should be added to.

## pti00630.html
Implementation example.

## pti00630.png
The PNG downloaded from the site.

## example.js
In case you can't circunvent the CORS, this contains a KGML text as a JavaScript variable.

## example.svg
The output of the conversion.
