'use strict';

THREE.Avatar = function () {

    this.gender = "woman";

    this.isAnimation = true;
    this.isBvh = false;
    this.speed = 0.5;

    this.type = 'Avatar';
    this.isReady = false;
    this.mode = 'free';

    this.cAnimation = 'idle';

    this.animationsNames = [];

    //this.bones = {};
    this.bonesNames = [];
    this.boneSelect = null;

    this.womanScalling = [];
    this.manScalling = [];

    this.baseMatrix = [];

    this.helper = null;

    this.isCrouch = false;
    this.sw = false;

    this.breath = 0;
    this.breathSide = -1;

    // specifics bone
    this.head = null;
    this.chest = null;
    this.abdomen = null;

    this.poses = {

        'l_fingers': 0,
        'l_finger_0': 0,
        'l_finger_1': 0,
        'l_finger_2': 0,
        'l_finger_3': 0,
        'l_finger_4': 0,
        
        'r_fingers': 0,
        'r_finger_0': 0,
        'r_finger_1': 0,
        'r_finger_2': 0,
        'r_finger_3': 0,
        'r_finger_4': 0,
        
    };

    this.rot = {};
    this.pos = {};



};

//THREE.Avatar.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.Avatar.prototype = Object.create( THREE.SEA3D.SkinnedMesh.prototype );
THREE.Avatar.prototype.constructor = THREE.Avatar;

