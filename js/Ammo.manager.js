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

    var isBuffer = true;
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

    var isInit = false;
    var isRunning = false;

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
        view.add({ type:'sphere', size:[6], name:'ball', pos:[0,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[10,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[-10,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[-20,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });
        //view.add({ type:'sphere', size:[6], pos:[20,6,20], mass:3, state:4, friction:0.5, restitution:0.9 });

        ammo.initSkeleton();

    };

    ammo.addBall = function(){
        if(!isRunning) return;
        view.add({ type:'sphere', size:[6], name:'ball',  pos:[0,30,20], mass:3, state:4, friction:0.5, restitution:0.9 });
    };

    ammo.initSkeleton = function(){

    
        var i = avatar.bones.length - 30 , bone, name, ln;

        while(i--){

            bone = avatar.bones[i];
            name = bone.name;

            //if(name === 'Head') console.log( bone.rotation )//ammo.addPart(name, i); 

            console.log(name, i)

            if(name !== 'Bone001' && name !== 'Hips' && name !== 'LeftBreast' && name !== 'RightBreast' && name !== 'LeftToe' && name !== 'RightToe'  && name !== 'LeftKnee' && name !== 'RightKnee'){

                ln = 5;
                //if( bone.children[0]  ) ln = ammo.distance(bone.position, bone.children[0].position );
                 if( bone.parent  ) ln = ammo.distance( bone.parent.position, bone.position );

                boneDecal[i] = [ln*0.5];
               
                if( name === 'Head' )view.add({ type:'sphere', size:[2], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
                else view.add({ type:'cylinder', size:[2, ln, 2], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
            }
        

        }

        isRunning = true;

    };

    ammo.distance = function( v1, v2 ){
        var d = v2.clone().sub(v1);
        return Math.sqrt( d.x * d.x + d.y * d.y + d.z * d.z );

    };

    ammo.addPart = function( name, id ){

        view.add({ type:'sphere', size:[6], pos:[0,100,0], name:id, mass:3, state:4, friction:0.5, restitution:0.9 })
        //bonesRef[name] = 

    };

    ammo.updateSkeleton = function(){

        if(!isRunning) return;

        var i = avatar.bones.length  - 30 , bone;
        var n;
        var r = bonesAr;
        var pos = new THREE.Vector3();
        var quat = new THREE.Quaternion();
        var mtx = new THREE.Matrix4();
        var mtxBone = new THREE.Matrix4();

        while(i--){

            if(i !== 4 && i !== 0 && i !== 14 && i !== 16 && i !== 20 && i !== 17 && i !== 8 && i !== 5   ){
                n = i * 8;

                bone = avatar.bones[i];
                mtxBone = bone.matrixWorld.clone();

                mtx.identity() ;//= new THREE.Matrix4();
                //mtx.makeTranslation(boneDecal[i][1], 0, 0);
                mtx.makeRotationZ( Math.PI*0.5 );
                mtxBone.multiply( mtx );

                mtx.identity() ;//= new THREE.Matrix4();
                mtx.makeTranslation(0, boneDecal[i][0], 0);
                //mtx.makeRotationZ( Math.PI*0.5 );
                mtxBone.multiply( mtx );

                //

                pos.setFromMatrixPosition( mtxBone );// = bone.getWorldPosition();

                r[n] = pos.x * 0.1;
                r[n+1] = pos.y * 0.1;
                r[n+2] = pos.z * 0.1;

                quat.setFromRotationMatrix( mtxBone );//setFromEuler( bone.rotation );

                r[n+3] = quat.x;
                r[n+4] = quat.y;
                r[n+5] = quat.z;
                r[n+6] = quat.w;
            }
                
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

            delay = ~~ ( timerate - ( time - sendTime ));
            delay = delay < 0 ? 0 : delay;



            

            

            

            //view.update( ar, dr, hr, jr, sr );
            timer = setInterval( sendData, delay );

            if( view ) view.update();

            //view.bodyStep();
            //view.heroStep();
            //view.carsStep();
            //view.softStep();

            //timer = setTimeout( sendData , delay );

        }

    };

    function sendData(){

        clearTimeout(timer);
        //clearInterval( timer );
        sendTime = performance.now();//now();

        //user.update();
        var key = [];//user.getKey();

        if( isBuffer ) worker.postMessage( { m:'step', key:key, bonesAr:bonesAr, Br:Br, Jr:Jr } , [ Br.buffer, Jr.buffer ] );
        else worker.postMessage( { m:'step', key:key, bonesAr:bonesAr } );

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