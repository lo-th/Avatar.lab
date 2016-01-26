THREE.Avatar = function () {

    this.gender = "woman";

    //THREE.SkinnedMesh.call( this );

    this.type = 'Avatar';
    this.isReady = false;

    this.helper = null;

};


THREE.Avatar.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.Avatar.prototype.constructor = THREE.Avatar;

THREE.Avatar.prototype.init = function ( Geos, Bvh ){

    this.material = new THREE.MeshStandardMaterial({ skinning: true,  morphTargets:true, metalness:0.4, roughness:0.5, normalScale:new THREE.Vector2( 0.5, 0.5 ) });

    this.geos = Geos;
    this.bvh = Bvh;

    this.decal = new THREE.Vector3(0,-11.5,0);

    THREE.SkinnedMesh.call( this, this.geos[this.gender], this.material );

    this.castShadow = true;
    this.receiveShadow = true;
    this.preservesBoneSize = true;

    for(var i=0; i<this.skeleton.bones.length; i++){
        this.skeleton.bones[i].matrixAutoUpdate = false;
    }

    this.addEyes();

    this.isReady = true;

};

THREE.Avatar.prototype.addEyes = function (){

    this.eyeMaterial = new THREE.MeshStandardMaterial({ metalness:0.7, roughness:0.3, normalScale:new THREE.Vector2( 1.5, 1.5 ) });

    var eyeGroup = new THREE.Group();
    var eyeL = new THREE.Mesh( this.geos['eye'], this.eyeMaterial );
    var eyeR = new THREE.Mesh( this.geos['eye'], this.eyeMaterial );
    eyeL.position.y = -1.39;
    eyeR.position.y = 1.39;
    eyeGroup.position.set(-3.57, 0, -3.1895);
    eyeGroup.add( eyeL );
    eyeGroup.add( eyeR );

    this.target = new THREE.Vector3();//Group();
    this.target.z = -40;// distance
    this.target.x = 0;//-5; // up/down
    //eyeCenter.position.y = 10; // left/right

    eyeL.lookAt( this.target );
    eyeR.lookAt( this.target );

    for(var i=0; i<this.skeleton.bones.length; i++){
        if(this.skeleton.bones[i].name === "Head") this.skeleton.bones[i].add(eyeGroup);
    }

};

THREE.Avatar.prototype.switchGender = function (){

    if(this.gender == 'woman') this.gender = 'man';
    else this.gender = 'woman';

    this.geometry = this.geos[this.gender];
    this.updateSkin();

};

THREE.Avatar.prototype.addHelper = function (){

    this.helper = new THREE.SkeletonHelper(this);
    scene.add(this.helper);

};

THREE.Avatar.prototype.removeHelper = function (){

    scene.remove(this.helper);
    this.helper = null;

};

THREE.Avatar.prototype.updateSkin = function (){

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

    //var i = len;
    //while(i--){
    for(var i=0; i<len; i++){
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
            if( this.preservesBoneSize ){
                if( name !== 'Hips' ){
                    tmpMtx.identity().getInverse( parentMtx );
                    scaleMtx.identity();
                    if( this.gender == 'woman' ){
                        if(name==='LeftCollar' || name==='RightCollar') scaleMtx.scale( new THREE.Vector3(0.75,1,1));
                        if(name==='LeftUpArm'  || name==='RightUpArm' ) scaleMtx.scale( new THREE.Vector3(0.90,1.18,1.18));
                        if(name==='LeftLowArm' || name==='RightLowArm') scaleMtx.scale( new THREE.Vector3(0.90,1.2,1.2));
                    } else {
                        if(name==='Chest' ) scaleMtx.scale(new THREE.Vector3(1,1.1,1));
                        if(name==='Spine1') scaleMtx.scale(new THREE.Vector3(1,1.15,1));
                        //if(name==='LeftCollar' || name==='RightCollar') scaleMtx.scale(new THREE.Vector3(0.75,1,1));
                        if(name==='LeftUpLeg'  || name==='RightUpLeg' ) scaleMtx.scale( new THREE.Vector3(1,1.2,1.2) );
                        if(name==='LeftLowLeg' || name==='RightLowLeg') scaleMtx.scale( new THREE.Vector3(1,1.1,1.1) );
                        if(name==='LeftUpArm'  || name==='RightUpArm' ) scaleMtx.scale( new THREE.Vector3(0.90,1.2,1.2) );
                        if(name==='LeftLowArm' || name==='RightLowArm') scaleMtx.scale( new THREE.Vector3(0.90,1.25,1.25) );
                    }

                    tmpPos.setFromMatrixPosition( bone.matrix );
                    localMtx.multiplyMatrices( tmpMtx, globalMtx );
                    localMtx.multiplyMatrices( localMtx, scaleMtx );
                    localMtx.setPosition( tmpPos );

                    globalMtx.multiplyMatrices( parentMtx, localMtx );
                } else { // hips scale
                    scaleMtx.identity();
                    scaleMtx.scale( new THREE.Vector3(1,1,1) );
                    globalMtx.multiplyMatrices( globalMtx, scaleMtx );
                }


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

    if(this.helper) this.helper.update();
       
};

