/*var page = require('webpage').create(),
    system = require('system'),
    address, output, size;

if (system.args.length < 3 || system.args.length > 5) {
    console.log('Usage: rasterize.js URL filename [paperwidth*paperheight|paperformat] [zoom]');
    console.log('  paper (pdf output) examples: "5in*7.5in", "10cm*20cm", "A4", "Letter"');
    phantom.exit(1);
} else {
    address = system.args[1];
    output = system.args[2];
    page.viewportSize = { width: 600, height: 600 };
    if (system.args.length > 3 && system.args[2].substr(-4) === ".pdf") {
        size = system.args[3].split('*');
        page.paperSize = size.length === 2 ? { width: size[0], height: size[1], margin: '0px' }
                                           : { format: system.args[3], orientation: 'portrait', margin: '1cm' };
    }
    if (system.args.length > 4) {
        page.zoomFactor = system.args[4];
    }
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('Unable to load the address!');
            phantom.exit();
        } else {
            window.setTimeout(function () {
                page.render(output);
                phantom.exit();
            }, 200);
        }
    });
}*/


var page = require('webpage').create(),
    system = require('system');

if (system.args.length < 3) {
    console.log('Usage: printheaderfooter.js URL filename');
    phantom.exit(1);
} else {
    var address = system.args[1];
    var output = system.args[2];
    page.viewportSize = { width: 600, height: 600 };
    page.paperSize = {
        format: 'A4',
        margin: "1cm",
        footer: {
			height: "1cm",
			contents: phantom.callback(function(pageNum, numPages) {
            return "<div style='text-align:right; background-color: #ccc;'>Page Footer " + pageNum + " / " + numPages + "</div>";
			})
        },
		header: {
			height: "1cm",
			contents: phantom.callback(function(pageNum, numPages) {
            return "<div style='text-align:center; background-color: #ccc;' >Page header " + pageNum + " / " + numPages + "</div>";
			})
		}
		
};
page.open(address, function (status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
    } else {                
        window.setTimeout(function () {
            page.render(output);
            phantom.exit();
        }, 200);
    }
});
}