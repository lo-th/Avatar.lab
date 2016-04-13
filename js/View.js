

'use strict';

var view = ( function () {

    var geo = {};
    var mat = {};
    var meshs = [];
    var statics = [];
    var byName = {};

    var ws = 10;
    var wsi = 1/ws;

    var content;
    var targetMouse;
    var raycaster; 
    var mouse;

    var rayCallBack;



    view = function () {};

    view.init = function ( callback ) {

        content = new THREE.Object3D();
        scene.add( content );

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        geo['box'] =  new THREE.BoxBufferGeometry(1,1,1);
        geo['sphere'] = new THREE.SphereBufferGeometry( 1, 12, 10 );
        geo['cylinder'] =  new THREE.CylinderBufferGeometry(1,1,1,12,1 );

        mat['basic'] = new THREE.MeshBasicMaterial({ color:0xffffff, name:'basic', wireframe:true });

    };

    //--------------------------------------
    //
    //   ADD
    //
    //--------------------------------------

    view.add = function ( o ) {

        //var isCustomGeometry = false;

        o.mass = o.mass == undefined ? 0 : o.mass;
        o.type = o.type == undefined ? 'box' : o.type;

        // position
        o.pos = o.pos == undefined ? [0,0,0] : o.pos;

        var pos = [o.pos[0], o.pos[1], o.pos[2]];
        o.pos = [o.pos[0]*wsi, o.pos[1]*wsi, o.pos[2]*wsi];
       // 

        // size
        o.size = o.size == undefined ? [1,1,1] : o.size;
        if(o.size.length == 1){ o.size[1] = o.size[0]; }
        if(o.size.length == 2){ o.size[2] = o.size[0]; }

        var size = o.size;
        o.size = [o.size[0]*wsi, o.size[1]*wsi, o.size[2]*wsi];


        if(o.geoSize){
            if(o.geoSize.length == 1){ o.geoSize[1] = o.geoSize[0]; }
            if(o.geoSize.length == 2){ o.geoSize[2] = o.geoSize[0]; }
        }

        // rotation is in degree
        o.rot = o.rot == undefined ? [0,0,0] : this.toRad(o.rot);
        o.quat = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( o.rot ) ).toArray();

        

        if(o.rotA) o.quatA = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotA ) ) ).toArray();
        if(o.rotB) o.quatB = new THREE.Quaternion().setFromEuler( new THREE.Euler().fromArray( this.toRad( o.rotB ) ) ).toArray();

        if(o.angUpper) o.angUpper = this.toRad( o.angUpper );
        if(o.angLower) o.angLower = this.toRad( o.angLower );

        var mesh = null;

        if(o.type.substring(0,5) == 'joint') {

            ammo.send( 'add', o );
            return;

        }

        if(o.type == 'plane'){
            //helper.position.set( o.pos[0], o.pos[1], o.pos[2] )
            ammo.send( 'add', o ); 
            return;
        }

        /*if(o.type == 'softTriMesh'){
            this.softTriMesh( o ); 
            return;
        }

        if(o.type == 'softConvex'){
            this.softConvex( o ); 
            return;
        }

        if(o.type == 'cloth'){
            this.cloth( o ); 
            return;
        }

        if(o.type == 'rope'){
            this.rope( o ); 
            return;
        }

        if(o.type == 'ellipsoid'){
            this.ellipsoid( o ); 
            return;
        }

        if(o.type == 'terrain'){
            this.terrain( o ); 
            return;
        }*/

        
        

        var material = mat.basic;
        //if(o.material !== undefined) material = mat[o.material];
        //else material = o.mass ? mat.move : mat.statique;
        
       
        /*if(o.geometry){
            if(o.geoRot || o.geoScale) o.geometry = o.geometry.clone();
            // rotation only geometry
            if(o.geoRot){ o.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler().fromArray(this.toRad(o.geoRot))));}

        
            // scale only geometry
            if(o.geoScale){ 
                o.geometry.applyMatrix( new THREE.Matrix4().makeScale( o.geoScale[0], o.geoScale[1], o.geoScale[2] ) );
                //material = mat['back'];//material.clone();
                //material.side = THREE.BackSide;
            }
        }*/
        

        mesh = new THREE.Mesh( o.geometry || geo[o.type], material );

        /*if( o.geometry ){
            extraGeo.push(o.geometry);
            mesh.scale.fromArray( o.geoSize );
            isCustomGeometry = true;
        }*/

        


       // if(mesh){

            mesh.scale.fromArray( size );

            mesh.position.fromArray( pos );
            mesh.quaternion.fromArray( o.quat );

            mesh.receiveShadow = true;
            mesh.castShadow = true;
            
            if( o.name !== undefined ){ 
                byName[o.name] = mesh;
                mesh.name = o.name;
            }

            scene.add( mesh );

            // push 
            if( o.mass ) meshs.push( mesh );
            else statics.push( mesh );
       
        

        // send to worker
        ammo.send( 'add', o );

    };

    view.activeRay = function ( callback ) {

        

        //isWithRay = true;

        var g = new THREE.PlaneBufferGeometry(1000,1000);
        //g.rotateX( -Math.PI90 );
        var zone = new THREE.Mesh( g,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0, depthTest:false, depthWrite:false }));
        content.add( zone );
        //moveplane.visible = false;

        targetMouse = new THREE.Mesh( geo['box'] ,  new THREE.MeshBasicMaterial({ color:0x00FF00 }));
        scene.add( targetMouse );

        canvas.addEventListener( 'mousemove', view.rayTest, false );

        rayCallBack = callback;

    };

    view.rayTest = function ( e ) {



        mouse.x = ( e.clientX  / vsize.x ) * 2 - 1;
        mouse.y = - ( e.clientY / vsize.y ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( content.children, true );

        if ( intersects.length) {
            targetMouse.position.copy( intersects[0].point )
            //paddel.position.copy( intersects[0].point.add(new THREE.Vector3( 0, 20, 0 )) );

            if(rayCallBack) rayCallBack( targetMouse );
        }
    }


    //--------------------------------------
    //
    //   UPDATE OBJECT
    //
    //--------------------------------------

    view.update = function(){

        this.bodyStep();
        //this.softStep();

    }

    view.bodyStep = function(){

        if( !meshs.length ) return;

        meshs.forEach( function( b, id ) {
            var n = id * 8;
            var s = Br[n];
            //if ( s > 0 ) {

                //if ( b.material.name == 'sleep' ) b.material = mat.move;
                //if( s > 50 && b.material.name == 'move' ) b.material = mat.movehigh;
                //else if( s < 50 && b.material.name == 'movehigh') b.material = mat.move;
                
                b.position.set( Br[n+1]*ws, Br[n+2]*ws, Br[n+3]*ws );
                b.quaternion.set( Br[n+4], Br[n+5], Br[n+6], Br[n+7] );

            //} else {
               // if ( b.material.name == 'move' || b.material.name == 'movehigh' ) b.material = mat.sleep;
            //}
        });

    };


  

    return view;

})();  