// ----------------------------------------
// src/includes/shape.js
// ----------------------------------------

// ----------------------------------------
// Shape/Attributes
// ----------------------------------------

/**
 * @description The origin of new ellipses is modified by the `ellipseMode()` function. The default configuration is `ellipseMode(CENTER)`, which specifies the location of the ellipse as the center of the shape. The `RADIUS` mode is the same, but the `w` and `h` parameters to `ellipse()` specify the radius of the ellipse, rather than the diameter. The `CORNER` mode draws the shape from the upper-left corner of its bounding box. The `CORNERS` mode uses the four parameters to `ellipse()` to set two opposing corners of the ellipse's bounding box.
 *
 * @cat     Shape
 * @subcat  Attributes
 * @method  ellipseMode
 *
 * @param   {String} mode The ellipse mode to switch to: either `CENTER`, `RADIUS`, `CORNER`, or `CORNERS`.
 */
pub.ellipseMode = function (mode) {
  if (arguments.length === 0) return currEllipseMode;
  if (mode === pub.CORNER || mode === pub.CORNERS || mode === pub.CENTER || mode === pub.RADIUS) {
    currEllipseMode = mode;
    return currEllipseMode;
  } else {
    error("ellipseMode(), unsupported ellipseMode. Use: CENTER, RADIUS, CORNER, CORNERS.");
  }
};

/**
 * @description Modifies the location from which rectangles or text frames draw. The default mode is `rectMode(CORNER)`, which specifies the location to be the upper left corner of the shape and uses the `w` and `h` parameters to specify the width and height. The syntax `rectMode(CORNERS)` uses the `x` and `y` parameters of `rect()` or `text()` to set the location of one corner and uses the `w` and `h` parameters to set the opposite corner. The syntax `rectMode(CENTER)` draws the shape from its center point and uses the `w` and `h` parameters to specify the shape's width and height. The syntax `rectMode(RADIUS)` draws the shape from its center point and uses the `w` and `h` parameters to specify half of the shape's width and height.
 *
 * @cat     Shape
 * @subcat  Attributes
 * @method  rectMode
 *
 * @param   {String} mode The rectMode to switch to: either `CORNER`, `CORNERS`, `CENTER`, or `RADIUS`.
 */
pub.rectMode = function (mode) {
  if (arguments.length === 0) return currRectMode;
  if (mode === pub.CORNER || mode === pub.CORNERS || mode === pub.CENTER || mode === pub.RADIUS) {
    currRectMode = mode;
    return currRectMode;
  } else {
    error("rectMode(), unsupported rectMode. Use: CORNER, CORNERS, CENTER, RADIUS.");
  }
};

/**
 * @description Sets the width of the stroke used for lines and the border around shapes.
 *
 * @cat     Shape
 * @subcat  Attributes
 * @method  strokeWeight
 *
 * @param   {Number} weight The width of the stroke in points.
 */
pub.strokeWeight = function (weight) {
  if (typeof weight === "string" || typeof weight === "number") {
    currStrokeWeight = weight;
  } else {
    error("strokeWeight(), not supported type. Please make sure the strokeweight is a number or string");
  }
};

// ----------------------------------------
// Shape/Primitives
// ----------------------------------------

/**
 * @description The `arc()` function draws an arc. Arcs are drawn along the outer edge of an ellipse defined by the `x`, `y`, `width` and `height` parameters. The origin or the arc's ellipse may be changed with the `ellipseMode()` function. The start and stop parameters specify the angles at which to draw the arc.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  arc
 *
 * @param   {Number} cx X-coordinate of the arc's center.
 * @param   {Number} cy Y-coordinate of the arc's center.
 * @param   {Number} w Width of the arc's ellipse.
 * @param   {Number} h Height of the arc's ellipse.
 * @param   {Number} startAngle Starting angle of the arc in radians.
 * @param   {Number} endAngle Ending angle of the arc in radians.
 * @param   {String} [mode] Mode to define the rendering technique of the arc: `OPEN` (default), `CHORD`, or `PIE`.
 * @return  {GraphicLine|Polygon} The resulting GraphicLine or Polygon object (in InDesign Scripting terms the corresponding type is GraphicLine or Polygon, not Arc).
 */
