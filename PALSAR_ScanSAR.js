<<<<<<< HEAD
var collection = ee.ImageCollection('JAXA/ALOS/PALSAR-2/Level2_2/ScanSAR')


var range = 365; 
var start_date = ee.Date('2015-01-01');
var end_date = start_date.advance(range, 'day');


var HH = collection.select(['HH']).filterDate(start_date, end_date);



var hhA = HH.filter(ee.Filter.eq('PassDirection', 'Ascending'));
var hhD = HH.filter(ee.Filter.eq('PassDirection', 'Descending'));



var HHAmax = ee.Image.cat([
  hhA.max()
]).focal_median();

var HHDmax = ee.Image.cat([
  hhD.max()
]).focal_median();

var HHDmin = ee.Image.cat([
  hhD.min()
]).focal_median();


var stract = HHAmax.subtract(HHDmin)

Map.addLayer(stract, {min: 0, max: 8000}, 'HHA - D');
Map.addLayer(HHAmax, {min: 0, max: 8000}, 'HHD');
Map.addLayer(HHDmax, {min: 0, max: 8000}, 'HHD');
=======

>>>>>>> ef79ecdd1cc5b2db5d056616bcb24aa19dd988f7
