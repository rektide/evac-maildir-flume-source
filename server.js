var fs= require("fs"),
	watchTree= require("watch-tree"),
	csv= require("csv"),
	flume= require("flume"),
	marketOrderDepackCsv= require("./parser").MarketOrderDepackCsvRaw
	optimist= require("optimist")
		.usage("Usage: $0 -target [target] -p [port] -d [maildir]")
		.options("target", {alias: "t", default: "127.0.0.1", describe: "Flume target host to send to."})
		.options("port", {alias: "p", default: 37543, describe: "Port to send to."})
		.options("maildir", {alias: "d", default: ".maildir", describe: "Mail directory to watch."})
		.options("help", {alias: "h", describe: "Show usage help."}),
	argv= optimist.argv

if(argv.help) {
	optimist.showHelp()
	process.exit()
}

var maildir,
  base= argv.maildir,
  peHome= (process.env["HOME"] || ".")+"/"+base,
  maildirs= [base+"/cur", peHome+"/cur", base, peHome]
for(var i in maildirs)
{
	try {
		var attempt= maildirs[i]
		fs.statSync(attempt)
		maildir= attempt
		break
	} catch(ex) {
	}
}
if(maildir === undefined) {
	console.error("no maildir found")
	process.exit(1)
}
console.info("decided upon maildir:",maildir)

var target= argv.target,
  port= argv.port
var flumeLogger= new flume.FlumeLog(target,port)
console.info("decided upon flume logger:",target+":"+port)

var maildirWatch= watchTree.watchTree(maildir,function(event){
	var isDir= event.isDirectory(),
	  isCreate= event.isCreate(),
	  name= event.name
	if(!event.isDirectory() && event.isCreate()) {

		// prep csv parser
		var notHot = 0,
		  parser= csv()
		  .transform(marketOrderDepackCsv)
		  .on("data",function(data,index){
			if(!data) {
				//console.log(data)
				++notHot
				return
			}
			//console.log(data)
			flumeLogger.log("evec-order",data)
		  })
		  .on("end",function(count){
			var ungood= notHot == 0 ? "" : notHot+" bad entries"
			console.log("extracted "+count+" entries from "+name+". "+ungood)
		  })
		  .on("error",function(error){
			console.error("csv parser error during",name,error)
		  })

		// read in headers first, then relay to csv
		var stream= fs.createReadStream(name,{encoding:'utf8',bufferSize:64*1024}),
		  terminalEol= false,
		  almostPrime= false,
		  fired= false
		var streamPrepper= function(data){
			var bodyStart= terminalEol?1:0 // beginning of message body
			if(almostPrime || terminalEol && data[0] == "\n" || (bodyStart= data.indexOf("\n\n")+2) > 1)
			{
				var firstStart= data.indexOf("\n",bodyStart)+1 // post-csv header line
				if(firstStart >= 0) {
					parser.fromStream(stream)
					stream.removeListener("data",streamPrepper) // done prepping
					var remainder= data.substring(firstStart) // feed in this chunk
					stream.emit("data",remainder)
					fired= true
				} else {
					almostPrime= true
				}
			}
			terminalEol= data[data.length-1] == "\n"
		}
		stream.on("data", streamPrepper)
		stream.on("end", function(){
			if(!fired)
				console.error("never fired the csv parser during",name)
		})
	}
})
