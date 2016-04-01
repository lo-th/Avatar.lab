THREE.Avatar = function () {

    this.gender = "woman";

    this.isAnimation = true;
    this.speed = 0.5;

    this.type = 'Avatar';
    this.isReady = false;

    this.baseMatrix = [];
    this.skeletonCopy = null;


    this.helper = null;

};

//THREE.Avatar.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.Avatar.prototype = Object.create( THREE.SEA3D.SkinnedMesh.prototype );
THREE.Avatar.prototype.constructor = THREE.Avatar;

THREE.Avatar.prototype.init = function ( Geos, Bvh ){

    this.normalMaterial = new THREE.MeshStandardMaterial({ skinning: true,  morphTargets:false, metalness:0.4, roughness:0.5, normalScale:new THREE.Vector2( 0.5, 0.5 ) });

    this.material = this.normalMaterial;

    this.geos = Geos;
    this.bvh = Bvh;

    //console.log(this.geos['woman'].animations );

    this.decal = new THREE.Vector3(0,-11.5,0);

    var useVertexTexture = false;

    //THREE.SkinnedMesh.call( this, this.geos[this.gender], this.material, useVertexTexture );
    THREE.SEA3D.SkinnedMesh.call( this, this.geos[this.gender], this.material, useVertexTexture );

    this.skeletonCopy = this.skeleton.clone();


    var i = this.skeleton.bones.length;
    while(i--) this.baseMatrix[i] = this.skeleton.bones[i].matrixWorld.clone();

    //console.log(this.baseMatrix);


    this.morphology();

    this.initAnimation();

    this.castShadow = true;
    this.receiveShadow = true;
    this.preservesBoneSize = true;

    this.position.y = this.geometry.boundingBox.max.y;

    this.addEyes();

    this.isReady = true;

    this.switchToAnimation();

    

};

//-----------------------
//  for SSAO
//-----------------------

THREE.Avatar.prototype.initDepth = function (){

    var depthShader = THREE.ShaderLib[ "depthRGBA" ];
    var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

    this.depthMaterial = new THREE.ShaderMaterial( { 
        fragmentShader: depthShader.fragmentShader, vertexShader:depthShader.vertexShader,
        uniforms: depthUniforms, blending: THREE.NoBlending, 
        skinning: true, morphTargets:false 
    });

};

THREE.Avatar.prototype.depthPass = function (){

    this.eyeGroup.visible = false;
    this.material = this.depthMaterial;

};

THREE.Avatar.prototype.normalPass = function (){

    this.eyeGroup.visible = true;
    this.material = this.normalMaterial;

};


//-----------------------
//  Morphology 
//-----------------------

