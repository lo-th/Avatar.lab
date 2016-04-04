'use strict';

THREE.Avatar = function () {

    this.gender = "woman";

    this.isAnimation = true;
    this.isBvh = false;
    this.speed = 0.5;

    this.type = 'Avatar';
    this.isReady = false;
    this.mode = 'free';

    this.animationsNames = [];

    this.bonesNames = [];
    this.boneSelect = null;

    this.womanScalling = [];
    this.manScalling = [];

    this.baseMatrix = [];

    this.helper = null;

};

//THREE.Avatar.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.Avatar.prototype = Object.create( THREE.SEA3D.SkinnedMesh.prototype );
THREE.Avatar.prototype.constructor = THREE.Avatar;

THREE.Avatar.prototype.init = function ( Geos ){

    var i, n;

    this.geos = Geos;

    var ccMan = new THREE.Float32Attribute( this.geos['man'].attributes.position.count*3, 3 );
    var ccWoman = new THREE.Float32Attribute( this.geos['woman'].attributes.position.count*3, 3 );

    i = ccMan.count;
    while(i--){ 
        n = i*3
        ccMan[n] = 1;
        ccMan[n+1] = 1;
        ccMan[n+2] = 1;
    }

    i = ccWoman.count;
    while(i--){ 
        n = i*3
        ccWoman[n] = 1;
        ccWoman[n+1] = 1;
        ccWoman[n+2] = 1;
    }

    // add color vertrice
    this.geos['man'].addAttribute( 'color', ccMan );
    this.geos['woman'].addAttribute( 'color', ccWoman );

    //this.normalMaterial = new THREE.MeshStandardMaterial({ skinning: true,  morphTargets:false, metalness:0.4, roughness:0.5, normalScale:new THREE.Vector2( 0.5, 0.5 ) });//premultipliedAlpha: true
    if( isWithMap ) this.normalMaterial = new THREE.MeshStandardMaterial({ envMap:textures[0], map:textures[2], normalMap:textures[3], aoMap:textures[6], aoMapIntensity:0.5, skinning: true,  morphTargets:false, metalness:0.4, roughness:0.5, normalScale:new THREE.Vector2( 0.5, 0.5 ) });
    else this.normalMaterial = new THREE.MeshStandardMaterial({ skinning: true,  morphTargets:false, metalness:0.4, roughness:0.5 });

    this.material = this.normalMaterial;

    

    //console.log(this.geos['woman'].animations );

    this.decal = new THREE.Vector3(0,-11.5,0);

    var useVertexTexture = false;

    //THREE.SkinnedMesh.call( this, this.geos[this.gender], this.material, useVertexTexture );
    THREE.SEA3D.SkinnedMesh.call( this, this.geos[this.gender], this.material, useVertexTexture );

    //this.skeletonCopy = this.skeleton.clone();


    i = this.skeleton.bones.length;
    while(i--){ 
        this.bonesNames[i] = this.skeleton.bones[i].name;
        this.baseMatrix[i] = this.skeleton.bones[i].matrixWorld.clone();
    }

    //console.log(this.baseMatrix);

    this.initMorphology();


    this.morphology();

    this.initAnimation();

    this.castShadow = true;
    this.receiveShadow = true;
    this.preservesBoneSize = true;

    this.position.y = this.geometry.boundingBox.max.y;

    this.addEyes();

    this.isReady = true;

    //this.switchToAnimation();

};

THREE.Avatar.prototype.setBVH = function ( BVH ){
    this.bvh = BVH;
};

THREE.Avatar.prototype.materialUpdate = function (){
     this.normalMaterial.needsUpdate = true;
     this.eyeMaterial.needsUpdate = true;
     if(this.depthMaterial)this.depthMaterial.needsUpdate = true;
};

THREE.Avatar.prototype.setEnvMap = function ( tx ){
    this.normalMaterial.envMap = tx;
     this.eyeMaterial.envMap = tx;

     this.normalMaterial.needsUpdate = true;
     this.eyeMaterial.needsUpdate = true;
};

THREE.Avatar.prototype.setMetalness = function ( v ){
    this.normalMaterial.metalness = v;
    this.eyeMaterial.metalness = v;
};

THREE.Avatar.prototype.setRoughness = function ( v ){
    this.normalMaterial.roughness = v;
    this.eyeMaterial.roughness = v;
};

//-----------------------
//  BONES TOOL
//-----------------------

THREE.Avatar.prototype.findID = function ( name ){

    return this.bonesNames.indexOf(name);

};


//-----------------------
//  for SHOW BONE
//-----------------------