THREE.Avatar.prototype.init = function ( Geos ){

    var i, n, name, bone;

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
        bone = this.skeleton.bones[i];
        name = bone.name;
        //this.bones[ name ] = bone;
        this.bonesNames[i] = name;
        this.rot[ name ] = bone.rotation.clone();
        this.pos[ name ] = bone.position.clone();
        this.baseMatrix[ i ] = bone.matrixWorld.clone();

        if( name === 'Head' ) this.head = bone;
        if( name === 'Chest' ) this.chest = bone;
        if( name === 'Spine1' ) this.abdomen = bone;
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

    this.toPlayMode();

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

THREE.Avatar.prototype.testIK = function (){

    /*this.geometry.iks = [];

    var ik = {
      target: this.findID('LeftHand'),
      effector: this.findID('LeftCollar'),
      links: [ { index: this.findID('LeftLowArm'), limitation: new THREE.Vector3( 1, 0, 0 ) }, { index: this.findID('LeftUpArm'), limitation: new THREE.Vector3( 1, 0, 0 ) } ],
      iteration: 10,
      minAngle: 0.0,
      maxAngle: 1.0,
   }

   this.geometry.iks.push(ik);*/


}

//-----------------------
//  for SHOW BONE
//-----------------------

THREE.Avatar.prototype.toEdit = function ( ){

    avatar.reset();

    this.mode = 'edit';

    this.showBones('Hips');

    this.material.vertexColors = THREE.VertexColors;
    this.material.needsUpdate = true;

    //this.testIK();


    this.isAnimation = false;
    this.isBvh = false;

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
//  Play mode
//-----------------------

THREE.Avatar.prototype.toPlayMode = function (){

    this.reset();

    this.mode = 'play';

    this.isAnimation = true;

    //console.log(this.animations)
    //this.isBvh = false;

   // var i = this.skeleton.bones.length;
    //while(i--) this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;

    this.play("idle", 0);

    debugTell('use keyboard to control character')
    //this.play( this.cAnimation, 0);

};

THREE.Avatar.prototype.switchCrouch = function (){
    if(this.sw) return;
    if(this.isCrouch) this.isCrouch = false;
    else this.isCrouch = true;
    this.sw = true;
}

THREE.Avatar.prototype.updateKey = function (){
    if(this.mode !== 'play') return;

    //if(key[4]) this.isCrouch = true;
    //else this.isCrouch = false;


    if(!key[0] || !key[1] || !key[2] || !key[3] ){ if(this.isCrouch){ this.play("idle_crouch", 0.5); } else { this.play("idle", 0.5); } }

    if(this.isCrouch){
        if(key[0]) { this.animations.walk_crouch.timeScale = 1;  this.play("walk_crouch", 0.5); }
        if(key[1]) { this.animations.walk_crouch.timeScale = -1; this.play("walk_crouch", 0.5); }
    }else{
        if(key[0]) { this.animations.walk.timeScale = 1; if(key[7]) this.play("run", 0.5); else this.play("walk", 0.5); }
        if(key[1]) { this.animations.walk.timeScale = -1; this.play("walk", 0.5); }
    }

    

    if(key[2]) this.play("step_left", 0.5);
    if(key[3]) this.play("step_right", 0.5);






    //else this.play("idle", 0.5);
}


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
        if(name==='Chest' ) v = new THREE.Vector3(1,1,1);
        if(name==='Spine1') v = new THREE.Vector3(1,1,1);

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



THREE.Avatar.prototype.breathing = function (){

    if(this.chest && this.abdomen){


        

        if(this.breathSide > 0){
            //console.log( this.breath )
            this.chest.scalling.z = this.lerp (1,1.16, this.breath*0.02);
            this.abdomen.scalling.z = this.lerp (1,0.9, this.breath*0.02);
        }else{
            // console.log( this.breath )
            this.chest.scalling.z = this.lerp (1.16,1, this.breath*0.02);
            this.abdomen.scalling.z = this.lerp (0.9,1, this.breath*0.02);
        }

        this.breath ++;

        if(this.breath === 50 ){ this.breath = 0; this.breathSide = this.breathSide > 0 ? -1:1; }
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

THREE.Avatar.prototype.lerp = function (a, b, percent) { return a + (b - a) * percent; };

THREE.Avatar.prototype.toRad = function( v ){ return v * 0.0174532925199432957; };

THREE.Avatar.prototype.rotate = function ( v, name, x, y, z ) { 

    var bone = this.skeleton.bones[ this.findID( name ) ];

    var tx = this.rot[name].x;
    var ty = this.rot[name].y;
    var tz = this.rot[name].z;

    if( x !== undefined ) bone.rotation.x = this.lerp( tx, tx + this.toRad(x), v );
    if( y !== undefined ) bone.rotation.y = this.lerp( ty, ty + this.toRad(y), v );
    if( z !== undefined ) bone.rotation.z = this.lerp( tz, tz + this.toRad(z), v );

    bone.updateMatrix();

};

//-----------------------
// BONES animator
//-----------------------

THREE.Avatar.prototype.setBoneAnimation = function ( name, v ) {

    if(this.poses[name] === undefined ) return;

    this.poses[name] = v;

    var anims = name;
    var side = name.substring(0, 1);
    var end = name.substring(name.length -1);

     
    if(side === 'r' || side === 'l' ) anims = name.substring(2);
    if( !isNaN(end) ) anims = anims.substring(0, anims.length -2);

    if( this[anims] ) this[anims]( v, side, end );

};

//-----------------------
//  HAND control
//-----------------------

THREE.Avatar.prototype.fingers = function (v, s){

    var i = 5;
    while(i--){ 
        this.finger( v, s, i );
        this.poses[s + '_finger_' + i] = v;
    }

};

THREE.Avatar.prototype.finger = function (v, s, n){

    if(n === 0 || n === '0' ){
        this.rotate( v , s + 'f_'+n+'_0', s==='r' ? -10 : 10, -10 );
        this.rotate( v , s + 'f_'+n+'_1', s==='r' ? -6 : 6, -20 );
        this.rotate( v , s + 'f_'+n+'_2', null, -45 );

    }else{
        this.rotate( v , s + 'f_'+n+'_0', null, -75 );
        this.rotate( v , s + 'f_'+n+'_1', null, -90 );
        this.rotate( v , s + 'f_'+n+'_2', null, -75 );
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

    this.head.add( this.eyeGroup )

    /*for(var i=0; i<this.skeleton.bones.length; i++){
        if(this.skeleton.bones[i].name === "Head"){ 
            this.skeleton.bones[i].add( this.eyeGroup );
            
            //this.skeleton.bones[i].scale.y = 1.2;
            //console.log(this.skeleton.bones[i].scale)
        }
    }*/

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

    //this.animations.idle_crouch.timeScale = 2;
    this.animations.idle.timeScale = 0.6;


    //this.play("walk", 0);//( name, crossfade, offset )
    this.play( this.cAnimation, 0);

    this.ikSolver = new THREE.CCDIKSolver( this );

};

THREE.Avatar.prototype.playAnimation = function ( name ){

    this.cAnimation = name;
    this.play( this.cAnimation, 0);

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

    if(bvhReader) bvhReader.interface.hide();

    this.mode = 'free';

    this.material.vertexColors = THREE.NoColors;
    this.material.needsUpdate = true;

    this.isAnimation = false;
    this.isBvh = false;

    var i = this.skeleton.bones.length, name;
    while(i--){ 
        name = this.skeleton.bones[i].name;
        if(name.substring(0,2) === 'lf' || name.substring(0,2) === 'rf'){ this.skeleton.bones[i].matrixAutoUpdate = false; }
        else this.skeleton.bones[i].matrixAutoUpdate = true;
    }

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

    //this.play("idle", 0);
    this.play( this.cAnimation, 0);

};

/*THREE.Avatar.prototype.switchToAnimation = function ( b ){

    this.isAnimation = b === undefined ? false : b;

    var i = this.skeleton.bones.length;
    while(i--) this.skeleton.bones[i].matrixAutoUpdate = this.isAnimation;

};*/

THREE.Avatar.prototype.updateAnimation = function (delta){


    if(this.ikSolver) this.ikSolver.update()

    if( !this.isAnimation ) return;

    // Update SEA3D Animations
    THREE.SEA3D.AnimationHandler.update( delta * this.speed );

    // Update Three.JS Animations
    THREE.AnimationHandler.update( delta * this.speed );

    if( this.helper ) this.helper.update();


    if(this.mode === 'play')this.updateKey();

    ;

    this.breathing();

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

    this.breathing();

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