exports.MarketOrderDepackCsv= function(data){
	if(data.length != 14){ // the one data-consistency check we'll bother making
		return
	}
	return {price:parseFloat(data[0]),
	  volRemaining:parseFloat(data[1]),
	  typeID:parseInt(data[2]),
	  range:parseInt(data[3]),
	  orderID:parseInt(data[4]),
	  volEntered:parseInt(data[5]),
	  minVolume:parseInt(data[6]),
	  bid:data[7]=="True",
	  issued:Date.parse(data[8]),
	  duration:parseInt(data[9]),
	  stationID:parseInt(data[10]),
	  regionID:parseInt(data[11]),
	  solarSystemID:parseInt(data[12])}
}

exports.MarketOrderDepackCsvRaw= function(data){
	if(data.length != 14){ // the one data-consistency check we'll bother making
		return
	}
	return {price:data[0],
	  volRemaining:data[1],
	  typeID:data[2],
	  range:data[3],
	  orderID:data[4],
	  volEntered:data[5],
	  minVolume:data[6],
	  bid:data[7]=="True"?1:0,
	  issued:Date.parse(data[8]),
	  duration:data[9],
	  stationID:data[10],
	  regionID:data[11],
	  solarSystemID:data[12]}
}