THREE.Avatar.prototype.morphology = function (){

    var i, bone, name;

    //this.skeleton = this.skeletonCopy.clone();

    //this.updateMatrixWorld( true );

    //this.skeleton.calculateInverses();

    //var bindMatrix = this.matrixWorld;

    //this.bindMatrix.copy( bindMatrix );
    //this.bindMatrixInverse.getInverse( bindMatrix )

    /*i = this.skeleton.bones.length;

    while(i--){
        bone = this.skeleton.bones[i];
        bone.matrixWorld.copy( this.baseMatrix[i] );
        bone.updateMatrixWorld();
    }*/




    i = this.skeleton.bones.length;

    if(this.gender === 'woman'){

        while(i--){



            bone = this.skeleton.bones[i];
            name = bone.name;

           // bone.matrixAutoUpdate = false;

            //bone.matrixWorld.copy( this.baseMatrix[i] );

            bone.scalling = null;

            if(name === 'LeftCollar' || name === 'RightCollar') bone.scalling = new THREE.Vector3( 0.75, 1, 1 );
            if(name === 'LeftUpArm'  || name === 'RightUpArm' ) bone.scalling = new THREE.Vector3( 0.93, 1.05, 1.05 );
            if(name === 'LeftLowArm' || name === 'RightLowArm') bone.scalling = new THREE.Vector3( 2.93, 1.05, 1.05 );
            // hand
            if(name.substring(0,2) === 'lf' || name.substring(0,2) === 'rf'){ 
               // if(name.substring(5) === '0') { bone.translateX(-1); console.log(bone.position);}//bone.position.x -= 20;//console.log('first finger')
                bone.scalling = new THREE.Vector3( 0.85, 1, 1 );
            }
            if(name === 'RightHand' || name === 'LeftHand') bone.scalling = new THREE.Vector3( 0.85, 0.85, 0.85 );

            //if(bone.scalling) bone.scale.copy(bone.scalling)

           /* if( bone.scalling ){ 
                bone.matrixWorld.scale( bone.scalling );
                bone.updateMatrixWorld();
            }*/
            //bone.matrixAutoUpdate = false;

            //bone.matrixAutoUpdate = true;
            //bone.matrixWorldNeedsUpdate = true;
        }

    }else{

        while(i--){

            bone = this.skeleton.bones[i];
            name = bone.name;

            //bone.matrixAutoUpdate = false;

            //bone.matrixWorld.copy( this.baseMatrix[i] );

            bone.scalling = null;

            if(name==='Chest' ) bone.scalling = new THREE.Vector3(1,1.1,1);
            if(name==='Spine1') bone.scalling = new THREE.Vector3(1,1.15,1);
            if(name==='LeftCollar' || name==='RightCollar') bone.scalling = new THREE.Vector3( 1,1,1 );
            if(name==='LeftUpArm'  || name==='RightUpArm' ) bone.scalling = new THREE.Vector3( 0.93,1.2,1.2 );
            if(name==='LeftLowArm' || name==='RightLowArm') bone.scalling = new THREE.Vector3( 0.93,1.25,1.25 );

            if(name==='LeftUpLeg'  || name==='RightUpLeg' ) bone.scalling = new THREE.Vector3( 1,1.2,1.2 );
            if(name==='LeftLowLeg' || name==='RightLowLeg') bone.scalling = new THREE.Vector3( 1,1.1,1.1 );

            //if( bone.scalling ) bone.matrixWorld.scale( bone.scalling );

            //bone.matrixAutoUpdate = true;
            //else bone.matrixWorld.scale( new THREE.Vector3(1,1,1) );

        }

    }
 
};


//-----------------------
//  EYE control
//-----------------------

THREE.Avatar.prototype.addEyes = function (){

    this.eyeMaterial = new THREE.MeshStandardMaterial({ metalness:0.7, roughness:0.3, normalScale:new THREE.Vector2( 1.5, 1.5 ) });

    this.eyeGroup = new THREE.Group();
    var eyeL = new THREE.Mesh( this.geos['eye'], this.eyeMaterial );
    var eyeR = new THREE.Mesh( this.geos['eye'], this.eyeMaterial );
    eyeL.position.y = -1.39;
    eyeR.position.y = 1.39;
    this.eyeGroup.position.set(-3.57, 0, -3.1895);
    this.eyeGroup.add( eyeL );
    this.eyeGroup.add( eyeR );

    this.target = new THREE.Vector3();//Group();
    this.target.z = -40;// distance
    this.target.x = 0;//-5; // up/down
    //eyeCenter.position.y = 10; // left/right

    eyeL.lookAt( this.target );
    eyeR.lookAt( this.target );

    for(var i=0; i<this.skeleton.bones.length; i++){
        if(this.skeleton.bones[i].name === "Head"){ 
            this.skeleton.bones[i].add( this.eyeGroup );
            
            //this.skeleton.bones[i].scale.y = 1.2;
            //console.log(this.skeleton.bones[i].scale)
        }
    }

};

THREE.Avatar.prototype.switchGender = function (){

    if(this.gender == 'woman') this.gender = 'man';
    else this.gender = 'woman';

    this.stop();

    this.geometry = this.geos[this.gender];

    this.morphology();

    this.initAnimation();

    this.updateBones();

    //this.updateMatrixWorld( true );

    

};

THREE.Avatar.prototype.initAnimation = function (){

    if ( this.geometry.animations ) {

        this.setAnimations( this.geometry.animations );

    }

    /*var i = this.skeleton.bones.length, a, j
    while(i--){
        if(this.skeleton.bones[i].scalling){
            a = this.animations['walk'].data.hierarchy[i];
            j = a.keys.length;
            while(j--){
                a.keys[j].scl = this.skeleton.bones[i].scalling.toArray();
            }
        } 
    }*/

    //console.log(this.animations['walk']);

    this.play("walk", 0);//( name, crossfade, offset )

};

THREE.Avatar.prototype.addHelper = function (){

    this.helper = new THREE.SkeletonHelper(this);
    scene.add(this.helper);

};