THREE.Avatar.prototype.toEdit = function ( ){

    avatar.reset();

    this.mode = 'edit';

    this.showBones('Hips');

    this.material.vertexColors = THREE.VertexColors;
    this.material.needsUpdate = true;

}

THREE.Avatar.prototype.setScalling = function ( axe, v ){

    var id = this.findID( this.boneSelect );

    if(id === -1) return;

    if( this.gender === 'woman' ){

        if(this.womanScalling[id] === null) this.womanScalling[id] = new THREE.Vector3(1,1,1);

        this.womanScalling[id][axe] = v;
        this.skeleton.bones[id].scalling = this.womanScalling[id].clone();

    }else{

        if(this.manScalling[id] === null) this.manScalling[id] = new THREE.Vector3(1,1,1);

        this.manScalling[id][axe] = v;
        this.skeleton.bones[id].scalling = this.manScalling[id].clone();

    }

    //console.log( this.womanScalling )

};

THREE.Avatar.prototype.showBones = function ( name ){

    var i, lng, n, n4, w0, w1, w2, w3, x;

    var id = this.findID(name);

    if(id === -1) return;


    if(Gui){
        if(this[this.gender + 'Scalling'][id] !== null ) Gui.setScallingValue( this[this.gender + 'Scalling'][id] );
        else Gui.setScallingValue(new THREE.Vector3(1,1,1));
    }

    

    this.boneSelect = name;

    var colors = this.geometry.attributes.color.array;
    var index = this.geometry.attributes.skinIndex.array;
    var weight = this.geometry.attributes.skinWeight.array;

    lng = colors.length;

    for( i = 0; i<lng; i++){

        n = i*3
        n4 = i*4;

        w0 = index[n4] === id ? weight[n4] : 0;
        w1 = index[n4+1] === id ? weight[n4+1] : 0;
        w2 = index[n4+2] === id ? weight[n4+2] : 0;
        w3 = index[n4+3] === id ? weight[n4+3] : 0;

        x = w0+w1+w2+w3;

        colors[n] = 1;
        colors[n+1] =  1-x;
        colors[n+2] =  1-x;

    }

    this.geometry.attributes.color.needsUpdate = true;
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

THREE.Avatar.prototype.initMorphology = function (){

    var i, bone, name, v;

    // for woman

    i = this.skeleton.bones.length;

    while(i--){

        bone = this.skeleton.bones[i];
        name = bone.name;

        v = null;

        //if(name === 'Hips' ) v = new THREE.Vector3( 1,1.2,1 );

        if(name === 'LeftBreast' || name === 'RightBreast') v = new THREE.Vector3( 1.1,1,1 );
        if(name === 'LeftCollar' || name === 'RightCollar') v = new THREE.Vector3( 0.8, 1, 1 );
        if(name === 'LeftUpArm'  || name === 'RightUpArm' ) v = new THREE.Vector3( 0.93, 1, 1 );
        if(name === 'LeftLowArm' || name === 'RightLowArm') v = new THREE.Vector3( 0.93, 1, 1 );
        // hand
        if(name === 'RightHand' || name === 'LeftHand') v = new THREE.Vector3( 0.87, 0.9, 0.9 );
        // finger
        if(name.substring(0,2) === 'lf' || name.substring(0,2) === 'rf') v = new THREE.Vector3( 0.94, 1, 1 );

        this.womanScalling[i] = v;
    }

    // for man

    i = this.skeleton.bones.length;

    while(i--){

        bone = this.skeleton.bones[i];
        name = bone.name;

        v = null;

        if(name==='Chest' ) v = new THREE.Vector3(1,1.1,1);
        if(name==='Spine1') v = new THREE.Vector3(1,1.15,1);

        if(name==='LeftCollar' || name==='RightCollar') v = new THREE.Vector3( 1,1,1 );
        if(name==='LeftUpArm'  || name==='RightUpArm' ) v = new THREE.Vector3( 0.93,1.2,1.2 );
        if(name==='LeftLowArm' || name==='RightLowArm') v = new THREE.Vector3( 0.93,1.25,1.25 );

        if(name==='LeftUpLeg'  || name==='RightUpLeg' ) v = new THREE.Vector3( 1,1.2,1.2 );
        if(name==='LeftLowLeg' || name==='RightLowLeg') v = new THREE.Vector3( 1,1.1,1.1 );

        // hand
        if(name === 'RightHand' || name === 'LeftHand') v = new THREE.Vector3( 1, 1, 1 );
        // finger
        if(name.substring(0,2) === 'lf' || name.substring(0,2) === 'rf') v = new THREE.Vector3( 1, 1, 1 );

        this.manScalling[i] = v;

    }


 
};

THREE.Avatar.prototype.morphology = function (){

    var i, bone, name;

    i = this.skeleton.bones.length;
    while(i--){ 
        if( this[this.gender + 'Scalling'][i] !== null ) this.skeleton.bones[i].scalling = this[ this.gender + 'Scalling' ][i].clone();
        else this.skeleton.bones[i].scalling = null;
    }

};


//-----------------------
//  EYE control
//-----------------------

THREE.Avatar.prototype.addEyes = function (){

    if(isWithMap) this.eyeMaterial = new THREE.MeshStandardMaterial({ envMap:textures[0], map:textures[4], normalMap:textures[5], metalness:0.7, roughness:0.3, normalScale:new THREE.Vector2( 1.5, 1.5 ) });
    else this.eyeMaterial = new THREE.MeshStandardMaterial({ metalness:0.7, roughness:0.3 });

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

    if(this.mode === 'edit') this.showBones( this.boneSelect );

    //this.updateMatrixWorld( true );

    

};

THREE.Avatar.prototype.initAnimation = function (){

    if ( this.geometry.animations ) {

        this.setAnimations( this.geometry.animations );
        
    }

    this.animationsNames = [];

    var i, lng = this.animations.length, name;
    for( i = 0; i<lng ; i++ ){
        name = this.geometry.animations[i].name;
        name = name.substring( name.lastIndexOf('/')+1 );
        this.animationsNames.push(name);
    }


    //this.play("walk", 0);//( name, crossfade, offset )
    this.play("idle", 0);

};

THREE.Avatar.prototype.addHelper = function (){

    this.helper = new THREE.SkeletonHelper(this);
    scene.add(this.helper);

};

THREE.Avatar.prototype.removeHelper = function (){

    scene.remove(this.helper);
    this.helper = null;

};

THREE.Avatar.prototype.reset = function (){

    bvhReader.interface.hide();

    this.mode = 'free';

    this.material.vertexColors = THREE.NoColors;
    this.material.needsUpdate = true;

    this.isAnimation = false;
    this.isBvh = false;

    var i = this.skeleton.bones.length;
    while(i--) this.skeleton.bones[i].matrixAutoUpdate = true;

    //var oly= this.position.y;

    //this.pose();

    //this.position.y = 80;

    
    this.play("base", 0);
    THREE.SEA3D.AnimationHandler.update( 0 );
    THREE.AnimationHandler.update( 0 );

    this.stop();

   /* var i = this.skeleton.bones.length;
    while(i--){ 
        this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;
        //this.skeleton.bones[i].matrixWorld = this.baseMatrix[i].clone();
        this.skeleton.bones[i].matrixWorld.copy( this.baseMatrix[i] );
    }*/
};


THREE.Avatar.prototype.toBvh = function (){

    this.reset();

    bvhReader.interface.show();

    //this.morphology();

    this.mode = 'bvh';

    //this.isAnimation = false;
    this.isBvh = true;

    //console.log(this.skeleton.bones[0].scalling)

    

    //var i = this.skeleton.bones.length;
    //while(i--) this.skeleton.bones[i].matrixAutoUpdate = false;//this.isAnimation;

};

THREE.Avatar.prototype.toAnimation = function (){

    this.reset();

    this.mode = 'animation';

    this.isAnimation = true;
    //this.isBvh = false;

   // var i = this.skeleton.bones.length;
    //while(i--) this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;

    this.play("idle", 0);

};

/*THREE.Avatar.prototype.switchToAnimation = function ( b ){

    this.isAnimation = b === undefined ? false : b;

    var i = this.skeleton.bones.length;
    while(i--) this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;

};*/

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
    if(!this.isBvh) return;
    if(!this.bvh) return;
    if(!this.bvh.Nodes) return;

    var matrixWorldInv = new THREE.Matrix4().getInverse( this.matrixWorld );
    var bone, node, name, parentName, parentId;
    var bones = this.skeleton.bones;
    var nodes = this.bvh.Nodes;
    var len = bones.length;
    var parentMtx, tmpMtx; //, worldMtx;
    var globalMtx = new THREE.Matrix4();
    var localMtx = new THREE.Matrix4();
    var globalQuat = new THREE.Quaternion();
    var globalPos = new THREE.Vector3();
    var tmpPos = new THREE.Vector3();
    var revers = new THREE.Vector3(-1,1,-1); // for tjs

    var scaleMtx = new THREE.Matrix4();

    for(var i=0; i < len; i++){

        bone = bones[i];

        if( bone.matrixAutoUpdate ) bone.matrixAutoUpdate = false;

        name = bone.name;
        //parentId = bone.parent ? this.findID(bone.parent.name) : -1;
        //parentMtx = parentId !== -1 ? this.baseMatrix[parentId] : matrixWorldInv;

        //parentMtx = matrixWorldInv; this.baseMatrix[ this.findID(parentName) ];

        //worldMtx = bone.parent.matrixWorld || matrixWorldInv;
        parentMtx = bone.parent ? bone.parent.matrixWorld : matrixWorldInv;


        if ( node = nodes[name] ){
            
            // LOCAL TO GLOBAL
            tmpMtx = node.matrixWorld.clone();
            if( isTJS ) tmpMtx.scale(revers);
            globalPos.setFromMatrixPosition( tmpMtx );
            globalQuat.setFromRotationMatrix( tmpMtx );

            //if( name === 'Hips' ) globalPos.add(decal);
            if( name === 'Hips' ) globalPos.add(this.decal);

            // PREPARES MATRIX
            if ( !bone.rootMatrix ) bone.rootMatrix = this.baseMatrix[i];//bone.matrixWorld.clone();
            
            // MODIFY TRANSFORM
            globalMtx.identity();
            globalMtx.makeRotationFromQuaternion( globalQuat );
            globalMtx.multiply( bone.rootMatrix );
            globalMtx.setPosition( globalPos );

            //if( bone.scalling ) globalMtx.scale( bone.scalling );
            
            // GLOBAL TO LOCAL
            //tmpMtx.identity().getInverse( worldMtx );
            //localMtx.multiplyMatrices( tmpMtx, globalMtx );
            //globalMtx.multiplyMatrices( worldMtx, localMtx );

            // PRESERVES BONE SIZE
            if( this.preservesBoneSize && name !== 'Hips' ){
             
                tmpMtx.identity().getInverse( parentMtx );
                tmpPos.setFromMatrixPosition( bone.matrix );
                localMtx.multiplyMatrices( tmpMtx, globalMtx );
                localMtx.setPosition( tmpPos );
                globalMtx.multiplyMatrices( parentMtx, localMtx );
               // globalMtx.scale( new THREE.Vector3(1,1,1) );

                //if( bone.scalling ) globalMtx.scale( bone.scalling );
                
            }

        } else { // other Bone
            //tmpMtx.identity().getInverse( worldMtx );
            //localMtx.multiplyMatrices( tmpMtx, globalMtx );
            //globalMtx.multiplyMatrices( worldMtx, localMtx );

            globalMtx.multiplyMatrices( parentMtx, bone.matrix );
        }

        // UPDATE BONE
        bone.matrixWorld.copy( globalMtx );
        //if( bone.scalling ) bone.matrixWorld.scale( bone.scalling );
        bone.matrix.getInverse( bone.parent.matrixWorld );
        bone.matrix.multiply( bone.matrixWorld );

        //bone.matrixWorldNeedsUpdate = true;
        //bone.updateMatrixWorld();
        //bone.updateMatrix();
        
        
        //

        //if(node = nodes[name] )updatePhysicsBone(name, bone.matrix.clone());
    }

    if( this.helper ) this.helper.update();

  //  console.log(this.skeleton.bones[ 0 ].scalling)
       
};

