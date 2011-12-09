exports.MarketOrderParser= function(data){
	return {price:data[0],
	  volRemaining:data[1],
	  typeID:data[2],
	  range:data[3],
	  orderID:data[4],
	  volEntered:data[5],
	  minVolume:data[6],
	  bid:data[7],
	  issued:data[8],
	  duration:data[9],
	  stationID:data[10],
	  regionID:data[11],
	  solarSystemID:data[12]}
}
