#!/usr/bin/node

const http = require("http");
const node_static = require("node-static");

const mongo = require("mongodb").MongoClient;

let server_url = "mongodb://localhost:27017";

let chat_db;

mongo.connect(server_url, (err, server) => {
	if (err){
		console.log("Error en la conexión a MongoDB");
		throw err;
	}

	console.log("Dentro de MongoDB");

	chat_db = server.db("amongmeme");
});



console.log("Inicializando servidor chat");


let public_files = new node_static.Server("pub");

http.createServer( (request, response) => {
	if (request.url.startsWith("/chat")){
		let info = request.url.split("=");
		console.log(info[1]);
		
		let query = {
			date : { $gt : parseInt(info[1]) }
		};

		let cursor = chat_db.collection("chat").find(query);

		cursor.toArray().then( (data) => {
			response.writeHead(200, {'Content-Type': 'text/plain'});

			response.write( JSON.stringify(data) );

			response.end();
		});

		return;
	}


	if (request.url == "/recent"){
		const estimated_count = chat_db.collection("chat").estimatedDocumentCount();
	
		estimated_count.then( (count) => {
			console.log(count);

			const MAX = 5;

			let cursor = chat_db.collection("chat").find({}, {
					skip: count - MAX,
					limit: MAX,
					sort: { $natural:1 }
				});
	
			cursor.toArray().then( (data) => {
				response.writeHead(200, {'Content-Type': 'text/plain'});

				response.write( JSON.stringify(data) );

				response.end();
			});

		});

		return;
	}




	if (request.url == "/submit"){
		console.log("Envío de datos");

		let body = [];
		request.on('data', (chunk) => {

			body.push(chunk);

		}).on('end', () => {
			
			let chat_data = JSON.parse(Buffer.concat(body).toString());

			chat_db.collection("chat").insertOne({
				user: chat_data.chat_user,
				msg: chat_data.chat_msg,
				date: Date.now()
			});			 

		});

		response.end();

		return;
	}
	if (request.url =="/history"){

		response.writeHead(200, {'Content-Type': 'text/plain'});

		let cursor = chat_db.collection("chat").find().sort({ date: -1 });
		let person= "";

		cursor.toArray().then((data)=>{

		for (let i = 0; i < data.length; i++) {

		let date = data[i].date;
		date = Number(date);
		date= new Date(date);

			
			
			
			let finalDate = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + "  " + date.getHours() + ":" + date.getMinutes();
			person= "(" + finalDate +")"+ data[i].user + " : " + data[i].msg; 
			
			response.write (JSON.stringify(person) + "\n");}
			response.end();
		});
		return
	}


	public_files.serve(request, response);

}).listen(8080);
