var V = {};

V.Model = function ( type, meshs, txt, morph ) {

    this.geoms = {
        man: meshs.man.geometry.clone(),
        woman: meshs.woman.geometry.clone(),
    }

    this.settings = {

        type:'Standard',
        muscles: 0.1,
        metalness: 0.5,
        roughness: 0.6,
        skinAlpha:0.1,
        oamap: 1,
        lightmap:1,
        shininess:60,
        opacity:1,

    };

    this.ref = meshs;

    this.isFirst = true;

    this.isSkin = false;
    //this.isHelper = false;
    this.debug = false;
    this.isLockHip = true;
    this.isSkeleton = false;

    this.preTime = 0;

    this.f = 0;

    this.breath = 0;
    this.breathSide = -1;

    this.txt = txt;
    this.type = type;

    this.mats = [];

    this.position = new THREE.Vector3();

    var tSize = 1.4;

    var torad = 0.0174532925199432957;

    this.hipPos = new THREE.Vector3();

    this.mesh = type === 'man' ? meshs.man.clone() : meshs.woman.clone();
    this.mesh.name = type;

    this.mtx = new THREE.Matrix4();
    this.matrixWorldInv = new THREE.Matrix4().getInverse( this.mesh.matrixWorld );

    this.bones = this.mesh.skeleton.bones;

    var i, name, bone, lng = this.bones.length, v;

    this.poseMatrix = [];
    this.b = {};

    for( i=0; i<lng; i++){

        v = null;
        bone = this.bones[i];
        name = bone.name;
        bone.name = name;

        if( this.type !== 'man' ){

            if(name === 'lCollar' || name === 'rCollar') v = new THREE.Vector3( 0.9, 1, 1 );
            if(name === 'lShldr'  || name === 'rShldr' ) v = new THREE.Vector3( 0.96, 1, 1 );
            if(name === 'lForeArm' || name === 'rForeArm') v = new THREE.Vector3( 0.96, 1, 1 );
            if(name === 'lHand' || name === 'rHand') v = new THREE.Vector3( 0.95, 0.95, 0.95 );
            if(name.substring(0,2) === 'lf' || name.substring(0,2) === 'rf') v = new THREE.Vector3( 0.95, 1, 1 );

            
        // hand

        }

        if(name === 'abdomen' || name === 'chest') v = new THREE.Vector3( 1, 1, 1 );

        if(v!==null) bone.scalling = v;


        this.b[ name ] = bone;
        this.poseMatrix[i] = bone.matrixWorld.clone();

        if(name === 'hip') this.hipPos.setFromMatrixPosition( this.poseMatrix[i] );

    }

    this.mesh.userData.posY = this.hipPos.y;

    //console.log(this.mesh)

    //this.mesh.setWeight("big", 0.5 );

    this.isWithMorph = morph || false;

    if(this.isWithMorph) this.mesh.morphTargetInfluences[0] = 1;

    //console.log( this.hipPos )

    this.eyes = new THREE.Group();
    this.eyes.add( meshs.eye_left.clone() );
    this.eyes.add( meshs.eye_right.clone() );

    this.eyes.matrix = this.b.head.matrixWorld;
    this.eyes.matrixAutoUpdate = false;

    this.root = new THREE.Group();

    this.root.add( this.eyes );

    this.setMaterial();

    this.mesh.position.copy( this.position );

}