THREE.Avatar.prototype.removeHelper = function (){

    scene.remove(this.helper);
    this.helper = null;

};

THREE.Avatar.prototype.switchToAnimation = function ( b ){

    this.isAnimation = b === undefined ? false : b;

    var i = this.skeleton.bones.length;
    while(i--) this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;

};

THREE.Avatar.prototype.updateAnimation = function (delta){

    if( !this.isAnimation ) return;

    // Update SEA3D Animations
    THREE.SEA3D.AnimationHandler.update( delta * this.speed );

    // Update Three.JS Animations
    THREE.AnimationHandler.update( delta * this.speed );

    if( this.helper ) this.helper.update();

};

THREE.Avatar.prototype.updateBones = function (){

    if(!this.isReady) return;
    if(this.isAnimation) return;

    var matrixWorldInv = new THREE.Matrix4().getInverse( this.matrixWorld );
    var bone, node, name;
    var bones = this.skeleton.bones;
    var nodes = this.bvh.Nodes;
    var len = bones.length;
    var parentMtx, tmpMtx, worldMtx;
    var globalMtx = new THREE.Matrix4();
    var localMtx = new THREE.Matrix4();
    var globalQuat = new THREE.Quaternion();
    var globalPos = new THREE.Vector3();
    var tmpPos = new THREE.Vector3();
    var revers = new THREE.Vector3(-1,1,-1); // for tjs

    var scaleMtx = new THREE.Matrix4();

    for(var i=0; i < len; i++){
        bone = bones[i];
        name = bone.name;
        worldMtx = bone.parent.matrixWorld || matrixWorldInv;
        parentMtx = bone.parent ? bone.parent.matrixWorld : worldMtx;
        if ( node = nodes[name] ){
            
            // LOCAL TO GLOBAL
            tmpMtx = node.matrixWorld.clone();
            if( isTJS ) tmpMtx.scale(revers);
            globalPos.setFromMatrixPosition( tmpMtx );
            globalQuat.setFromRotationMatrix( tmpMtx );

            //if( name === 'Hips' ) globalPos.add(decal);
            if( name === 'Hips' ) globalPos.add(this.decal);

            // PREPARES MATRIX
            if ( !bone.rootMatrix ) bone.rootMatrix = bone.matrixWorld.clone();
            
            // MODIFY TRANSFORM
            globalMtx.identity();
            globalMtx.makeRotationFromQuaternion( globalQuat );
            globalMtx.multiply( bone.rootMatrix );
            globalMtx.setPosition( globalPos );

            //if( bone.scalling ) globalMtx.scale( bone.scalling );
            
            // GLOBAL TO LOCAL
            tmpMtx.identity().getInverse( worldMtx );
            localMtx.multiplyMatrices( tmpMtx, globalMtx );
            globalMtx.multiplyMatrices( worldMtx, localMtx );

            // PRESERVES BONE SIZE
            if( this.preservesBoneSize && name !== 'Hips' ){
             
                tmpMtx.identity().getInverse( parentMtx );
                tmpPos.setFromMatrixPosition( bone.matrix );
                localMtx.multiplyMatrices( tmpMtx, globalMtx );
                localMtx.setPosition( tmpPos );
                globalMtx.multiplyMatrices( parentMtx, localMtx );

                //if( bone.scalling ) globalMtx.scale( bone.scalling );
                
            }

        } else { // other Bone
            globalMtx.multiplyMatrices( parentMtx, bone.matrix );
        }

        // UPDATE BONE
        bone.matrixWorld.copy( globalMtx );
        //if( bone.scalling ) bone.matrixWorld.scale( bone.scalling );
        bone.matrix.getInverse( bone.parent.matrixWorld );
        bone.matrix.multiply( bone.matrixWorld );
        
        //bone.matrixAutoUpdate = true;
        //

        //if(node = nodes[name] )updatePhysicsBone(name, bone.matrix.clone());
    }

    if( this.helper ) this.helper.update();
       
};

//-----------------------
// force local scalling
//-----------------------



