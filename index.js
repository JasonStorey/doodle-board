var Firebase = require('firebase'),
    $ = require('jquery');

module.exports = {
    init: config => {
        var pixSize = 2,
            lastPoint = null,
            currentColor = '000',
            mouseDown = false;

        var pixelDataRef = new Firebase('https://doodle-board.firebaseio.com/'),
            canvas = config.canvas,
            context = canvas.getContext ? canvas.getContext('2d') : null;

        if (context === null) {
            alert('You must use a browser that supports HTML5 Canvas to run this demo.');
            return;
        }

        $(canvas).on('mousedown', event => {
            mouseDown = true;
        });

        $(canvas).on('mouseout mouseup', event => {
            mouseDown = false;
            lastPoint = null;
        });

        $(canvas).on('mousemove mousedown', event => {
            if (!mouseDown) return;

            event.preventDefault();

            // Bresenham's line algorithm. We use this to ensure smooth lines are drawn
            var offset = $(canvas).offset();
            var x1 = Math.floor((event.pageX - offset.left) / pixSize - 1),
                y1 = Math.floor((event.pageY - offset.top) / pixSize - 1);
            var x0 = (lastPoint == null) ? x1 : lastPoint[0];
            var y0 = (lastPoint == null) ? y1 : lastPoint[1];
            var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
            var sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1, err = dx - dy;
            while (true) {
                //write the pixel into Firebase, or if we are drawing white, remove the pixel
                pixelDataRef.child(x0 + ":" + y0).set(currentColor === "fff" ? null : currentColor);

                if (x0 == x1 && y0 == y1) break;
                var e2 = 2 * err;
                if (e2 > -dy) {
                    err = err - dy;
                    x0 = x0 + sx;
                }
                if (e2 < dx) {
                    err = err + dx;
                    y0 = y0 + sy;
                }
            }
            lastPoint = [x1, y1];
        });

        // Add callbacks that are fired any time the pixel data changes and adjusts the canvas appropriately.
        // Note that child_added events will be fired for initial pixel data as well.
        function drawPixel(snapshot) {
            var coords = snapshot.key().split(":");
            context.fillStyle = "#" + snapshot.val();
            context.fillRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        }
        function clearPixel(snapshot) {
            var coords = snapshot.key().split(":");
            context.clearRect(parseInt(coords[0]) * pixSize, parseInt(coords[1]) * pixSize, pixSize, pixSize);
        }
        pixelDataRef.on('child_added', drawPixel);
        pixelDataRef.on('child_changed', drawPixel);
        pixelDataRef.on('child_removed', clearPixel);
    }
};