V.Model.prototype = {

    switchGender: function () {

        if(this.type==='man'){

            this.mesh.geometry.dispose();

            this.mesh.geometry.copy( this.geoms.woman )

        }



    },

    addSkeleton: function ( b ) {

        if( b ){
            this.isSkeleton = true;
            this.helper = new THREE.SkeletonHelper( this.b.hip );
            this.helper.skeleton = this.mesh.skeleton;
            this.root.add( this.helper );
        } else {
            if(this.isSkeleton){
                this.root.remove( this.helper );
                this.isSkeleton = false;
            }
        }

    },

    lockHip: function ( b ) {

        this.isLockHip = b;

    },

    reset:function(){

        this.mesh.stopAll();

        var i, name, bone, lng = this.bones.length;


        for( i=0; i<lng; i++){

            bone = this.bones[i];
            bone.matrixWorld.copy( this.poseMatrix[i] );

        }

    },

    setTimescale: function ( v ) {

        this.mesh.setTimeScale( v );

    },

    removeFromScene: function( Scene ){

        Scene.remove( this.mesh );
        Scene.remove( this.root );

        this.isFull = false;

    },

    addToScene: function ( Scene ){

        Scene.add( this.mesh );
        Scene.add( this.root );

        this.isFull = true;

    },

    stop: function (){

        this.mesh.stopAll();

    },

    play: function ( name, crossfade, offset, weight ){

        this.mesh.play( name, crossfade, offset, weight );

    },

    getTime: function () {

        return this.mesh.currentAnimationAction ? this.mesh.currentAnimationAction.time : false;

    },

    setMaterial: function( name ){

        var set = this.settings, m, i;

        if( name !== undefined ) set.type = name;
        var mtype = 'Mesh' + set.type + 'Material';

        i = this.mats.length;
        while(i--) this.mats[i].dispose();
        

        // define new material type
        this.mats = [ new THREE[ mtype ](), new THREE[ mtype ]() ];

        m = this.mats[0];

        if( m.map !== undefined ) m.map = this.txt.avatar_c;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.type === 'man' ? this.txt.avatar_n_m : this.txt.avatar_n_w;
        if( m.lightMap !== undefined ) m.lightMap = this.type === 'man' ? this.txt.avatar_l_m : this.txt.avatar_l_w;
        if( m.aoMap !== undefined ) m.aoMap = this.txt.avatar_ao;
        if( m.bumpMap !== undefined ) m.bumpMap = this.txt.muscular;
        //if( m.emissiveMap !== undefined ) m.emissiveMap = this.txt.transition;;

        if( m.normalScale !== undefined ) m.normalScale = new THREE.Vector2( set.muscles, set.muscles );
        if( m.lightMapIntensity !== undefined ) m.lightMapIntensity = set.lightmap;
        if( m.aoMapIntensity !== undefined ) m.aoMapIntensity = set.oamap;
        if( m.metalness !== undefined ) m.metalness = set.metalness;
        if( m.roughness !== undefined ) m.roughness = set.roughness;
        if( m.shininess !== undefined ) m.shininess = set.shininess;
        if( m.bumpScale !== undefined ) m.bumpScale = set.skinAlpha;
        if( m.opacity !== undefined ) m.opacity = set.opacity;
        if( m.transparent !== undefined ) m.transparent = true;
        //if( m.alphaTest !== undefined ) m.alphaTest = 0.9;
        
    
        if( m.skinning !== undefined ) m.skinning = true;
        if( ( m.morphTargets !== undefined) && this.isWithMorph ) m.morphTargets = true;

        m = this.mats[1];

        if( m.map !== undefined ) m.map = this.txt.eye;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.txt.eye_n;

        if( m.normalScale !== undefined ) m.normalScale = new THREE.Vector2( 1, 1 );
        if( m.metalness !== undefined ) m.metalness = 0.9;
        if( m.roughness !== undefined ) m.roughness = 0.3;

        // apply material
        this.mesh.material = this.mats[0];
        this.eyes.children[0].material = this.mats[1];
        this.eyes.children[1].material = this.mats[1];

    },

    updateMaterial: function(){

        var set = this.settings;
        var m = this.mats[0];

        if( m.normalScale !== undefined ) m.normalScale.set( set.muscles, set.muscles );
        if( m.aoMapIntensity !== undefined ) m.aoMapIntensity = set.oamap;
        if( m.lightMapIntensity !== undefined ) m.lightMapIntensity = set.lightmap;
        if( m.metalness !== undefined ) m.metalness = set.metalness;
        if( m.roughness !== undefined ) m.roughness = set.roughness;
        if( m.bumpScale !== undefined ) m.bumpScale = set.skinAlpha;
        if( m.shininess !== undefined ) m.shininess = set.shininess;
        if( m.opacity !== undefined ) m.opacity = set.opacity;

    },

    getHipPos: function () {

        return this.b.hip.getWorldPosition();

    },

    setPosition: function ( pos ) {

        this.mesh.position.copy( this.position );

    },

    setDebug: function ( b ) {

        this.debug = b;
        this.addHelper( this.debug );

        var i = this.mats.length;
        while( i-- ) this.mats[i].wireframe = this.debug;
        
    },

    breathing: function () {

        if( this.b.chest && this.b.abdomen ){

            if(this.breathSide > 0){
                this.b.chest.scalling.z = Math.lerp (1,1.04, this.breath*0.05);
                this.b.chest.scalling.y = Math.lerp (1,1.02, this.breath*0.05);
                this.b.abdomen.scalling.z = Math.lerp (1,0.92, this.breath*0.05);
            }else{
                this.b.chest.scalling.z = Math.lerp (1.04,1, this.breath*0.05);
                this.b.chest.scalling.y = Math.lerp (1.02,1, this.breath*0.05);
                this.b.abdomen.scalling.z = Math.lerp (0.92,1, this.breath*0.05);
            }

            this.breath ++;

            if( this.breath === 20 ){ this.breath = 0; this.breathSide = this.breathSide > 0 ? -1:1; }
        }

    },

    update: function (){

        this.breathing();

        //this.headMap.update( x, y );
        //if( this.isSkeleton ) this.helper.update();
        if( this.isLockHip ){ 
            //this.b.hip.position.x = 0;
            this.b.hip.position.z = 0;
            this.b.hip.position.y = 0;
        }

    },

    getAnimInfo: function (){

        var anim = this.mesh.currentAnimation;
        if(!anim) return { name: 'none', frame:0 }
        var t = this.mesh.currentAnimationAction.time;
        var f = anim.clip.frameTime;
        var d = anim.clip.duration;
        return { name:anim.name, frame: Math.round(t/f), total:Math.round( d/f ) }

    },
}