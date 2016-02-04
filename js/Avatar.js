THREE.Avatar = function () {

    this.gender = "woman";

    this.isAnimation = true;
    this.speed = 0.5;

    this.type = 'Avatar';
    this.isReady = false;

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

    this.morphologia();

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
//  MORPHOLOGIA
//-----------------------

THREE.Avatar.prototype.morphologia = function (){

    var i = this.skeleton.bones.length, bone, name;

    if(this.gender === 'woman'){

        while(i--){

            bone = this.skeleton.bones[i];
            name = bone.name;

            bone.scalling = null;

            if(name === 'LeftCollar' || name === 'RightCollar') bone.scalling = new THREE.Vector3( 0.75, 1, 1 );
            if(name === 'LeftUpArm'  || name === 'RightUpArm' ) bone.scalling = new THREE.Vector3( 0.90,1.15,1.15 );
            if(name === 'LeftLowArm' || name === 'RightLowArm') bone.scalling = new THREE.Vector3( 0.90,1.2,1.2 );

        }

    }else{

        while(i--){

            bone = this.skeleton.bones[i];
            name = bone.name;

            bone.scalling = null;

            if(name==='Chest' ) bone.scalling = new THREE.Vector3(1,1.1,1);
            if(name==='Spine1') bone.scalling = new THREE.Vector3(1,1.15,1);
            //if(name==='LeftCollar' || name==='RightCollar') bone.scalling.set( 1,1,1 );
            if(name==='LeftUpArm'  || name==='RightUpArm' ) bone.scalling = new THREE.Vector3( 0.90,1.2,1.2 );
            if(name==='LeftLowArm' || name==='RightLowArm') bone.scalling = new THREE.Vector3( 0.90,1.25,1.25 );

            if(name==='LeftUpLeg'  || name==='RightUpLeg' ) bone.scalling = new THREE.Vector3( 1,1.2,1.2 );
            if(name==='LeftLowLeg' || name==='RightLowLeg') bone.scalling = new THREE.Vector3( 1,1.1,1.1 );

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

    this.morphologia();

    this.initAnimation();

    this.updateBones();

};

THREE.Avatar.prototype.initAnimation = function (){

    if ( this.geometry.animations ) {

        this.setAnimations( this.geometry.animations );

    }

    //console.log(this.animations['idle']);

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

};

THREE.Avatar.prototype.updateBones = function (){

    if(!this.isReady) return;

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
                
            }

        } else { // other Bone
            globalMtx.multiplyMatrices( parentMtx, bone.matrix );
        }

        // UPDATE BONE
        bone.matrixWorld.copy( globalMtx );
        bone.matrix.getInverse( bone.parent.matrixWorld );
        bone.matrix.multiply( bone.matrixWorld );
        //bone.matrixAutoUpdate = false;
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

    return function update() {

        // flatten bone matrices to array

        for ( var b = 0, bl = this.bones.length; b < bl; b ++ ) {

            // compute the offset between the current and the original transform

            var matrix = this.bones[ b ] ? this.bones[ b ].matrixWorld : this.identityMatrix;

            if( this.bones[ b ].scalling ) matrix.scale( this.bones[ b ].scalling );
            
            offsetMatrix.multiplyMatrices( matrix, this.boneInverses[ b ] );
            offsetMatrix.flattenToArrayOffset( this.boneMatrices, b * 16 );

        }

        if ( this.useVertexTexture ) {

            this.boneTexture.needsUpdate = true;

        }

    };

} )();