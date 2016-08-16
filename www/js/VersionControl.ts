/**
 * Created by Vlad on 8/13/2016.
 */
///<reference path="../../typings/jquery/jquery.d.ts"/>

    ///<reference path="../../typings/cordova/cordova.d.ts"/>

var MySorageDirectory:string;

var $applicationContainer:JQuery;


var  MyApplicationLoadHTML= function(url:string){
        url = MySorageDirectory+url;
    console.log('to load '+url);
    $applicationContainer.load(url);
}


var loadMyScript = function(url:string){
    url= MySorageDirectory+url;
    $.getScript(url,function ( data, textStatus, jqxhr ){
        /// console.log( data ); // Data returned
        console.log( textStatus );
        console.log( jqxhr.status );
        console.log( "Load was performed.js/login.js " );
        // this.player =  new htplayer.PlayerController()

    });
}



module uplight{
    interface MyVesrion{
        version:string;
        download:string[];
        start:string;
        server:string;
    }


    export class FileLoader{

        onComplete:Function;
        onError:Function;
       destination:string;


        destroy():void{
            this.onComplete = null;
            this.onError = null;
        }

        constructor(public filepath:string,server:string,directory:string){
            var fileTransfer = new FileTransfer();
            var url = encodeURI(server+filepath);
             var dest:string = directory+filepath;

           // console.log(url);

            fileTransfer.download(
                url,
                dest,
                (entry:FileEntry) =>{
                    this.destination = entry.toURL();
                    this.onComplete(this);
                    console.log("download complete: " + this.destination);
                },
                (error)=> {
                    console.log(error);
                    this.onError(this,error);
                },
                false,
                {
                    headers: {
                        "Authorization": "Basic HEROtechdGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
                    }
                }
            );



        }


    }

    export class VersionControl{
        myversion:MyVesrion;
        appfiles:FileEntry[];
        appStorageDirectory:DirectoryEntry;
       // appDirectory:DirectoryEntry;
        $container:JQuery;

        constructor(){
            $applicationContainer =   $('#MyContainer');
            var server:string ='http://192.168.1.10:56888/';
            this.myversion ={
                version:'0.0.0',
                download:[],
                start:'welcome.html',
                server:server
            }


            this.loadAppStorageDirectory((files:FileEntry[])=>{
              //  console.log(files);
                var ar:FileEntry[] =files.filter((item:FileEntry)=>{return item.name =='version.json';})

                if(ar.length){
                    ar[0].file((file:File)=> {
                        var reader = new FileReader();
                        reader.onloadend = (evt:any)=> {
                            this.myversion = JSON.parse(evt.target.result);
                            if(!this.myversion.server)this.myversion.server = server;
                            this.loadServerVersion();
                        }
                        reader.readAsText(file);
                    });
                }else this.loadServerVersion();

               // this.storageDirectory.
               // console.log(this.storageDirectory);

            })


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


        loadServerVersion():void{
            var vers:string = this.myversion?this.myversion.version:'0.0.0';
            console.log('current version '+vers);

            $.get(this.myversion.server+'version/'+vers).done(
                (res:MyVesrion)=>{

                    if(res && res.download && res.download.length){
                        var download :string[] = res.download;
                        this.myversion = res;
                        console.log('new  version '+this.myversion.version)
                        this.downloadAppFiles();
                    }else{
                        console.log('nothing  to download')
                        this.startApplication();
                    }
                }

            )
        }

        loadAppStorageDirectory(callBack:Function):void{
            window.requestFileSystem(window.PERSISTENT, 0, (fs:FileSystem) =>{
                fs.root.getDirectory('myapp',{create:true},(dir:DirectoryEntry)=>{
                    this.appStorageDirectory = dir;
                    MySorageDirectory= dir.toURL();
                    dir.createReader().readEntries((res:FileEntry[])=>{
                        callBack(res)
                    });
                })

            },err=>this.onError(err));
        }




        getAppFileRef(filename:string):FileEntry{
            var f:FileEntry;
            this.appfiles.forEach(function(entry:FileEntry){
                if(entry.name== filename) f= entry;
            })
            return f;
        }



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


        onError(err):void{
            console.error(err);
        }


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


        saveAppFile(filename:string,dataObj:any,callBack:Function){
                this.appStorageDirectory.getFile(filename, { create: true, exclusive: false }, function (fileEntry) {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function() { callBack();  };

                        fileWriter.onerror = function (e) {
                            callBack(e);
                        };

                        fileWriter.write(dataObj);
                    });

                },err=>callBack(err));

        }


        showError(err:any):void{
           alert(JSON.parse(err));
        }

        onDownloadComplete():void{
            if(this.errors.length)console.error(this.errors);

            this.saveAppFile('version.json',JSON.stringify(this.myversion),(err)=>{
                if(err)this.showError(err)
                else{
                    this.startApplication();
                }
            })

        }


        startApplication():void{
            var url = this.myversion.start;

            console.log('starting   '+url);
            MyApplicationLoadHTML(url);
           /* MyApplicationDirectory = this.appDirectory.toURL();
            console.log('staring '+this.myversion.start);

            console.log(window.location.pathname);
           // this.loadPlayer();
            console.log(url);
           */

          //window.location.href =  url+'?callback='+encodeURI(window.location.pathname);
    }

        removeLoader(loader:FileLoader):void{
            var ind = this.downloading.indexOf(loader);
            if(ind!==-1)this.downloading.splice(ind,1);

            loader.destroy();
        }

        playerpath:string

        onLoaderComplte(loader:FileLoader):void{
            this.removeLoader(loader);
            if(this.downloading.length ===0)this.onDownloadComplete();
        }



        private errors:string[];

        onLoaderError(loader:FileLoader):void{
           this.errors.push('loading '+loader.destination);
            this.removeLoader(loader);
            if(this.downloading.length ===0)this.onDownloadComplete();
        }

        downloading:FileLoader[];



        downloadAppFiles():void{
            var files:string[] = this.myversion.download;

            console.log('start download ',files);
            var out:FileLoader[]=[];
            var server:string = this.myversion.server;
            var dir:string = this.appStorageDirectory.toURL();

            files.forEach( (path: string)=> {
                var loader:FileLoader = new FileLoader(path,server,dir);
                loader.onComplete = (loader:FileLoader)=>this.onLoaderComplte(loader);
                loader.onError = (loader:FileLoader)=>this.onLoaderError(loader);
                out.push(loader);
            })

            this.errors = [];
            this.downloading = out;
        }



}
}