pub.arc = function(cx, cy, w, h, startAngle, endAngle, mode) {
  if (w <= 0 || endAngle < startAngle) {
    return false;
  }
  if (arguments.length < 6) error("arc(), not enough parameters to draw an arc! Use: x, y, w, h, startAngle, endAngle");

  var o = pub.radians(1); // add 1 degree to ensure angles of 360 degrees are drawn
  startAngle %= pub.TWO_PI + o;
  endAngle %= pub.TWO_PI + o;
  w /= 2;
  h /= 2;

  if (currEllipseMode === pub.CORNER) {
    cx = (cx - w);
    cy = (cy + h);
  }
  else if (currEllipseMode === pub.CORNERS) {
    // cx = (cx-w);
    // cy = (cy-h);
    // w -= cx;
    // h -= cy;
  }
  else if (currEllipseMode === pub.RADIUS) {
    w *= 2;
    h *= 2;
  }

  var delta = pub.abs(endAngle - startAngle);
  var direction = (startAngle < endAngle) ? 1 : -1;
  var thetaStart = startAngle;

  if(mode == pub.CHORD) {
    pub.beginShape(pub.CLOSE);
  }
  else if(mode == pub.PIE) {
    pub.beginShape(pub.CLOSE);
    pub.vertex(cx, cy);
  }
  else {
    pub.beginShape();
  }
  for (var theta = pub.min(pub.TWO_PI, delta); theta > pub.EPSILON;) {
    var thetaEnd = thetaStart + direction * pub.min(theta, pub.HALF_PI);
    var points = calculateEllipticalArc(w, h, thetaEnd, thetaStart);

    pub.vertex(
      cx + points.startx,
      cy + points.starty,
      cx + points.startx,
      cy + points.starty,
      cx + points.handle1x,
      cy + points.handle1y
    );
    pub.vertex(
      cx + points.endx,
      cy + points.endy,
      cx + points.handle2x,
      cy + points.handle2y,
      cx + points.endx,
      cy + points.endy
    );

    theta -= pub.abs(thetaEnd - thetaStart);
    thetaStart = thetaEnd;
  }
  return pub.endShape();
};

/**
 * @description Draws an ellipse (oval) in the display window. An ellipse with an equal width and height is a circle. The first two parameters set the location, the third sets the width, and the fourth sets the height. If no height is specified, the value of width is used for both the width and height. If a negative height or width is specified, the absolute value is taken. The origin may be changed with the ellipseMode() function.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  ellipse
 *
 * @param   {Number} x X-coordinate of the ellipse.
 * @param   {Number} y Y-coordinate of the ellipse.
 * @param   {Number} w Width of the ellipse.
 * @param   {Number} h Height of the ellipse.
 * @return  {Oval} New Oval (in InDesign Scripting terms the corresponding type is Oval, not Ellipse).
 */
pub.ellipse = function(x, y, w, h) {
  if (!(arguments.length === 4 || arguments.length === 3)) {
    error("ellipse(), invalid parameters to draw an ellipse! Use: x, y, w, [h]");
  }
  if(arguments.length === 3) {
    h = w;
  }
  var ellipseBounds = [];
  if (currEllipseMode === pub.CORNER) {
    ellipseBounds[0] = y;
    ellipseBounds[1] = x;
    ellipseBounds[2] = y + h;
    ellipseBounds[3] = x + w;
  } else if (currEllipseMode === pub.CORNERS) {
    ellipseBounds[0] = y;
    ellipseBounds[1] = x;
    ellipseBounds[2] = h;
    ellipseBounds[3] = w;
  } else if (currEllipseMode === pub.CENTER) {
    ellipseBounds[0] = y - (h / 2);
    ellipseBounds[1] = x - (w / 2);
    ellipseBounds[2] = y + (h / 2);
    ellipseBounds[3] = x + (w / 2);
  } else if (currEllipseMode === pub.RADIUS) {
    ellipseBounds[0] = y - h;
    ellipseBounds[1] = x - w;
    ellipseBounds[2] = y + h;
    ellipseBounds[3] = x + w;
  }

  if(w === 0 || h === 0) {
    return false;
  }

  var ovals = currentPage().ovals;
  var newOval = ovals.add(currentLayer());

  newOval.strokeWeight = currStrokeWeight;
  newOval.strokeTint = currStrokeTint;
  newOval.fillColor = currFillColor;
  newOval.fillTint = currFillTint;
  newOval.strokeColor = currStrokeColor;
  newOval.geometricBounds = ellipseBounds;

  if (currEllipseMode === pub.CENTER || currEllipseMode === pub.RADIUS) {
    newOval.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                      AnchorPoint.CENTER_ANCHOR,
                      currMatrix.adobeMatrix(x, y));
  } else {
    newOval.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                      AnchorPoint.TOP_LEFT_ANCHOR,
                      currMatrix.adobeMatrix(x, y));
  }
  return newOval;
};

