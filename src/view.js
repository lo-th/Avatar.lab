var view = ( function () {

'use strict';

var renderer, scene, camera, controler, transformer, clock, plane, materialShadow, ambient, light, debug, follow;
var grid = null, capturer = null;
var vs = { w:1, h:1, mx:0, my:0 };
var t = { now:0, delta:0, then:0, inter:0, tmp:0, n:0 };
var isCaptureMode = false;
var isCapture = false;

var setting = {

    gammaInput: true,
    gammaOutput: true,

    // toneMapping
    exposure: 2.2,
    whitePoint: 2.2,
    tone: "Uncharted2",

};

var toneMappings;

view = {

    framerate: 60,

    pixelRatio : 1,

    isMobile: false,
    isShadow: false,
    isGrid: false,

    videoSize: [1920/3,1080/3],

    update: function (  ) {

        var delta = clock.getDelta();
        if( avatar ) avatar.update( delta );
        
    },

    render: function () {

        requestAnimationFrame( view.render );

        TWEEN.update();

        t.now = ( typeof performance === 'undefined' ? Date : performance ).now();
        t.delta = t.now - t.then;

        if ( t.delta > t.inter ) {

            t.then = t.now - ( t.delta % t.inter );

            view.update( t.delta );

            renderer.render( scene, camera );

            if( isCapture ) capturer.capture( renderer.domElement );

            if ( t.now - 1000 > t.tmp ){ 
                t.tmp = t.now; 
                debug.innerHTML = t.n;
                t.n = 0;
            }

            t.n++;

        }

    },

    resize: function ( e, w, h ) {

        vs.w = window.innerWidth;
        vs.h = window.innerHeight;

        w = w || vs.w;
        h = h || vs.h;

        renderer.setSize( w, h );

        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        if( gui ) gui.resize();

    },

    setFramerate: function ( n ) {

        view.framerate = n; 
        t.inter = 1000 / view.framerate;

    },

    move: function ( e ) {

        vs.mx = ( e.clientX / vs.w ) * 2 - 1;
        vs.my = ( e.clientY / vs.h ) * 2 - 1;

    },

    getRenderer: function () { return renderer; },
    getControler: function () { return controler; },
    getCamera: function () { return camera; },
    getScene: function () { return scene; },

    init: function ( container ) {

        toneMappings = {
            None: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Uncharted2: THREE.Uncharted2ToneMapping,
            Cineon: THREE.CineonToneMapping
        };

        clock = new THREE.Clock();

        t.then = ( typeof performance === 'undefined' ? Date : performance ).now();
        t.inter = 1000 / this.framerate;

        this.testMobile();

        vs.w = window.innerWidth;
        vs.h = window.innerHeight;

        //renderer = new THREE.WebGLRenderer({ precision: "mediump", antialias:false, alpha: this.isMobile ? false : true });

        renderer = new THREE.WebGLRenderer({ precision: "highp", antialias: this.isMobile ? false : true, alpha: this.isMobile ? false : true });

        view.pixelRatio = 1;//window.devicePixelRatio;//this.isMobile ? 0.5 : window.devicePixelRatio;
        renderer.setPixelRatio( view.pixelRatio );
        renderer.setSize( vs.w, vs.h );
        container.appendChild( renderer.domElement );

        view.setTone();

        debug = document.createElement('div');
        debug.className = 'debug';
        container.appendChild( debug );

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 50, vs.w / vs.h , 1, 1000 );
        camera.position.set( 0, 50, 300 );
        controler = new THREE.OrbitControls( camera, renderer.domElement );
        controler.target.set( 0, 50, 0 );
        controler.enableKeys = false;
        controler.update();

        follow = new THREE.Group();
        scene.add( follow );

        //transformer = new THREE.TransformControls( camera, renderer.domElement );
        //scene.add( transformer );

        if( this.isMobile ) renderer.setClearColor( 0x333333, 1 );
        else renderer.setClearColor( 0x000000, 0 );

        window.addEventListener( 'resize', this.resize, false );

        //this.addGrid();
        this.addLight();
        this.addShadow( this.isMobile ? false : true );

        requestAnimationFrame( this.render );

        this.autoRotate( { distance:80, polar:75, azim:15 } );

    },

    setPixelRatio: function (b) {

        if(b){
            view.pixelRatio = 0.5;
        } else {
            view.pixelRatio = 1;
        }

        renderer.setPixelRatio( view.pixelRatio );

    },

    // GRID

    addGrid: function ( b ) {

        if(b){

            if( view.isGrid ) return;

            grid = new THREE.GridHelper( 50, 20, 0xFFFFFF, 0xAAAAAA );
            grid.material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors, transparent:true, opacity:0.25 } );
            scene.add( grid );
            view.isGrid = true;

        } else {

            if( !view.isGrid ) return;

            scene.remove( grid );
            grid.material.dispose();
            grid = null;
            view.isGrid = false;

        }

    },

    // TONE

    setTone : function( v ) {

        var tonesTypes = ['None', 'Linear', 'Reinhard', 'Uncharted2', 'Cineon'];

        renderer.gammaInput = setting.gammaInput;
        renderer.gammaOutput = setting.gammaOutput;

        var nup = false;

        if(v!==undefined){
            if( tonesTypes.indexOf(v) !== -1 ) setting.tone = v;
            nup = true;
        }

        renderer.toneMapping = toneMappings[ setting.tone ];
        renderer.toneMappingExposure = setting.exposure;
        renderer.toneMappingWhitePoint = setting.whitePoint;

        if(nup){

            //main.updateMaterials();

            //deskdemo.forceUpdate();

        }

        //view.setLightIntensity();

        //if( materials[0] && nup ) materials[0].needsUpdate = true;


    },

    // LIGHT

    addLight: function () {

        //ambient = new THREE.AmbientLight( 0x333333 );
        //scene.add( ambient );

        light = new THREE.DirectionalLight( 0xffffff, 0.5 );
        light.position.set(50,300,100);
        light.lookAt( new THREE.Vector3( 0,0,0) );
        follow.add( light );

        var pl1 = new THREE.PointLight( 0xfdfdfd, 0.4 );
        pl1.position.set( 75, 25, 58 );
        pl1.position.multiplyScalar( 10 );
        follow.add( pl1 );

        var pl2 = new THREE.PointLight( 0xbab8ba, 0.2 );
        pl2.position.set( -12, 37, -79 );
        pl2.position.multiplyScalar( 10 );
        follow.add( pl2 );

        var pl3 = new THREE.PointLight( 0xcaae7c, 0.1 );
        pl3.position.set( 30, 78, 52 );
        pl3.position.multiplyScalar( 10 );
        follow.add( pl3 );

    },

    // SHADOW

    addShadow: function ( b ) {

        if( b ){

            if( view.isShadow ) return;

            view.isShadow = true;

            renderer.shadowMap.enabled = true;
            renderer.shadowMap.soft = view.isMobile ? false : true;
            renderer.shadowMap.type = view.isMobile ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
            renderer.shadowMap.renderReverseSided = false;

            //materialShadow = new THREE.MeshLambertMaterial(  );

            materialShadow = new THREE.ShaderMaterial( THREE.ShaderShadow );
            plane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), materialShadow );
            plane.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI*0.5 ) );
            //plane.position.y = -62;
            plane.castShadow = false;
            plane.receiveShadow = true;
            follow.add( plane );

            var d = 100;
            var camShadow = new THREE.OrthographicCamera( d, -d, d, -d,  100, 500 );
            light.shadow = new THREE.LightShadow( camShadow );
            light.shadow.mapSize.width = view.isMobile ? 512 : 1024;
            light.shadow.mapSize.height = view.isMobile ? 512 : 1024;
            light.castShadow = true;

        } else {

            if( !view.isShadow ) return;

            view.isShadow = false;

            renderer.shadowMap.enabled = false;
            light.castShadow = false;

            follow.remove( plane );
            materialShadow.dispose();
            plane.geometry.dispose();

        }

    },

    // CAPTURE

    getCaptueMode: function () { return isCaptureMode },

    captureMode: function ( b ) {

        isCaptureMode = b;

        if( isCaptureMode ){

            window.removeEventListener( 'resize', view.resize );

            renderer.domElement.style.position = "absolute";
            renderer.domElement.style.left = "50%";
            renderer.domElement.style.top = "50%";
            renderer.domElement.style.border = '1px solid #F00';

            view.setVideoSize();
            view.initCapture();

        } else {

            renderer.domElement.style.position = "absolute";
            renderer.domElement.style.left = "0px";
            renderer.domElement.style.top = "0px";
            renderer.domElement.style.margin = '0px 0px';
            renderer.domElement.style.border = 'none';

            window.addEventListener( 'resize', view.resize );
            view.resize();

        }

    },

    setVideoSize: function ( v ) {

        if( !isCaptureMode ) return;

        if( v !== undefined ) view.videoSize = v;

        var w = view.videoSize[0];
        var h = view.videoSize[1];
        renderer.domElement.style.margin = (-h*0.5)+'px '+ (-w*0.5)+'px';
        view.resize( null, w, h );

    },

    initCapture: function () {

        if( capturer !== null ) return;

        capturer = new CCapture( {

            verbose: false,
            display: false,
            framerate: view.framerate,
            //motionBlurFrames: 1,//( 960 / framerate ) * 0 ,
            quality: 80,
            format:"webm-mediarecorder",
            //format:"webm",
            currentTime:0,
            timeLimit: 4,
            frameLimit: 0,
            autoSaveTime: 0,
            //autoSaveTime:10,
            //workersPath:'./js/',
            //timeLimit: 60,//second
            //frameLimit: 0,
            //autoSaveTime: 0,
            //onProgress: function( p ) { progress.style.width = ( p * 100 ) + '%' }
        });

        console.log(capturer)

    },

    startCapture: function () {

        if( !isCaptureMode ) return;
        if( isCapture ) return;

        renderer.setClearColor( 0x00FF00, 1 );
        capturer.start();
        isCapture = true;

    },

    saveCapture: function () {

        if( !isCaptureMode ) return;
        if( !isCapture ) return;

        
        capturer.stop();
        capturer.save();
        
        if( view.isMobile ) renderer.setClearColor( 0xffd400, 1 );
        else renderer.setClearColor( 0x000000, 0 );
        isCapture = false;

    },

    // MOBILE SUPPORT

    testMobile: function () {

        var n = navigator.userAgent;
        if (n.match(/Android/i) || n.match(/webOS/i) || n.match(/iPhone/i) || n.match(/iPad/i) || n.match(/iPod/i) || n.match(/BlackBerry/i) || n.match(/Windows Phone/i)) view.isMobile = true;
        else view.isMobile = false;  

    },


    // MODEL ADD

    addUV2: function( geometry ){

        if( geometry ) geometry.addAttribute( 'uv2', geometry.attributes.uv );

    },

    correctMorph: function ( name, meshs ){

        //var morph = ['_open', '_close', '_sad', '_happy' ];
        var morph = ['big' ];

        for( var i=0; i < morph.length; i++ ) {

            meshs[name].geometry.morphAttributes.position[i].array = meshs[name+'_'+morph[i]].geometry.attributes.position.array;
            meshs[name].geometry.morphAttributes.normal[i].array = meshs[name+'_'+morph[i]].geometry.attributes.normal.array;

        }

    },

    reversUV: function ( geometry ){

        // correct inversion of normal map in symetrics mesh

        var uv = geometry.attributes.uv.array;
        var i = Math.floor(uv.length * 0.25);
        while( i-- ) uv[ i * 2 ] *= -1;
        geometry.attributes.uv.needsUpdate = true;

        // for ao map
        view.addUV2( geometry );

    },


    // SHADER HACK

    uniformPush : function( type, name, value ){

        type = type || 'physical';
        THREE.ShaderLib[type].uniforms[name] = value;
        THREE['Mesh' + 'Standard' + 'Material'][name] = value;

    },

    shaderRemplace : function( type, shad, word, re ){

        type = type || 'physical';
        shad = shad || 'fragment';

        THREE.ShaderLib[type][shad+'Shader'] = THREE.ShaderLib[type][shad+'Shader'].replace(word, re);

    },

    shaderPush : function( type, shad, add ){

        type = type || 'physical';
        shad = shad || 'fragment';

        add.push(" ");
        THREE.ShaderLib[type][shad+'Shader'] = add.join("\n") + THREE.ShaderLib[type][shad+'Shader'];

    },

    shaderMain : function( type, shad, add ){

        type = type || 'physical';
        shad = shad || 'fragment';

        add.push("} ");

        THREE.ShaderLib[type][shad+'Shader'] = THREE.ShaderLib[type][shad+'Shader'].substring( 0, THREE.ShaderLib[type][shad+'Shader'].length-2 );
        THREE.ShaderLib[type][shad+'Shader'] += add.join("\n");

    },

    // CAMERA AUTO CONTROL

    autoRotate: function ( obj, time, delay, callback ) {

        callback = callback || function(){};

        var c = view.getCurrentPosition();
        controler.enabled = false;

        new TWEEN.Tween( c ).to( obj, time || 2000 )
        .delay( delay || 0 )
        .easing( TWEEN.Easing.Quadratic.Out )
        .onUpdate( function() { view.orbit( c ); } )
        .onComplete( function() { controler.enabled = true;  callback(); } )
        .start();

    },

    orbit: function ( c ) {

        var phi = c.polar * Math.torad;
        var theta = c.azim * Math.torad;

        controler.target.fromArray( c.target );
        camera.position.copy( controler.target );
        camera.position.x += c.distance * Math.sin(phi) * Math.sin(theta);
        camera.position.y += c.distance * Math.cos(phi);
        camera.position.z += c.distance * Math.sin(phi) * Math.cos(theta);
        controler.update();

    },

    getCurrentPosition: function ( log ) {

    	var p = {};
        var t = controler.target;
        var c = camera.position;
        p.target = t.toArray();
        p.distance = Math.floor( c.distanceTo( t ) );
        p.polar = Math.floor( controler.getPolarAngle() * Math.todeg );
        p.azim = Math.floor( controler.getAzimuthalAngle() * Math.todeg );
        if( log ) console.log( JSON.stringify( p ) );
        return p;

    }



}