//-----------------------
// force local scalling
//-----------------------

THREE.Skeleton.prototype.update = ( function () {

    var offsetMatrix = new THREE.Matrix4();
    var scaleMatrix = new THREE.Matrix4();
    var pos = new THREE.Vector3();

    return function update() {

        // flatten bone matrices to array

        for ( var b = 0, bl = this.bones.length; b < bl; b ++ ) {

            // compute the offset between the current and the original transform

            var matrix = this.bones[ b ] ? this.bones[ b ].matrixWorld: this.identityMatrix;

            if( this.bones[ b ].scalling ){ 

                matrix.scale( this.bones[ b ].scalling );

                // update position of children

                for ( var i = 0, l = this.bones[ b ].children.length; i < l; i ++ ) {

                    scaleMatrix = matrix.clone();
                    scaleMatrix.multiply(this.bones[ b ].children[ i ].matrix.clone() )
                    //scaleMatrix.multiplyMatrices( matrix , this.bones[ b ].children[ i ].matrix  );

                    //scaleMatrix.multiplyMatrices( matrix.clone() , this.bones[ b ].children[ i ].matrix.clone()  );
                    pos.setFromMatrixPosition( scaleMatrix );
                    this.bones[ b ].children[ i ].matrixWorld.setPosition(pos);

                }

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