/**
 * @description Draws a line (a direct path between two points) to the page.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  line
 *
 * @param   {Number} x1 X-coordinate of Point 1.
 * @param   {Number} y1 Y-coordinate of Point 1.
 * @param   {Number} x2 X-coordinate of Point 2.
 * @param   {Number} y2 Y-coordinate of Point 2.
 * @return  {GraphicLine} New GraphicLine.
 *
 * @example
 * var vec1 = new Vector(x1, y1);
 * var vec2 = new Vector(x2, y2);
 * line( vec1, vec2 );
 */
pub.line = function(x1, y1, x2, y2) {
  if (arguments.length !== 4) {
    error("line(), not enough parameters to draw a line! Use: x1, y1, x2, y2");
  }
  var lines = currentPage().graphicLines;
  var newLine = lines.add(currentLayer());
  newLine.strokeWeight = currStrokeWeight;
  newLine.strokeTint = currStrokeTint;
  newLine.fillColor = currFillColor;
  newLine.fillTint = currFillTint;
  newLine.strokeColor = currStrokeColor;
  newLine.paths.item(0).entirePath = [[x1, y1], [x2, y2]];
  newLine.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                   AnchorPoint.CENTER_ANCHOR,
                   currMatrix.adobeMatrix( (x1 + x2) / 2, (y1 + y2) / 2 ));
  return newLine;
};

/**
 * @description Draws a point, a coordinate in space at the dimension of the current stroke weight. The first parameter is the horizontal value for the point, the second value is the vertical value for the point. The color of the point is determined by the current stroke.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  point
 *
 * @param   {Number} x X-coordinate of the point.
 * @param   {Number} y Y-coordinate of the point.
 * @return  {Oval} The point as an Oval object.
 */
pub.point = function(x, y) {
  if (arguments.length !== 2 || !isNumber(x) || !isNumber(y)) {
    error("point(), wrong parameters to draw a point! Use: x, y");
  }

  var basilUnits = {
    pt: MeasurementUnits.POINTS,
    mm: MeasurementUnits.MILLIMETERS,
    cm: MeasurementUnits.CENTIMETERS,
    inch: MeasurementUnits.INCHES,
    px: MeasurementUnits.PIXELS
  }
  var unitEnum = basilUnits[currUnits];
  var w = UnitValue(currStrokeWeight, MeasurementUnits.POINTS).as(unitEnum);
  var h = w;

  if (currEllipseMode === pub.CORNER) {
    x -= w / 2;
    y -= h / 2;
  } else if (currEllipseMode === pub.CORNERS) {
    x -= w / 2;
    y -= h / 2;
    w = x + w;
    h = y + h;
  } else if (currEllipseMode === pub.RADIUS) {
    w /= 2;
    h /= 2;
  }

  var p = ellipse(x, y, w, h);
  p.fillColor = currStrokeColor;
  p.strokeWeight = 0;

  return p;
};