return view;

})();


//-----------------------
// force local scalling
//-----------------------

THREE.Skeleton.prototype.update = ( function () {

    var offsetMatrix = new THREE.Matrix4();
    var identityMatrix = new THREE.Matrix4();
    var scaleMatrix = new THREE.Matrix4();
    var decal = new THREE.Vector3();

    return function update() {

        var bones = this.bones;
        var boneInverses = this.boneInverses;
        var boneMatrices = this.boneMatrices;
        var boneTexture = this.boneTexture;

        // flatten bone matrices to array

        for ( var i = 0, il = bones.length; i < il; i ++ ) {

            // compute the offset between the current and the original transform

            var matrix = bones[ i ] ? bones[ i ].matrixWorld : identityMatrix;

            if( bones[ i ].scalling !== undefined ){

                matrix.scale( bones[ i ].scalling );

                for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

                    scaleMatrix = matrix.clone();
                    scaleMatrix.multiply( bones[ i ].children[ j ].matrix.clone() )

                    //scaleMatrix.multiplyMatrices( matrix, bones[ i ].children[ j ].matrix );
                    bones[ i ].children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );

                }

            } 

            offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
            offsetMatrix.toArray( boneMatrices, i * 16 );

        }

        if ( boneTexture !== undefined ) {

            boneTexture.needsUpdate = true;

        }

    };

})();
