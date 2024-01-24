// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

var test = ee.ImageCollection("JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR");
var range = 365;
var start_date = ee.Date('2020-01-01');
var end_date = start_date.advance(range, 'day');

var s1 = sentinel1.filterDate(start_date, end_date);

var vh = s1
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filterMetadata('instrumentMode', 'equals', 'IW'); // Ensuring IW mode

var vhAscending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
var vhDescending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

var VVamax = ee.Image.cat([
  vhAscending.select('VV').max()
]).focal_median();

var VVdmax = ee.Image.cat([
  vhDescending.select('VV').max()
]).focal_median();

var VVamin = ee.Image.cat([
  vhAscending.select('VV').min()
]).focal_median();

var VVdmin = ee.Image.cat([
  vhDescending.select('VV').min()
]).focal_median();


var VHamax = ee.Image.cat([
  vhAscending.select('VH').max()
]).focal_median();

var VHdmax = ee.Image.cat([
  vhDescending.select('VH').max()
]).focal_median();

var VV1 = VVamax.subtract(VVdmax);
var VV12 = VVamax - VVdmax
var VV2 = VVdmax.subtract(VVamax);

var VH1 = VHamax.subtract(VHdmax);
var VH2 = VHdmax.subtract(VHamax);

var VV3 = VVamin.subtract(VVamax);
var VV4 = VVamax - VVamin;

/*var compositeVH = ee.Image.cat([
  vhAscending.select('VH').max(),
  vhDescending.select('VH').max()
]).focal_median();*/

// 12 vide
// 3 bandes

var WorkingBand = VH1
// Display as separate composites.
//Map.addLayer(VV1, {min: -25, max: 0}, 'VV1');
//Map.addLayer(VV2, {min: -25, max: 0}, 'VV2');
/*Map.addLayer(VV3, {min: -25, max: 0}, 'VV3');
Map.addLayer(VV4, {min: -25, max: 0}, 'VV4');*/
Map.addLayer(VH1, {min: -25, max:0}, "VH1")
Map.addLayer(VH2, {min: -25, max:0}, "VH2")
//Map.addLayer(VVamin, {min: -25, max: 0}, "VVadmin")
//Map.addLayer(VH1, {min: -25, max: 0}, 'VH1');
//Map.addLayer(VH2, {min: -25, max: 0}, 'VH2');
//Map.addLayer(compositeVH, {min: -25, max: 0}, 'VH composite');

var FilteredBand = WorkingBand.updateMask(WorkingBand.lte(-10))

var B = FilteredBand;

Map.addLayer(FilteredBand, {min: -25, max: 0}, 'FilteredBand');

var snic = ee.Algorithms.Image.Segmentation.SNIC({
  image: B,
  size: 80,
  compactness: 1,
  connectivity: 8,
});

var segments = snic.select('clusters');

var currentMapView = Map.getBounds(true);

var polygons = segments.reduceToVectors({
  geometry: currentMapView, 
  scale: 200,
  geometryType: 'polygon',
  eightConnected: true,
  bestEffort: true,
  tileScale: 4
});

Map.addLayer(polygons, {}, 'segments');

var rectangles = polygons.map(function(polygon) {
  var bounds = polygon.bounds();
  return ee.Feature(bounds);
});

var rectangleCoords = rectangles.map(getRectangleCoordinates);

Map.addLayer(rectangles, {}, "rectangles")

function getRectangleCoordinates(rectangle) {
  var geom = rectangle.geometry();
  if (geom) {
    var coords = ee.List(geom.bounds().coordinates().get(0));
    var upperLeft = ee.List(coords.get(0));
    var lowerRight = ee.List(coords.get(2));

    var upperLeftCoord = ee.Dictionary({
      lon: upperLeft.get(0),
      lat: upperLeft.get(1)
    });
    var lowerRightCoord = ee.Dictionary({
      lon: lowerRight.get(0),
      lat: lowerRight.get(1)
    });

    return ee.Dictionary({upperLeft: upperLeftCoord, lowerRight: lowerRightCoord});
  }
  return null;
}

function drawCircleFromRectangle(rectangleCoords) {
  if (rectangleCoords) {
    var upperLeft = ee.Dictionary(rectangleCoords.get('upperLeft'));
    var lowerRight = ee.Dictionary(rectangleCoords.get('lowerRight'));

    var centerX = ee.Number(upperLeft.get('lon')).add(ee.Number(lowerRight.get('lon')).subtract(upperLeft.get('lon')).divide(3));
    var centerY = ee.Number(upperLeft.get('lat')).subtract(ee.Number(upperLeft.get('lat')).subtract(lowerRight.get('lat')).divide(3));
    var center = ee.Geometry.Point([centerX, centerY]);

    return center.buffer(3000);
  }
  return null;
}

var circles = rectangles.map(function(rectangle) {
  var coords = getRectangleCoordinates(rectangle);
  return drawCircleFromRectangle(coords);
});

Map.addLayer(ee.FeatureCollection(circles), {color: 'red'}, 'Circles');