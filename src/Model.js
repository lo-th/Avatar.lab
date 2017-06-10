var V = {};

V.Model = function ( type, meshs, morph ) {

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

    this.colorBones = [
        "0x000000",//root
        "0x1600e3",// hip
        "0x2600d8",// abdomen
        "0x0018ff",//rThigh
        "0x1818e7",//lThigh
        "0x86005e",//chest
        "0x1414eb",//lShin
        "0x0014ff",//rShin
        "0x0015ff",//rFoot
        "0x0022ff",//rCollar
        "0x1515ec",//lFoot
        "0x880053",//neck
        "0x2222dd",//lCollar
        "0x1313ee",//lToe
        "0x2020df",//lShldr
        "0x0020ff",//rShldr
        "0xcb001d",// head
        "0x0013ff",//rToe
        "0x001eff",//rForeArm
        "0x1e1ee1",//lForeArm
        "0x5d5da4",//lHand
        "0x005dff",//rHand
        "0x004eff",//rfinger20
        "0x5454ab",//lfinger10
        "0x003eff",//rfinger00
        "0x0054ff",//rfinger10
        "0x3e3ec1",//lfinger00
        "0x4e4eb1",//lfinger20
        "0x0048ff",//rfinger30
        "0x0042ff",//rfinger40
        "0x4848b7",//lfinger30
        "0x4242bd",//lfinger40
        "0x004aff",//rfinger31
        "0x4a4ab5",//lfinger31
        "0x4444bb",//lfinger41
        "0x5050af",//lfinger21
        "0x5656a9",//lfinger11
        "0x0043ff",//rfinger01
        "0x0050ff",//rfinger21
        "0x4343be",//lfinger01
        "0x0056ff",//rfinger11
        "0x0044ff",//rfinger41
        "0x0058ff",//rfinger12
        "0x0041ff",//rfinger02
        "0x0052ff",//rfinger22
        "0x4646b9",//lfinger42
        "0x4c4cb3",//lfinger32
        "0x004cff",//rfinger32
        "0x5252ad",//lfinger22
        "0x4141c0",//lfinger02
        "0x0046ff",//rfinger42
        "0x5858a7"//lfinger12
    ]

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

    this.txt = null;
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
    this.bonesNames = [];
    this.b = {};

    for( i=0; i<lng; i++){

        v = new THREE.Vector3( 1, 1, 1 );
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
        this.bonesNames.push( name );
        this.poseMatrix[i] = bone.matrixWorld.clone();



        if(name === 'hip') this.hipPos.setFromMatrixPosition( this.poseMatrix[i] );

    }

    this.mesh.userData.posY = this.hipPos.y;

    this.geometry = this.mesh.geometry;

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

    swapMaterial: function ( b ){

        if(b){ 
            this.mesh.material = this.mats[2];
            this.mats[1].visible = false;
        } else {
            this.mesh.material = this.mats[0];
            this.mats[1].visible = true;
        }

    },

    upTexture: function (){

        this.mats[0].needsUpdate = true;
        this.mats[1].needsUpdate = true;
        this.mats[2].needsUpdate = true;

    },

    setTextures: function ( txt ) {

        this.txt = txt;

        var m = this.mats[0];

        if( m.map !== undefined ) m.map = this.txt.avatar_c;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.type === 'man' ? this.txt.avatar_n_m : this.txt.avatar_n_w;
        if( m.lightMap !== undefined ) m.lightMap = this.type === 'man' ? this.txt.avatar_l_m : this.txt.avatar_l_w;
        if( m.aoMap !== undefined ) m.aoMap = this.txt.avatar_ao;
        if( m.bumpMap !== undefined ) m.bumpMap = this.txt.muscular;

        m = this.mats[1];

        if( m.map !== undefined ) m.map = this.txt.eye;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.txt.eye_n;

        m = this.mats[2];
        m.map = this.txt.avatar_id;

        this.upTexture();

    },

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
        this.mats = [ new THREE[ mtype ](), new THREE[ mtype ](), new THREE.MeshBasicMaterial() ];

        m = this.mats[0];

        /*if( m.map !== undefined ) m.map = this.txt.avatar_c;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.type === 'man' ? this.txt.avatar_n_m : this.txt.avatar_n_w;
        if( m.lightMap !== undefined ) m.lightMap = this.type === 'man' ? this.txt.avatar_l_m : this.txt.avatar_l_w;
        if( m.aoMap !== undefined ) m.aoMap = this.txt.avatar_ao;
        if( m.bumpMap !== undefined ) m.bumpMap = this.txt.muscular;
        //if( m.emissiveMap !== undefined ) m.emissiveMap = this.txt.transition;;*/

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

        /*if( m.map !== undefined ) m.map = this.txt.eye;
        if( m.envMap !== undefined ) m.envMap = this.txt.env;
        if( m.normalMap !== undefined ) m.normalMap = this.txt.eye_n;*/

        if( m.normalScale !== undefined ) m.normalScale = new THREE.Vector2( 1, 1 );
        if( m.metalness !== undefined ) m.metalness = 0.9;
        if( m.roughness !== undefined ) m.roughness = 0.3;

        // apply material
        this.mesh.material = this.mats[0];
        this.eyes.children[0].material = this.mats[1];
        this.eyes.children[1].material = this.mats[1];

        m = this.mats[2];
        m.skinning = true;




        //this.showBones('lShin')

        

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

    /*findID: function ( name ){

        return this.bonesNames.indexOf(name);

    },*/

    setScalling: function ( axe, v ){

        if(this.boneSelect===null) return;
        this.boneSelect.scalling[ axe ] = v;

    },

    hideBones: function () {

        this.boneSelect = null;
        this.mats[0].vertexColors = THREE.NoColors;
        this.mats[0].needsUpdate = true

    },

    showBones: function ( name ) {

        var i, lng, n, n4, w0, w1, w2, w3, x;

        var id = id = this.colorBones.indexOf(name);

        if( name === '0x1100e5' ){
            if(this.type === 'man' ) id = 1;
            else id = 5; 
        }

        if(id === -1) this.bonesNames.indexOf( name );

     

        if(id === -1) return;

        if( id === 0 ){
            this.hideBones()
            return;
        } else {
            this.boneSelect = this.bones[id];
            this.mats[0].vertexColors = THREE.VertexColors;
            this.mats[0].needsUpdate = true;
        }

        


        if(gui){

            gui.setBones( this.bonesNames[id], id, this.boneSelect.scalling );

        }

        

        

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
        //this.mats[0].vertexColors = THREE.VertexColors;

    },

}