

'use strict';

var view = ( function () {

    var degtorad = Math.PI / 180;//0.0174532925199432957;
    var radtodeg = 180 / Math.PI;//57.295779513082320876

    var geo = {};
    var mat = {};
    var meshs = [];
    var softs = [];
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

        if(o.radius) o.radius = [o.radius[0]*wsi, o.radius[1]*wsi, o.radius[2]*wsi];
        if(o.center) o.center = [o.center[0]*wsi, o.center[1]*wsi, o.center[2]*wsi];


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

        

        if(o.type == 'terrain'){
            this.terrain( o ); 
            return;
        }*/

        if(o.type == 'ellipsoid'){
            // send to worker
             ammo.send( 'add', o );
            return;
        }

        
        

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

    view.toRad = function ( r ) {

        var i = r.length;
        while(i--) r[i] *= degtorad;
        return r;

    };

    view.activeRay = function ( callback ) {

        

        //isWithRay = true;

        var g = new THREE.PlaneBufferGeometry(1000,1000);
        //g.rotateX( -Math.PI90 );
        var zone = new THREE.Mesh( g,  new THREE.MeshBasicMaterial({ color:0xFFFFFF, transparent:true, opacity:0, depthTest:false, depthWrite:false }));
        content.add( zone );
        //moveplane.visible = false;

        targetMouse = new THREE.Mesh( geo['box'] ,  new THREE.MeshBasicMaterial({ color:0x00FF00 }));
        targetMouse.rotation.y = 90 * degtorad;
        targetMouse.rotation.z = 90 * degtorad;
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


    view.ellipsoidMesh = function ( o ) {

        var max = o.lng;
        var points = [];
        var ar = o.a;
        var i, j, k, v, n;
        
        // create temp convex geometry and convert to buffergeometry
        for( i = 0; i<max; i++ ){
            n = i*3;
            points.push(new THREE.Vector3(ar[n], ar[n+1], ar[n+2]));
        }
        var gt = new THREE.ConvexGeometry( points );

        
        var indices = new Uint32Array( gt.faces.length * 3 );
        var vertices = new Float32Array( max * 3 );
        var order = new Float32Array( max );
        //var normals = new Float32Array( max * 3 );
        //var uvs  = new Float32Array( max * 2 );

        

         // get new order of vertices
        var v = gt.vertices;
        var i = max, j, k;
        while(i--){
            j = max;
            while(j--){
                n = j*3;
                if(ar[n]==v[i].x && ar[n+1]==v[i].y && ar[n+2]==v[i].z) order[j] = i;
            }
        }

       
        i = max
        while(i--){
            n = i*3;
            k = order[i]*3;

            /*vertices[n] = v[i].x;
            vertices[n+1] = v[i].y;
            vertices[n+2] = v[i].z;*/

            vertices[k] = ar[n];
            vertices[k+1] = ar[n+1];
            vertices[k+2] = ar[n+2];

        }

        // get indices of faces
        var i = gt.faces.length;
        while(i--){
            n = i*3;
            var face = gt.faces[i];
            indices[n] = face.a;
            indices[n+1] = face.b;
            indices[n+2] = face.c;
        }

        //console.log(gtt.vertices.length)
        var g = new THREE.BufferGeometry();
        g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        g.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        g.addAttribute('order', new THREE.BufferAttribute( order, 1 ));
        
        //g.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
        //g.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

        g.computeVertexNormals();

        //extraGeo.push( g );


        gt.dispose();


        //g.addAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
        var mesh = new THREE.Mesh( g, mat.basic );

        //this.setName( o, mesh );

        mesh.softType = 3;

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        scene.add( mesh );
        softs.push( mesh );

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

    view.softStep = function(){

        if( !softs.length ) return;

        var softPoints = 0;

        softs.forEach( function( b, id ) {

            var n, c, cc, p, j, k;

            var t = b.softType; // type of softBody
            var order = null;
            var isWithColor = b.geometry.attributes.color ? true : false;
            var isWithNormal = b.geometry.attributes.normal ? true : false;

            p = b.geometry.attributes.position.array;
            if(isWithColor) c = b.geometry.attributes.color.array;

            if( t == 5 || t == 4 ){ // softTriMesh // softConvex

                var max = b.geometry.numVertices;
                var maxi = b.geometry.maxi;
                var pPoint = b.geometry.pPoint;
                var lPoint = b.geometry.lPoint;

                j = max;
                while(j--){
                    n = (j*3) + softPoints;
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    while(k--){
                        var id = lPoint[d+k]*3;
                        p[id] = Sr[n];
                        p[id+1] = Sr[n+1]; 
                        p[id+2] = Sr[n+2];
                    }
                }

            }else{


                if( b.geometry.attributes.order ) order = b.geometry.attributes.order.array;
                //if( m.geometry.attributes.same ) same = m.geometry.attributes.same.array;
                j = p.length;

                n = 2;

                if(order!==null) {
                    j = order.length;
                    while(j--){
                        k = order[j] * 3;
                        n = j*3 + softPoints;
                        p[k] = Sr[n]*ws;
                        p[k+1] = Sr[n+1]*ws;
                        p[k+2] = Sr[n+2]*ws;

                        cc = Math.abs(Sr[n+1]/10);
                        c[k] = cc;
                        c[k+1] = cc;
                        c[k+2] = cc;
                    }

                } else {
                     while(j--){
                         
                        p[j] = Sr[j+softPoints];
                        if(n==1){ 
                            cc = Math.abs(p[j]/10);
                            c[j-1] = cc;
                            c[j] = cc;
                            c[j+1] = cc;
                        }
                        n--;
                        n = n<0 ? 2 : n;
                    }

                }

            }

            if(t!==2) b.geometry.computeVertexNormals();

            b.geometry.attributes.position.needsUpdate = true;

            if(isWithNormal){

                var norm = b.geometry.attributes.normal.array;

                j = max;
                while(j--){
                    if( j == max-1 ) k = maxi - pPoint[j];
                    else k = pPoint[j+1] - pPoint[j];
                    var d = pPoint[j];
                    var ref = lPoint[d]*3;
                    while(k--){
                        var id = lPoint[d+k]*3;
                        norm[id] = norm[ref];
                        norm[id+1] = norm[ref+1]; 
                        norm[id+2] = norm[ref+2];
                    }
                }

                b.geometry.attributes.normal.needsUpdate = true;
            }

            if(isWithColor) b.geometry.attributes.color.needsUpdate = true;
            
            b.geometry.computeBoundingSphere();

            if( t == 5 ) softPoints += b.geometry.numVertices * 3;
            else softPoints += p.length;
        });

    };


  

    return view;

})();  