/**
 * @description Draws a quad to the page. A quad is a quadrilateral, a four sided polygon. It is similar to a rectangle, but the angles between its edges are not constrained to ninety degrees. The first pair of parameters (`x1`, `y1`) sets the first vertex, the subsequent pairs proceed around the defined shape.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  quad
 *
 * @param   {Number} x1 X-coordinate of Point 1.
 * @param   {Number} y1 Y-coordinate of Point 1.
 * @param   {Number} x2 X-coordinate of Point 2.
 * @param   {Number} y2 Y-coordinate of Point 2.
 * @param   {Number} x3 X-coordinate of Point 3.
 * @param   {Number} y3 Y-coordinate of Point 3.
 * @param   {Number} x3 X-coordinate of Point 4.
 * @param   {Number} y3 Y-coordinate of Point 4.
 * @return  {Polygon} The new quad as a Polygon object.
 */
pub.quad = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  if (arguments.length !== 8) {
    error("quad(), not enough parameters to draw a quad! Use: x1, y1, x2, y2, x3, y3, x4, y4");
  }

  beginShape();
    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
    vertex(x4, y4);
  return endShape(CLOSE);
};

/**
 * @description Draws a rectangle on the page.
 * By default, the first two parameters set the location of the upper-left corner, the third sets the width, and the fourth sets the height. The way these parameters are interpreted, however, may be changed with the `rectMode()` function.
 * The fifth, sixth, seventh and eighth parameters, if specified, determine corner radius for the top-right, top-left, lower-right and lower-left corners, respectively. If only a fifth parameter is provided, all corners will be set to this radius.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  rect
 *
 * @param   {Number} x X-coordinate of the rectangle.
 * @param   {Number} y Y-coordinate of the rectangle.
 * @param   {Number} w Width of the rectangle.
 * @param   {Number} h Height of the rectangle.
 * @param   {Number} [tl] Radius of top left corner or radius of all 4 corners (optional).
 * @param   {Number} [tr] Radius of top right corner (optional).
 * @param   {Number} [br] Radius of bottom right corner (optional).
 * @param   {Number} [bl] Radius of bottom left corner (optional).
 * @return  {Rectangle} The rectangle that was created.
 */
pub.rect = function(x, y, w, h, tl, tr, br, bl) {
  if (w === 0 || h === 0) {
    // InDesign doesn't draw a rectangle if width or height are set to 0
    return false;
  }
  if (arguments.length < 4) error("rect(), not enough parameters to draw a rect! Use: x, y, w, h");

  var rectBounds = [];
  if (currRectMode === pub.CORNER) {
    rectBounds[0] = y;
    rectBounds[1] = x;
    rectBounds[2] = y + h;
    rectBounds[3] = x + w;
  } else if (currRectMode === pub.CORNERS) {
    rectBounds[0] = y;
    rectBounds[1] = x;
    rectBounds[2] = h;
    rectBounds[3] = w;
  } else if (currRectMode === pub.CENTER) {
    rectBounds[0] = y - (h / 2);
    rectBounds[1] = x - (w / 2);
    rectBounds[2] = y + (h / 2);
    rectBounds[3] = x + (w / 2);
  } else if (currRectMode === pub.RADIUS) {
    rectBounds[0] = y - h;
    rectBounds[1] = x - w;
    rectBounds[2] = y + h;
    rectBounds[3] = x + w;
  }

  var newRect = currentPage().rectangles.add(currentLayer());
  newRect.geometricBounds = rectBounds;
  newRect.strokeWeight = currStrokeWeight;
  newRect.strokeTint = currStrokeTint;
  newRect.fillColor = currFillColor;
  newRect.fillTint = currFillTint;
  newRect.strokeColor = currStrokeColor;

  if (currRectMode === pub.CENTER || currRectMode === pub.RADIUS) {
    newRect.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                       AnchorPoint.CENTER_ANCHOR,
                       currMatrix.adobeMatrix(x, y));
  } else {
    newRect.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                   AnchorPoint.TOP_LEFT_ANCHOR,
                   currMatrix.adobeMatrix(x, y));
  }

  if(arguments.length > 4) {
    for(var i = 4; i < arguments.length;i++){
      if(arguments[i] < 0 ){
        error("rect(), needs positive values as arguments for the rounded corners.");
      }
    }
    newRect.topLeftCornerOption = newRect.topRightCornerOption = newRect.bottomRightCornerOption = newRect.bottomLeftCornerOption = CornerOptions.ROUNDED_CORNER;
    if(arguments.length === 8) {
      newRect.topLeftCornerRadius = tl;
      newRect.topRightCornerRadius = tr;
      newRect.bottomRightCornerRadius = br;
      newRect.bottomLeftCornerRadius = bl;
    } else {
      newRect.topLeftCornerRadius = newRect.topRightCornerRadius = newRect.bottomRightCornerRadius = newRect.bottomLeftCornerRadius = tl;
    }
  }
  return newRect;
};

