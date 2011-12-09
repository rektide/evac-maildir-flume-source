var fs= require("fs"),
	watchTree= require("watch-tree"),
	csv= require("csv"),
	flume= require("flume"),
	moParser= require("./parser").MarketOrderParser
	optimist= require("optimist")
		.usage("Usage: $0 -target [target] -p [port] -d [maildir]")
		.options("target", {alias: "t", default: "127.0.0.1", describe: "Flume target host to send to."})
		.options("port", {alias: "p", default: "37543", describe: "Port to send to."})
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
	//console.log("watched",name,isDir,isCreate)
	if(!event.isDirectory() && event.isCreate()) {

		// prep parser
		var parser= csv(),
		  notHot= 0
		parser.on("data",function(data,index){
			if(data.length != 14){ // the one data-consistency check we'll bother making
				//console.log(data)
				++notHot
				return
			}
			var entity= moParser(data)
			flumeLogger.log(entity)
		})
		parser.on("end",function(count){
			var ungood= notHot == 0 ? "" : notHot+" bad entries"
			console.log("extracted "+count+" entries from "+name+". "+ungood)
		})

		// read in headers first, then relay to csv
		var stream= fs.createReadStream(name,{encoding:'ascii',bufferSize:64*1024}),
		  terminalEol= false,
		  almostPrime= false,
		  fired= false
		var streamPrepper= function(data){
			var bodyStart= terminalEol?1:0 // beginning of message body
			if(almostPrime || terminalEol && data[0] == "\n" || (bodyStart= data.indexOf("\n\n")+2) > 1)
			{
				var firstStart= data.indexOf("\n",bodyStart)+1 // post-csv header line
				if(firstStart >= 0) {
					var remainder= data.substring(firstStart)
					parser.from(remainder) // will fire nextTick, before stream, right? :)
					parser.fromStream(stream)
					stream.removeListener("data",streamPrepper) // done prepping
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

		parser.on("error",function(error){
			console.error("csv parser error during",name,error)
		})
	}
})
