/**   _   _____ _   _   
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*    AMMO worker ultimate manager
*/

'use strict';

// main transphere array for worker
var Br, Jr;

var ammo = ( function () {

    var worker, callback;

    var isBuffer = false;
    var timestep = 0.017;//1/60;
    var substep = 6;//7;

    var extractor;// = new EXTRACT.Pool();

    // main transphere array
    //var ar, dr, hr, jr, sr;

    var timerate = timestep * 1000;

    var boneDecal = [];
    
    
    var sendTime = 0;
    var delay = 0;

    var time = 0;
    var temp = 0;
    var count = 0;
    var fps = 0;

    var timer = 0;
    var needDelete = true;

    var bonesRef = {};
    var bonesAr = new Float32Array( 29*8 );
    //var bonesAr = new Float32Array( 80*8 )

    var isInit = false;
    var isRunning = false;

    var skeleton;

    ammo = function () {};

    ammo.init = function ( direct ) {

        if( isInit ){ this.demo(); return; }

        view.init();

        this.loadCompress();

        //this.startWorker( true );

        
    };

    ammo.loadCompress = function () {

        extractor = new EXTRACT.Pool();// ['js/ammo.z'], ammo.startWorker, [1] );
        extractor.load( 'js/ammo.z', 1, ammo.startWorker );

    };

    ammo.startWorker = function( direct ){

        //console.log('start')



        worker = new Worker('js/Ammo.worker.js');

        worker.onmessage = ammo.message;
        worker.postMessage = worker.webkitPostMessage || worker.postMessage;

        var blob;

        if( direct ){
            blob = document.location.href.replace(/\/[^/]*$/,"/") + "js/ammo/ammo.js";
            needDelete = false;
        }else{
            blob = extractor.get('ammo');
        }

        //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr });
        //worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });
        worker.postMessage( { m: 'init', blob:blob, isBuffer: isBuffer, timestep:timestep, substep:substep });

    };

    ammo.demo = function() {

        //view.activeRay( ammo.rayMove );

        //view.add({ type:'plane', friction:0.5, restitution:0.9 }); // infinie plane

        var w = 140;
        var p = 100;
        var h = 160;
        
        var m = 10;
        var mi = m * 0.5;
        var y = -2;

        view.add({ type:'box', size:[w+m, m, p+m], pos:[0,-(m*0.5) + y,0], friction:0.5, restitution:0.9 });
        view.add({ type:'box', size:[w+m, m, p+m], pos:[0,h+(m*0.5) + y,0], friction:0.5, restitution:0.9 });

        view.add({ type:'box', size:[m, h, p+m], pos:[-w*0.5,(h*0.5)+y,0], friction:0.5, restitution:0.9 });
        view.add({ type:'box', size:[m, h, p+m], pos:[w*0.5,(h*0.5)+y,0], friction:0.5, restitution:0.9 });
        view.add({ type:'box', size:[w-m, h, m], pos:[0,(h*0.5)+y,-p*0.5], friction:0.5, restitution:0.9 });
        view.add({ type:'box', size:[w-m, h, m], pos:[0,(h*0.5)+y, p*0.5], friction:0.5, restitution:0.9 });

        


        //view.add({type:'box', size:[6], name:'bob', mass:10, flag:2, state:4 });
        //view.add({ type:'cylinder', size:[3, 12, 3], name:'bob', mass:10, flag:2, state:4, friction:0.5, restitution:0.5 });
       // view.add({ type:'sphere', size:[6], name:'ball', pos:[0,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[10,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[-10,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[-20,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[20,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });

       // ammo.initSkeleton();


        skeleton = new ammo.skeleton( avatar );
        skeleton.init();

        isRunning = true;


        ammo.addBall();

        sendData();

    };

    ammo.addBall = function(){
        if(!isRunning) return;
        view.add({ type:'ball', size:[6], name:'ball',  pos:[0,30,20], mass:3, state:4, friction:0.5, restitution:0.9 });
    };

    ammo.addPart = function( name, id ){

        var x = -0.5 + Math.random();
        var z = -0.5 + Math.random();
        view.add({ type:'sphere', size:[6], pos:[x,100,z], name:id, mass:1, state:4, friction:0.5, restitution:0.9 })
        //bonesRef[name] = 

    };

    ammo.updateSkeleton = function(){

        if(skeleton){ 
            skeleton.update();
        }

    };

    ammo.rayMove = function  ( m ) {

        var o = {
            name:'bob',
            pos:[m.position.x*0.1, m.position.y*0.1, m.position.z*0.1],
            quat: m.quaternion.toArray()
        }

        ammo.send( 'set', o );

    };

    ammo.message = function( e ) {

        var m = e.data.m;
       

        if(m === 'init'){

            if( needDelete ) extractor.clearBlob('ammo');
            //if( callback ) callback();
            ammo.demo();
            isInit = true;

        }

        //if(m === 'ellipsoid'){ view.ellipsoidMesh( e.data.o );  }

        if(m === 'step'){

            //ammo.updateSkeleton();

            time = performance.now();//now();
            //if ( (time - 1000) > temp ){ temp = time; fps = count; count = 0; }; count++;
            
            Br = e.data.Br;
            //Cr = e.data.Cr;
            //Hr = e.data.Hr;
            Jr = e.data.Jr;
            //Sr = e.data.Sr;

            // delay
            //delay = ( timerate - ( time - sendTime ) ).toFixed(2);
            //if(delay < 0) delay = 0;

            //delay = ~~ ( timerate - ( time - sendTime ));
            //delay = delay < 0 ? 0 : delay;



            

            

            

            //view.update( ar, dr, hr, jr, sr );
            //timer = setInterval( sendData, delay );

            if( view ) view.update();

            //view.bodyStep();
            //view.heroStep();
            //view.carsStep();
            //view.softStep();

            //timer = setTimeout( sendData , delay );

        }

    };

    function sendData(){

        requestAnimationFrame( sendData );

        //clearTimeout(timer);
        //clearInterval( timer );
        //sendTime = performance.now();//now();

        //user.update();
        var key = [];//user.getKey();

        if(skeleton){
            if( isBuffer ) worker.postMessage( { m:'step', key:key, bonesAr:skeleton.data, Br:Br, Jr:Jr } , [ Br.buffer, Jr.buffer ] );
            else worker.postMessage( { m:'step', key:key, bonesAr:skeleton.data } );
        } else {
            if( isBuffer ) worker.postMessage( { m:'step', key:key, bonesAr:[], Br:Br, Jr:Jr } , [ Br.buffer, Jr.buffer ] );
            else worker.postMessage( { m:'step', key:key, bonesAr:[] } );
        }

        

        //if( isBuffer ) worker.postMessage( { m:'step', key:key, Br:Br, Cr:Cr, Hr:Hr, Jr:Jr, Sr:Sr } , [ Br.buffer, Cr.buffer, Hr.buffer, Jr.buffer, Sr.buffer ] );
        //else worker.postMessage( { m:'step', key:key } );

        //var f = view.getFps();
        //tell( 'THREE '+ f + ' | AMMO ' + fps +' | '+ delay +'ms' );

        //debugTell( )

        //tell( key );
        
    };

    ammo.send = function ( m, o ) {

        worker.postMessage( { m:m, o:o });

    }

    ammo.reset = function( full ) {

        isRunning = false;

        worker.postMessage( { m:'reset', full:full });
        view.reset();

    };

    return ammo;

})();