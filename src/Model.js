var Model = function ( type, meshs, morph ) {

    if( morph === undefined ) morph = false;

    this.geoms = {
        man: meshs.man.geometry.clone(),
        woman: meshs.woman.geometry.clone(),
    }

    this.settings = {

        type:'Standard',
        color:0xffffff,
        muscles: 0.1,
        metalness: 0.1,
        roughness: 0.4,
        skinAlpha:0.1,
        oamap: 1,
        lightmap:0.6,
        shininess:60,
        opacity:1,
        reflectivity:0.1,

    };

    this.colorBonesName = {

        /*'0x000000': 'root', '0x1600e3': 'hip', '0x2600d8': 'abdomen', '0x86005e': 'chest', '0x880053': 'neck', '0xcb001d': 'head',
        '0x0018ff': 'rThigh', '0x0014ff': 'rShin', '0x0015ff': 'rFoot', '0x0013ff': 'rToe',
        '0x1818e7': 'lThigh', '0x1414eb': 'lShin', '0x1515ec': 'lFoot', '0x1313ee': 'lToe',
        '0x0022ff': 'rCollar', '0x0020ff': 'rShldr', '0x001eff': 'rForeArm', '0x005dff': 'rHand',
        '0x2222dd': 'lCollar', '0x2020df': 'lShldr', '0x1e1ee1': 'lForeArm', '0x5d5da4': 'lHand',
        
        '0x3e3ec1': 'lfinger00', '0x4343be': 'lfinger01', '0x4141c0': 'lfinger02',
        '0x003eff': 'rfinger00', '0x0043ff': 'rfinger01', '0x0041ff': 'rfinger02',
        '0x5454ab': 'lfinger10', '0x0056ff': 'rfinger11', '0x0058ff': 'rfinger12',
        '0x0054ff': 'rfinger10', '0x5656a9': 'lfinger11', '0x5858a7': 'lfinger12',
        '0x4e4eb1': 'lfinger20', '0x5050af': 'lfinger21', '0x0052ff': 'rfinger22',
        '0x004eff': 'rfinger20', '0x0050ff': 'rfinger21', '0x5252ad': 'lfinger22',
        '0x4848b7': 'lfinger30', '0x4a4ab5': 'lfinger31', '0x4c4cb3': 'lfinger32',
        '0x0048ff': 'rfinger30', '0x004aff': 'rfinger31', '0x004cff': 'rfinger32',
        '0x4242bd': 'lfinger40', '0x4444bb': 'lfinger41', '0x4646b9': 'lfinger42',
        '0x0042ff': 'rfinger40', '0x0044ff': 'rfinger41', '0x0046ff': 'rfinger42',*/

        '0x000000': 'root', '0x2d00c8': 'hip', '0x5200b2': 'abdomen', '0xa3001c': 'chest', '0xa20015': 'neck', '0xb00002': 'head',
        '0x0030ff': 'rThigh', '0x002bff': 'rShin', '0x0029ff': 'rFoot', '0x0022ff': 'rToe',
        '0x3030cf': 'lThigh', '0x2b2bd6': 'lShin', '0x2929d8': 'lFoot', '0x2222dd': 'lToe',
        '0x0044ff': 'rCollar', '0x0040ff': 'rShldr', '0x003dff': 'rForeArm', '0xff5f01': 'rHand',
        '0x4444bb': 'lCollar', '0x4040bf': 'lShldr', '0x3d3dc4': 'lForeArm', '0x5f5fa1': 'lHand',
        
        '0x77778a': 'lfinger00', '0x7a7a85': 'lfinger01', '0x797988': 'lfinger02',
        '0x0077ff': 'rfinger00', '0x007aff': 'rfinger01', '0x0079ff': 'rfinger02',

        '0x666698': 'lfinger10', '0x65659b': 'lfinger11', '0x63639d': 'lfinger12',
        '0xff6601': 'rfinger10', '0xff6501': 'rfinger11', '0xff6301': 'rfinger12',

        '0x4e4eb1': 'lfinger20', '0xff6c01': 'lfinger21', '0xff6b01': 'rfinger22',
        '0xff7101': 'rfinger20', '0x0050ff': 'rfinger21', '0x5252ad': 'lfinger22',

        '0x787886': 'lfinger30', '0x74748a': 'lfinger31', '0x72728c': 'lfinger32',
        '0xff7801': 'rfinger30', '0xff7401': 'rfinger31', '0xff7201': 'rfinger32',

        '0x7c7c83': 'lfinger40', '0x7f7f81': 'lfinger41', '0x7d7d83': 'lfinger42',
        '0x007cff': 'rfinger40', '0xff7e01': 'rfinger41', '0xff7d01': 'rfinger42',
        
    };

    this.ref = meshs;

    this.isFirst = true;

    this.isSkin = false;
    //this.isHelper = false;
    this.debug = false;
    this.isLockHip = true;
    this.isSkeleton = false;

    this.center = null;

    this.preTime = 0;

    this.f = 0;

    this.breath = 0;
    this.breathSide = -1;

    this.frame = 0;
    this.frameMax = 0;
    this.frameTime = 0;
    this.currentPlay = '';

    this.isPlay = false;

    this.isMapReady = false;

    this.txt = null;
    this.type = type;

    this.mats = [];

    this.position = new THREE.Vector3();

    this.skell = null;

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

    if( this.isWithMorph ) this.mesh.morphTargetInfluences[0] = 1;

    //console.log( this.hipPos )
    //this.headBoneRef = this.b.head.rotation;

    this.headBoneLook = new THREE.Euler();
    //this.headBonequaternion = new THREE.Quaternion();

    this.eyeTarget = new THREE.Group();//AxisHelper(1);
    this.eyeTarget.position.set(-3.54, 0, -10);

    this.eyes = new THREE.Group();

    this.eye_l = meshs.eye_left.clone();
    this.eye_r = meshs.eye_right.clone();

    this.eyes.add( this.eye_l );
    this.eyes.add( this.eye_r );
    this.eyes.add( this.eyeTarget );

    //this.b.head.add( this.eyes );

    //this.eyes.matrixWorld = this.b.head.matrixWorld;

    this.eyes.matrix = this.b.head.matrixWorld;
    this.eyes.matrixAutoUpdate = false;

    this.root = new THREE.Group();

    this.root.add( this.eyes );

    this.setMaterial();

    this.mesh.position.copy( this.position );

}