/**
 * @description Draws a triangle to the page. The first two arguments specify the first point, the middle two arguments specify the second point, and the last two arguments specify the third point.
 *
 * @cat     Shape
 * @subcat  Primitives
 * @method  triangle
 *
 * @param   {Number} x1 X-coordinate of Point 1.
 * @param   {Number} y1 Y-coordinate of Point 1.
 * @param   {Number} x2 X-coordinate of Point 2.
 * @param   {Number} y2 Y-coordinate of Point 2.
 * @param   {Number} x3 X-coordinate of Point 3.
 * @param   {Number} y3 Y-coordinate of Point 3.
 * @return  {Polygon} The new triangle as a Polygon object.
 */
pub.triangle = function(x1, y1, x2, y2, x3, y3) {
  if (arguments.length !== 6) {
    error("triangle(), not enough parameters to draw a triangle! Use: x1, y1, x2, y2, x3, y3");
  }

  beginShape();
    vertex(x1, y1);
    vertex(x2, y2);
    vertex(x3, y3);
  return endShape(CLOSE);
};

// ----------------------------------------
// Shape/Vertex
// ----------------------------------------

/**
 * @description `addPath()` is used to create multi component paths. Call `addPath()` to add the vertices drawn so far to a single path. New vertices will then end up in a new path and `endShape()` will return a multi path object. All component paths will account for the setting (see `CLOSE`) given in `beginShape(shapeMode)`.
 *
 * @cat     Shape
 * @subcat  Vertex
 * @method  addPath
 */
pub.addPath = function() {
  doAddPath();
  currPathPointer++;
};

/**
 * @description Using the `beginShape()` and `endShape()` functions allows to create more complex forms. `beginShape()` begins recording vertices for a shape and `endShape()` stops recording. After calling the `beginShape()` function, a series of `vertex()` commands must follow. To stop drawing the shape, call `endShape()`.
 *
 * @cat     Shape
 * @subcat  Vertex
 * @method  beginShape
 *
 */
pub.beginShape = function() {
  currVertexPoints = [];
  currPathPointer = 0;
  currPolygon = null;
};

/**
 * @description The `endShape()` function is the companion to `beginShape()` and may only be called after `beginShape()`. It creates and returns a path of the previously called `vertex()` points. The `shapeMode` parameter allows to close the shape (to connect the beginning and the end).
 *
 * @cat     Shape
 * @subcat  Vertex
 * @method  endShape
 *
 * @param   {String} shapeMode Set to `CLOSE` if the new path should be auto-closed.
 * @return  {GraphicLine|Polygon} The GraphicLine or Polygon object that was created.
 */
pub.endShape = function(shapeMode) {
  if(shapeMode === pub.CLOSE) {
    currShapeMode = shapeMode;
  } else {
    currShapeMode = null;
  }
  doAddPath();
  currPolygon.transform(CoordinateSpaces.PASTEBOARD_COORDINATES,
                   AnchorPoint.TOP_LEFT_ANCHOR,
                   currMatrix.adobeMatrix(currPolygon.geometricBounds[1], currPolygon.geometricBounds[0]));
  return currPolygon;
};

