var http = require("http");
var url = require("url");
var fs = require("fs");
var port = 8090;
var host = "localhost";
var status = 0;
const google = require('googleapis');
const drive = google.drive('v3');
// update this to point to your service account key
const key = require('./credentials.json');
var formidable = require("formidable");
const path = require('path');
// Target forlder for the Uploaded file. This must be shared with the service account.
const targetFolderId = '1vITtcPc7J0FpX2kPRFyqW38g32gNXOkH';

// location of the file to be uploaded

const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/drive'],
    null
  );
  
  function uploadFile(jwtClient) {
    const file = path.join(jwtClient.path);
    var stat = fs.statSync(file);
    var fileSizeInBytes = stat["size"];
    console.log(fileSizeInBytes);
    return new Promise((resolve, reject) => {
      var req = drive.files.create({
        auth: jwtClient.auth,
        resource: {
            name: 'try.mp4',
            parents: [targetFolderId]
          },
        media: {
            mimeType: 'video/mp4',
            body: fs.createReadStream(jwtClient.path),
            
          },
        fields: 'id'
      }, (err, response, body) =>{
        if (err) {
            reject(err)
        } else {
            console.log('finish upload'+response.id);
            // console.log("body ->"+body.id)
            clearInterval(q);
            resolve(response)
            
        }
    })
    
    var q = setInterval(function () {
      status = Math.floor((req.req.connection.bytesWritten/fileSizeInBytes )*100);   
      console.log("Uploaded: " + status);
         
     }, 300);
    });

  }
function authorizeJWT(path) {
  
    return new Promise((resolve, reject) => {
      jwtClient.authorize(function (err, tokens) {  // eslint-disable-line
        if (err) {
          reject(err);
        }
        resolve({"auth":jwtClient,"path":path});
      });
    });
  }

function authenticateAndUpload(path) {
  return new Promise((resolve,reject)=>{
    authorizeJWT(path)
    .then(uploadFile)
    .then((file) => {
      resolve(file);
    })
    .catch(err => reject(err));
  })  

  }
  
  http.createServer(function (req, res) {
    var path = url.parse(req.url, true);

    if(path.pathname.endsWith("")){
        fs.readFile("index.html", function(err, data){
            res.writeHead(200, "ok", { "Content-Type": "text/html"});
            res.write(data);
            res.end();
        });
    }
    /*else if(path.pathname.endsWith("js")){
        fs.readFile("." + path.pathname, function(err, data){
            res.writeHead(200, "ok", { "Content-Type": "text/javascript"});
            res.write(data);
            res.end();
        });
    } 
    else if(path.pathname.endsWith("css")){
        fs.readFile("." + path.pathname, function(err, data){
            res.writeHead(200, "ok", {"Content-Type": "text/css"});
            res.write(data);
            res.end();
        });
    
    }*/
    else if(path.pathname.endsWith("uploadFile") && req.method === "POST")
    {
       
        var form = new formidable.IncomingForm();

        form.parse(req, function (err, fields, files) {
            console.log(files);    
        var oldpath = files.filetoupload.path;
    
        authenticateAndUpload(oldpath)
        .then((file)=>{
          console.log("id->"+file.id)
        return  res.end(file.id);
        })
        })
    } 
    else if(path.pathname.endsWith("uploadFile") && req.method === "GET")
   {
      res.end(status.toString())
   }
}).listen(port, host);