Model.prototype = {

    removeTo: function( Scene ){

        this.removeSkeleton();

        Scene.remove( this.mesh );
        Scene.remove( this.root );

        this.isFull = false;

    },

    addTo: function ( Scene ){

        if( this.isSkeleton ) this.addSkeleton();

        Scene.add( this.mesh );
        Scene.add( this.root );

        this.isFull = true;

    },

    // --------------------------
    // HELPER
    // --------------------------

    addHelper: function ( b ) {

        this.center = new THREE.Mesh( new THREE.CircleGeometry(25), new THREE.MeshBasicMaterial({ color:0x00FF00, wireframe:true }) );
        this.center.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI*0.5 ) );
        this.root.add( this.center );

    },

    // --------------------------
    // SKELETON BOX
    // --------------------------

    showSkeleton: function ( b ) {

        if( b ) this.addSkeleton();
        else this.removeSkeleton();
        //this.isSkeleton = b;

    },

    removeSkeleton: function () {

        if( this.skell === null ) return;

        var i = this.skell.children.length;
        while(i--) this.skell.remove( this.skell.children[i] );
        this.root.remove( this.skell );
        this.skell = null;

    },

    addSkeleton: function () {

        if( this.skell !== null ) return;

        var ignor = [ 
            'rThigh', 'lThigh', 'hip', 'rCollar', 'lCollar',
            'rfinger40', 'rfinger30', 'rfinger00', 'rfinger10',
            'lfinger40', 'lfinger30', 'lfinger00', 'lfinger10',
        ]

        this.skell = new THREE.Group();
        this.root.add( this.skell );

        var p1 = new THREE.Vector3();
        var p2 = new THREE.Vector3();

        var geo = new THREE.BoxBufferGeometry( 1, 1, 1 );
        var mat = new THREE.MeshBasicMaterial( { color:0xFFFFFF, wireframe:true, depthTest: true, depthWrite: true } );

        this.meshBones = [];

        var bones = this.bones, bone, mesh, lng, name;

        for ( var i = 0; i < bones.length; i ++ ) {

            bone = this.bones[i];
            name = bone.name;

            if ( bone.parent && bone.parent.isBone ){
                if ( ignor.indexOf(name) === -1 ){

                    p1.setFromMatrixPosition( bone.parent.matrixWorld );
                    p2.setFromMatrixPosition( bone.matrixWorld );

                    lng = p1.distanceTo( p2 );

                    mesh = new THREE.Mesh( geo, mat );
                    mesh.userData.lng = lng;
                    mesh.name = bone.parent.name;

                    if(name.substring(0,2) !== 'lf' && name.substring(0,2) !== 'rf'){

                        mesh.scale.y = 2;
                        mesh.scale.z = 2;
                        
                    } else {
                        mesh.scale.y = 0.5;
                        mesh.scale.z = 0.5;
                    }

                    if( mesh.name==='rHand' || mesh.name==='lHand' ){
                        mesh.scale.y = 2;
                        mesh.scale.y = 3;
                    }

                    if( mesh.name==='head' ){
                        mesh.scale.y = 5;
                        mesh.scale.z = 5;
                    }

                    if( mesh.name==='hip' || mesh.name==='abdomen' || mesh.name==='chest' ){
                        mesh.scale.y = 10;
                        mesh.scale.z = 5;
                    }

                    if( mesh.name==='rCollar' || mesh.name==='lCollar' || mesh.name==='rShldr' || mesh.name==='lShldr' ){
                        mesh.scale.y = 3;
                        mesh.scale.z = 3;
                    }

                    if( mesh.name==='rThigh' || mesh.name==='lThigh' ){
                        mesh.scale.y = 4;
                        mesh.scale.z = 4;
                    }
                    if( mesh.name==='rShin' || mesh.name==='lShin' ){
                        mesh.scale.y = 3;
                        mesh.scale.z = 3;
                    }
                    if( mesh.name==='lFoot' || mesh.name==='rFoot' || mesh.name==='lToe' || mesh.name==='rToe' ){
                        mesh.scale.y = 3;
                        mesh.scale.z = 2;
                    }

                    this.skell.add( mesh );
                    bone.userData.mesh = mesh;

                }

            }

        }


    },

    // --------------------------
    // ANIMATION
    // --------------------------

    update: function ( delta ){

        THREE.SEA3D.AnimationHandler.update( delta );

        this.getAnimInfo();
        this.breathing();
        this.look();

        if( this.isLockHip ){ 
            //this.b.hip.position.x = 0;
            this.b.hip.position.z = 0;
            this.b.hip.position.y = 0;
        }

        if( this.center !== null ){ 
            this.center.position.copy( this.getHipPos() );
            this.center.position.y = 0;
        }

        if( gui ) gui.updateTimeBarre( this );

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

    stop: function (){

        this.mesh.stopAll();
        this.isPlay = false;

    },

    play: function ( name, crossfade, offset, weight ){

        this.unPause();
        this.mesh.play( name, crossfade, offset, weight );

    },

    playOne: function ( f ) {

        var offset = f * this.frameTime;
        this.mesh.play( this.currentPlay, 0, offset, 1 );
        this.pause();

    },

    pause: function () {

        this.mesh.pauseAll();
        this.isPlay = false;

    },

    unPause: function () {

        this.mesh.unPauseAll();
        this.isPlay = true;

    },

    getTime: function () {

        return this.mesh.currentAnimationAction ? this.mesh.currentAnimationAction.time : false;

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

    look: function () {

        var v = view.getMouse();

        if( this.isPlay ){ 

            this.headBoneLook.set( -(v.x*20) * Math.torad, (v.y*20) * Math.torad, 0 );
            this.b.head.quaternion.setFromEuler( this.headBoneLook, false );

            //this.headBoneRef = this.b.head.rotation.clone();
            //this.b.head.rotation.set( this.headBoneRef.x-(((v.x*6))*Math.torad), this.headBoneRef.y+(((v.y*6)+4)*Math.torad), this.headBoneRef.z);
        }
        
        this.eyeTarget.position.set(-3.54+(-v.y*3), (-v.x*3), -10);
        this.eye_l.lookAt( this.eyeTarget.position.clone().add(new THREE.Vector3(0,-1.4,0)) );
        this.eye_r.lookAt( this.eyeTarget.position.clone().add(new THREE.Vector3(0,1.4,0)) );

    },

    
    getAnimInfo: function (){

        var anim = this.mesh.currentAnimation;
        //var anim = this.mesh.currentAnimationAction;

        if( !anim ){

            this.frame = 0;
            this.frameMax = 0;
            this.currentPlay = '';

        } else {

            this.frameTime = anim.clip.frameTime;
            var f = 1 / this.frameTime;
            this.frame = Math.round( this.mesh.currentAnimationAction.time * f );
            this.frameMax = Math.round( anim.clip.duration * f );
            this.currentPlay = anim.name;

        }

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

    // --------------------------
    // MATERIAL
    // --------------------------

    swapMaterial: function ( b ){

        if(b){ 
            this.mesh.material = this.mats[2];
            this.mats[1].visible = false;
        } else {
            this.mesh.material = this.mats[0];
            this.mats[1].visible = true;
        }

    },

    updateMaterial: function (){

        this.mats[0].needsUpdate = true;
        this.mats[1].needsUpdate = true;
        this.mats[2].needsUpdate = true;

    },

    setEnvmap: function () {

        this.mats[0].envMap = view.getEnvmap();
        this.mats[1].envMap = view.getEnvmap();

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

        if( m.color !== undefined ) m.color = new THREE.Color( set.color );
        

        if( m.normalScale !== undefined ) m.normalScale = new THREE.Vector2( set.muscles, set.muscles );
        if( m.lightMapIntensity !== undefined ) m.lightMapIntensity = set.lightmap;
        if( m.aoMapIntensity !== undefined ) m.aoMapIntensity = set.oamap;
        if( m.metalness !== undefined ) m.metalness = set.metalness;
        if( m.roughness !== undefined ) m.roughness = set.roughness;
        if( m.shininess !== undefined ) m.shininess = set.shininess;
        if( m.bumpScale !== undefined ) m.bumpScale = set.skinAlpha;
        if( m.opacity !== undefined ) m.opacity = set.opacity;
        if( m.transparent !== undefined ) m.transparent = true;
        if( m.reflectivity !== undefined ) m.reflectivity = set.reflectivity;
        if( m.shadowSide !== undefined ) m.shadowSide = true;
        
        //if( m.alphaTest !== undefined ) m.alphaTest = 0.9;
        
    
        if( m.skinning !== undefined ) m.skinning = true;
        if( ( m.morphTargets !== undefined) && this.isWithMorph ) m.morphTargets = true;

        m = this.mats[1];

        if( m.normalScale !== undefined ) m.normalScale = new THREE.Vector2( 0.5, 0.5 );
        if( m.metalness !== undefined ) m.metalness = 0.5;
        if( m.roughness !== undefined ) m.roughness = 0.1;
        if( m.reflectivity !== undefined ) m.reflectivity = 0.5;

        // apply material
        this.mesh.material = this.mats[0];
        this.eyes.children[0].material = this.mats[1];
        this.eyes.children[1].material = this.mats[1];

        m = this.mats[2];
        m.skinning = true;

        // shader modification
        shader.change( this.mats[0] );

        if(this.isMapReady) this.setTextures();

    },

    setTextures: function ( txt, debug ) {

        if( txt !== undefined ) this.txt = txt;

        var m = this.mats[0];

        if( m.map !== undefined ) m.map = debug ? this.txt.UV_Grid_Sm : this.txt.avatar_c;
        if( m.envMap !== undefined ) m.envMap = view.getEnvmap();
        //if( m.alphaMap !== undefined ) m.alphaMap = this.type === 'man' ? this.txt.avatar_skin_n_m : this.txt.avatar_skin_n_w;
        if( m.normalMap !== undefined ) m.normalMap = this.type === 'man' ? this.txt.avatar_n_m : this.txt.avatar_n_w;
        if( m.lightMap !== undefined ) m.lightMap = this.type === 'man' ? this.txt.avatar_l_m : this.txt.avatar_l_w;
        if( m.aoMap !== undefined ) m.aoMap = this.txt.avatar_ao;
        if( m.bumpMap !== undefined ) m.bumpMap = this.txt.muscular;

        m = this.mats[1];

        if( m.map !== undefined ) m.map = this.type === 'man' ? this.txt.eye_m : this.txt.eye_w;
        if( m.envMap !== undefined ) m.envMap = view.getEnvmap();
        if( m.normalMap !== undefined ) m.normalMap = this.txt.eye_n;
        if( m.lightMap !== undefined ) m.lightMap = this.txt.eye_l;

        m = this.mats[2];
        m.map = this.txt.avatar_id;

        this.updateMaterial();

        this.isMapReady = true;

    },

    updateSetting: function(){

        var set = this.settings;
        var m = this.mats[0];

        if( m.color !== undefined ) m.color.setHex( set.color );
        if( m.normalScale !== undefined ) m.normalScale.set( set.muscles, set.muscles );
        if( m.aoMapIntensity !== undefined ) m.aoMapIntensity = set.oamap;
        if( m.lightMapIntensity !== undefined ) m.lightMapIntensity = set.lightmap;
        if( m.metalness !== undefined ) m.metalness = set.metalness;
        if( m.roughness !== undefined ) m.roughness = set.roughness;
        if( m.bumpScale !== undefined ) m.bumpScale = set.skinAlpha;
        if( m.shininess !== undefined ) m.shininess = set.shininess;
        if( m.opacity !== undefined ) m.opacity = set.opacity;
        if( m.reflectivity !== undefined ) m.reflectivity = set.reflectivity;

    },


    // --------------------------
    // BONES
    // --------------------------

    setScale: function ( axe, v ){

        if(this.boneSelect===null) return;
        this.boneSelect.scale[ axe ] = v;

    },

    setScalling: function ( axe, v ){

        if(this.boneSelect===null) return;
        this.boneSelect.scalling[ axe ] = v;

    },

    hideBones: function () {

        this.boneSelect = null;
        this.mats[0].vertexColors = THREE.NoColors;
        this.mats[0].needsUpdate = true

    },

    showBones: function ( color ) {

        var i, lng, n, n4, w0, w1, w2, w3, x, id, existe = false;

        var name = this.colorBonesName[ color ];

        console.log(color, name)

        if( color === '0x1100e5' ){
            if( this.type === 'man' ) name = 'hip';
            else name = 'chest'; 
        }

        if( this.b[name] !== undefined ) existe = true;
        if( name === 'root' ) existe = false

        if( !existe ){
            if( gui ) gui.setBones('none');
            this.hideBones();
            return;}
    
        this.boneSelect = this.b[name];
        id = this.bones.indexOf( this.boneSelect );
        this.mats[0].vertexColors = THREE.VertexColors;
        this.mats[0].needsUpdate = true;
        
        if( gui ) gui.setBones( name, id, this.boneSelect.scalling );

        // update vertex color

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

    },

}