/**
 * @description Shapes are constructed by connecting a series of vertices. `vertex()` is used to specify the vertex coordinates of lines and polygons. It is used exclusively between the `beginShape()` and `endShape()` functions.
 *
 * Use either `vertex(x, y)` for drawing straight corners or `vertex(x, y, xLeftHandle, yLeftHandle, xRightHandle, yRightHandle)` for drawing bezier shapes. You can also mix the two approaches.
 *
 * @cat     Shape
 * @subcat  Vertex
 * @method  vertex
 *
 * @param   {Number} x X-coordinate of the vertex.
 * @param   {Number} y Y-coordinate of the vertex.
 * @param   {Number} [xLeftHandle] X-coordinate of the left-direction point.
 * @param   {Number} [yLeftHandle] Y-coordinate of the left-direction point.
 * @param   {Number} [xRightHandle] X-coordinate of the right-direction point.
 * @param   {Number} [yRightHandle] Y-coordinate of the right-direction point.
 */
pub.vertex = function() {
  if (isArray(currVertexPoints)) {
    if (arguments.length === 2) {
      currVertexPoints.push([arguments[0], arguments[1]]);
    } else if (arguments.length === 6) {
      // [[xL1, YL1], [x1, y1], [xR1, yR1]]
      currVertexPoints.push([[arguments[2], arguments[3]],
                              [arguments[0], arguments[1]],
                              [arguments[4], arguments[5]]]);
    } else {
      error("vertex(), wrong argument count: Please use either vertex(x, y) or vertex(x, y, xLeftHandle, yLeftHandle, xRightHandle, yRightHandle)!");
    }
  } else {
    notCalledBeginShapeError();
  }
};

// ----------------------------------------
// Shape Private
// ----------------------------------------

function addPolygon() {
  if (currShapeMode === pub.CLOSE) {
    currPolygon = currentPage().polygons.add(currentLayer());
  } else {
    currPolygon = currentPage().graphicLines.add(currentLayer());
  }

  currPolygon.strokeWeight = currStrokeWeight;
  currPolygon.strokeTint = currStrokeTint;
  currPolygon.fillColor = currFillColor;
  currPolygon.fillTint = currFillTint;
  currPolygon.strokeColor = currStrokeColor;
}

/*
 * Cubic bezier approximation of a eliptical arc
 *
 * intial source code: Golan Levin golan@flong.com
 * http://www.flong.com/blog/2009/bezier-approximation-of-a-circular-arc-in-processing/
 *
 * The solution is taken from this PDF by Richard DeVeneza:
 * http://www.tinaja.com/glib/bezcirc2.pdf linked from this excellent site by
 * Don Lancaster: http://www.tinaja.com/cubic01.asp
 */
function calculateEllipticalArc(w, h, startAngle, endAngle) {
  var theta = (endAngle - startAngle);

  var x0 = pub.cos(theta / 2.0);
  var y0 = pub.sin(theta / 2.0);
  var x3 = x0;
  var y3 = 0 - y0;
  var x1 = (4.0 - x0) / 3.0;
  var y1 = ((1.0 - x0) * (3.0 - x0)) / (3.0 * y0);
  var x2 = x1;
  var y2 = 0 - y1;

  var bezAng = startAngle + theta / 2.0;
  var cBezAng = pub.cos(bezAng);
  var sBezAng = pub.sin(bezAng);

  return {
    startx:   w * (cBezAng * x0 - sBezAng * y0),
    starty:   h * (sBezAng * x0 + cBezAng * y0),
    handle1x: w * (cBezAng * x1 - sBezAng * y1),
    handle1y: h * (sBezAng * x1 + cBezAng * y1),

    handle2x: w * (cBezAng * x2 - sBezAng * y2),
    handle2y: h * (sBezAng * x2 + cBezAng * y2),
    endx:     w * (cBezAng * x3 - sBezAng * y3),
    endy:     h * (sBezAng * x3 + cBezAng * y3)
  };
}

function doAddPath() {
  if (isArray(currVertexPoints)) {
    if (currVertexPoints.length > 0) {

      if(currPolygon === null) {
        addPolygon();
      } else {
        currPolygon.paths.add();
      }

      currPolygon.paths.item(currPathPointer).entirePath = currVertexPoints;
      currVertexPoints = [];
    }
  } else {
    notCalledBeginShapeError();
  }
}

function notCalledBeginShapeError () {
  error("endShape(), you have to call first beginShape(), before calling vertex() and endShape()");
}