THREE.Skeleton.prototype.update = ( function () {

    var offsetMatrix = new THREE.Matrix4();
    var scaleMatrix = new THREE.Matrix4();
    var pos = new THREE.Vector3();

    return function update() {

        /*for ( var b = 0, bl = this.bones.length; b < bl; b ++ ) {
            if( this.bones[ b ].scalling ){ 
               // var tmp = new THREE.Matrix4().makeScale( this.bones[ b ].scalling.x, this.bones[ b ].scalling.y, this.bones[ b ].scalling.z )
               // matrix.multiply( tmp );
               this.bones[ b ].matrix.scale( this.bones[ b ].scalling );

               // matrix.makeScale( this.bones[ b ].scalling.x, this.bones[ b ].scalling.y, this.bones[ b ].scalling.z )
            }
        }*/

        // flatten bone matrices to array

        for ( var b = 0, bl = this.bones.length; b < bl; b ++ ) {

            // compute the offset between the current and the original transform

            if( this.bones[ b ].parent ){ 

                //if ( this.bones[ b ].parent === null ) {

               // this.bones[ b ].matrixWorld.copy( this.matrix );

            //} else {

              //  this.bones[ b ].matrixWorld.multiplyMatrices( this.bones[ b ].parent.matrixWorld, this.bones[ b ].matrix );

           // }

                //this.bones[ b ].matrixWorld.multiplyMatrices( this.bones[ b ].parent.matrixWorld, this.bones[ b ].matrix );
               // this.bones[ b ].matrixWorld.scale( new THREE.Vector3(1,1,1).sub(this.bones[ b ].parent.scalling) );
                //this.bones[ b ].matrixWorld.scale( this.bones[ b ].parent.scalling.clone().sub( new THREE.Vector3(1,1,1) ) );
                //this.bones[ b ].updateMatrixWorld();
                //this.bones[ b ].updateMatrix();
            }

            if( this.bones[ b ].scalling ){ 
             // var tmp = new THREE.Matrix4().scale( this.bones[ b ].scalling );
            //  this.bones[ b ].matrixWorld.scale( this.bones[ b ].scalling );
             // this.bones[ b ].matrix.scale( this.bones[ b ].scalling );
               //this.bones[ b ].updateMatrixWorld(true);

              //this.bones[ b ].matrix.scale.copy( this.bones[ b ].scalling );
            // this.bones[ b ].matrix.scale( this.bones[ b ].scalling );
            //  this.bones[ b ].matrixWorldNeedsUpdate = true;
             // this.bones[ b ].updateMatrix()
             // this.bones[ b ].updateMatrixWorld(  );
              //this.bones[ b ].updateMatrix();
              //if(this.bones[ b ].children.length){

                //var i = this.bones[ b ].children.length;
                //while(i--) 

                //    this.bones[ b ].children[0].updateMatrixWorld();

              //}
             // console.log(this.bones[ b ])
             //
                //this.boneInverses[ b ] = new THREE.Matrix4().getInverse( this.bones[ b ].matrixWorld.scale( this.bones[ b ].scalling ) );
            }

            var matrix = this.bones[ b ] ? this.bones[ b ].matrixWorld: this.identityMatrix;

           if( this.bones[ b ].scalling ){ 

               matrix.scale( this.bones[ b ].scalling );

             // this.bones[ b ].matrixWorld.copy( matrix );
        //if( bone.scalling ) bone.matrixWorld.scale( bone.scalling );
       // this.bones[ b ].matrix.getInverse( this.bones[ b ].parent.matrixWorld );
       // this.bones[ b ].matrix.multiply( matrix );//this.bones[ b ].matrixWorld );

       // this.bones[ b ].updateMatrix();
        //this.bones[ b ].updateMatrixWorld();

             //   scaleMatrix.makeScale( this.bones[ b ].scalling.x, this.bones[ b ].scalling.y, this.bones[ b ].scalling.z );

               // this.bones[ b ].scale.copy(this.bones[ b ].scalling);
               // this.bones[ b ].updateMatrix();
                //this.bones[ b ].matrix.scale( this.bones[ b ].scalling );
                //this.bones[ b ].matrix.multiply( scaleMatrix );
               // matrix.multiplyMatrices( this.bones[ b ].parent.matrixWorld, this.bones[ b ].matrix );

                //if(this.bones[ b ].children[ 0 ])this.bones[ b ].children[ 0 ].updateMatrixWorld();

                if(this.bones[ b ].children[ 0 ]){
                    //scaleMatrix.getInverse( matrix );
                    scaleMatrix.multiplyMatrices( matrix, this.bones[ b ].children[ 0 ].matrix );
                    pos.setFromMatrixPosition( scaleMatrix ); 
                    //this.bones[ b ].children[ 0 ].matrix.setPosition(pos);
                    //this.bones[ b ].children[ 0 ].updateMatrix();
                    this.bones[ b ].children[ 0 ].matrixWorld.setPosition(pos);
                    //this.bones[ b ].children[ 0 ].updateMatrixWorld();
                }

              /*  for ( var i = 0, l = this.bones[ b ].children.length; i < l; i ++ ) {

                    scaleMatrix.multiplyMatrices( matrix.clone() , this.bones[ b ].children[ i ].matrix.clone()  );
                    pos.setFromMatrixPosition( scaleMatrix ); 
                    //this.bones[ b ].children[ 0 ].matrix.setPosition(pos);
                    //this.bones[ b ].children[ 0 ].updateMatrix();
                    this.bones[ b ].children[ i ].matrixWorld.setPosition(pos);

                  //  this.bones[ b ].children[ i ].updateMatrixWorld();

                }*/

               // var tmp = new THREE.Matrix4().makeScale( this.bones[ b ].scalling.x, this.bones[ b ].scalling.y, this.bones[ b ].scalling.z )
              //  matrix.multiply( tmp );
             //

              //matrix.scale( this.bones[ b ].scalling );
              //this.bones[ b ].updateMatrixWorld(true);
            
             // this.bones[ b ].updateMatrix()
               
              // if(this.bones[ b ].children)this.bones[ b ].children[ 0 ].updateMatrixWorld();
               //this.boneInverses[ b ] = new THREE.Matrix4().getInverse( this.bones[ b ].matrixWorld.scale( this.bones[ b ].scalling ) );

              // bone.matrixWorld.copy( globalMtx );
        //if( bone.scalling ) bone.matrixWorld.scale( bone.scalling );
       // bone.matrix.getInverse( bone.parent.matrixWorld );
       // bone.matrix.multiply( bone.matrixWorld );

               // matrix.makeScale( this.bones[ b ].scalling.x, this.bones[ b ].scalling.y, this.bones[ b ].scalling.z )
            }

            if( this.bones[ b ].parent.scalling ){ 

                //matrix.multiplyMatrices( this.bones[ b ].parent.matrixWorld, this.bones[ b ].matrix );



                 //this.bones[ b ].updateMatrix()

                // this.bones[ b ].updateMatrixWorld();

             //   this.bones[ b ].updateMatrixWorld();

                //this.bones[ b ].updateMatrixWorld();

                //this.boneInverses[ b ] = new THREE.Matrix4().getInverse( this.bones[ b ].parent.matrixWorld );

                //new THREE.Matrix4().getInverse( this.bones[ b ].parent.matrixWorld );
              //  matrix.multiply( new THREE.Matrix4().getInverse( this.bones[ b ].parent.matrixWorld ) );
                // var tmpPos = new THREE.Vector3().setFromMatrixPosition( matrix );
                 //var tmpQuat = new THREE.Quaternion().setFromRotationMatrix( matrix );

                 //matrix.identity();
                 //matrix.setPosition( tmpPos );
                 /*matrix.scale( this.bones[ b ].scalling );*/
                 //matrix.makeRotationFromQuaternion( tmpQuat );

                // matrix.identity();
               // matrix.makeRotationFromQuaternion( tmpQuat );
               //matrix.multiply( this.bones[ b ].parent.matrixWorld );
               // matrix.setPosition( tmpPos );
               // matrix.scale( this.bones[ b ].parent.scalling )
               // matrix.elements[0] =1;
               // matrix.elements[5] =1;
               // matrix.elements[10] =1;
                //tmpPos.addScaledVector( this.bones[ b ].parent.scalling );
               // this.boneInverses[ b ].scale( this.bones[ b ].parent.scalling );

                //matrix.setPosition( tmpPos );

                //matrix.makeScale( this.bones[ b ].parent.scalling.x, this.bones[ b ].parent.scalling.y, this.bones[ b ].parent.scalling.z )

                //if( bone.scalling ) matrix.scale( bone.scalling )
            } 


            
            offsetMatrix.multiplyMatrices( matrix, this.boneInverses[ b ] );
            offsetMatrix.flattenToArrayOffset( this.boneMatrices, b * 16 );

        }

        if ( this.useVertexTexture ) {

            this.boneTexture.needsUpdate = true;

        }

        //this.pose(); 

    };

} )();