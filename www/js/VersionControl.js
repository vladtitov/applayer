/**
 * Created by Vlad on 8/13/2016.
 */
///<reference path="../../typings/jquery/jquery.d.ts"/>
///<reference path="../../typings/cordova/cordova.d.ts"/>
var MySorageDirectory;
var $applicationContainer;
var MyApplicationLoadHTML = function (url) {
    url = MySorageDirectory + url;
    console.log('to load ' + url);
    $applicationContainer.load(url);
};
var loadMyScript = function (url) {
    url = MySorageDirectory + url;
    $.getScript(url, function (data, textStatus, jqxhr) {
        /// console.log( data ); // Data returned
        console.log(textStatus);
        console.log(jqxhr.status);
        console.log("Load was performed.js/login.js ");
        // this.player =  new htplayer.PlayerController()
    });
};
var uplight;
(function (uplight) {
    var FileLoader = (function () {
        function FileLoader(filepath, server, directory) {
            var _this = this;
            this.filepath = filepath;
            var fileTransfer = new FileTransfer();
            var url = encodeURI(server + filepath);
            var dest = directory + filepath;
            // console.log(url);
            fileTransfer.download(url, dest, function (entry) {
                _this.destination = entry.toURL();
                _this.onComplete(_this);
                console.log("download complete: " + _this.destination);
            }, function (error) {
                console.log(error);
                _this.onError(_this, error);
            }, false, {
                headers: {
                    "Authorization": "Basic HEROtechdGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                }
            });
        }
        FileLoader.prototype.destroy = function () {
            this.onComplete = null;
            this.onError = null;
        };
        return FileLoader;
    }());
    uplight.FileLoader = FileLoader;
    var VersionControl = (function () {
        function VersionControl() {
            var _this = this;
            $applicationContainer = $('#MyContainer');
            var server = 'http://192.168.1.10:56888/';
            this.myversion = {
                version: '0.0.0',
                download: [],
                start: 'welcome.html',
                server: server
            };
            this.loadAppStorageDirectory(function (files) {
                //  console.log(files);
                var ar = files.filter(function (item) { return item.name == 'version.json'; });
                if (ar.length) {
                    ar[0].file(function (file) {
                        var reader = new FileReader();
                        reader.onloadend = function (evt) {
                            _this.myversion = JSON.parse(evt.target.result);
                            if (!_this.myversion.server)
                                _this.myversion.server = server;
                            _this.loadServerVersion();
                        };
                        reader.readAsText(file);
                    });
                }
                else
                    _this.loadServerVersion();
                // this.storageDirectory.
                // console.log(this.storageDirectory);
            });
            /*  this.loadDirectory(()=>{
                  console.log(this.appfiles);
                  console.log(this.appDirectory );
                  var file:FileEntry = this.getAppFileRef('version.json');
                  if(file){
                      file.file((file)=> {
                          var reader = new FileReader();
                          reader.onloadend = (evt:any)=> {
                              this.myversion = JSON.parse(evt.target.result);
                              if(!this.myversion.server)this.myversion.server = server;
  
                              this.loadServerVersion();
                          }
                          reader.readAsText(file);
                      });
  
                  }else  this.loadServerVersion()
              });*/
        }
        VersionControl.prototype.loadServerVersion = function () {
            var _this = this;
            var vers = this.myversion ? this.myversion.version : '0.0.0';
            console.log('current version ' + vers);
            $.get(this.myversion.server + 'version/' + vers).done(function (res) {
                if (res && res.download && res.download.length) {
                    var download = res.download;
                    _this.myversion = res;
                    console.log('new  version ' + _this.myversion.version);
                    _this.downloadAppFiles();
                }
                else {
                    console.log('nothing  to download');
                    _this.startApplication();
                }
            });
        };
        VersionControl.prototype.loadAppStorageDirectory = function (callBack) {
            var _this = this;
            window.requestFileSystem(window.PERSISTENT, 0, function (fs) {
                fs.root.getDirectory('myapp', { create: true }, function (dir) {
                    _this.appStorageDirectory = dir;
                    MySorageDirectory = dir.toURL();
                    dir.createReader().readEntries(function (res) {
                        callBack(res);
                    });
                });
            }, function (err) { return _this.onError(err); });
        };
        VersionControl.prototype.getAppFileRef = function (filename) {
            var f;
            this.appfiles.forEach(function (entry) {
                if (entry.name == filename)
                    f = entry;
            });
            return f;
        };
        /*  loadDirectory(callBack:Function):void{
              this.getFolderEbtry('myapp',
                  (dir:DirectoryEntry,files:FileEntry[])=>{
                      this.appfiles = files
                      this.appDirectory = dir
                      callBack();
                  },
                  err=>this.onError(err)
              )
          }*/
        VersionControl.prototype.onError = function (err) {
            console.error(err);
        };
        /* getFolderEbtry(folder:string,callBack:Function,onError:(err:FileError)=>void):void{
             window.requestFileSystem(window.PERSISTENT, 0, (fs) =>{
                 fs.root.getDirectory(folder,{create:true},(dir:DirectoryEntry)=>{
                     dir.createReader().readEntries((res:FileEntry[])=>{
                         callBack(dir,res)
                         }
                         ,error=>{ console.log('error read files')}
                     )
 
                 })
                 ;
 
             },onError);
         }*/
        /* getAppFile(filename:string,dataObj:any,callBack:Function){
             window.requestFileSystem(window.PERSISTENT, 0, function (fs) {
 
             },err=>callBack(err));
         }*/
        VersionControl.prototype.saveAppFile = function (filename, dataObj, callBack) {
            this.appStorageDirectory.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onwriteend = function () { callBack(); };
                    fileWriter.onerror = function (e) {
                        callBack(e);
                    };
                    fileWriter.write(dataObj);
                });
            }, function (err) { return callBack(err); });
        };
        VersionControl.prototype.showError = function (err) {
            alert(JSON.parse(err));
        };
        VersionControl.prototype.onDownloadComplete = function () {
            var _this = this;
            if (this.errors.length)
                console.error(this.errors);
            this.saveAppFile('version.json', JSON.stringify(this.myversion), function (err) {
                if (err)
                    _this.showError(err);
                else {
                    _this.startApplication();
                }
            });
        };
        VersionControl.prototype.startApplication = function () {
            var url = this.myversion.start;
            console.log('starting   ' + url);
            MyApplicationLoadHTML(url);
            /* MyApplicationDirectory = this.appDirectory.toURL();
             console.log('staring '+this.myversion.start);
 
             console.log(window.location.pathname);
            // this.loadPlayer();
             console.log(url);
            */
            //window.location.href =  url+'?callback='+encodeURI(window.location.pathname);
        };
        VersionControl.prototype.removeLoader = function (loader) {
            var ind = this.downloading.indexOf(loader);
            if (ind !== -1)
                this.downloading.splice(ind, 1);
            loader.destroy();
        };
        VersionControl.prototype.onLoaderComplte = function (loader) {
            this.removeLoader(loader);
            if (this.downloading.length === 0)
                this.onDownloadComplete();
        };
        VersionControl.prototype.onLoaderError = function (loader) {
            this.errors.push('loading ' + loader.destination);
            this.removeLoader(loader);
            if (this.downloading.length === 0)
                this.onDownloadComplete();
        };
        VersionControl.prototype.downloadAppFiles = function () {
            var _this = this;
            var files = this.myversion.download;
            console.log('start download ', files);
            var out = [];
            var server = this.myversion.server;
            var dir = this.appStorageDirectory.toURL();
            files.forEach(function (path) {
                var loader = new FileLoader(path, server, dir);
                loader.onComplete = function (loader) { return _this.onLoaderComplte(loader); };
                loader.onError = function (loader) { return _this.onLoaderError(loader); };
                out.push(loader);
            });
            this.errors = [];
            this.downloading = out;
        };
        return VersionControl;
    }());
    uplight.VersionControl = VersionControl;
})(uplight || (uplight = {}));
//# sourceMappingURL=VersionControl.js.map