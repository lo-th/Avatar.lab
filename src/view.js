var view = ( function () {

'use strict';

var renderer, scene, camera, controler, transformer, clock, plane, materialShadow, ambient, light, debug, follow, mouse, pixel, raycaster, content;
var grid = null, capturer = null;
var vs = { w:1, h:1, mx:0, my:0 };
var t = { now:0, delta:0, then:0, inter:0, tmp:0, n:0 };
var isCaptureMode = false;
var isCapture = false;
var isDown = false;
var pixels, pixelsLength;
var pickingTexture = null, mouseBase;
var endPos, startPos;

// extra envmap
var ballScene, ballCamera, ballTexture, ball, skymin;
var envmap, sky;

var mode = 'normal';

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
        if( main.model ) main.model.update( delta );
        
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

        if( pickingTexture !== null ) pickingTexture.setSize( Math.floor(w*0.5),  Math.floor(h*0.5) );

        if( gui ) gui.resize();

    },

    setFramerate: function ( n ) {

        view.framerate = n; 
        t.inter = 1000 / view.framerate;

    },

    // MOUSE EVENT

    up: function ( e ) {

        e.preventDefault();

        isDown = false;

        if(startPos===undefined) return;

        endPos = view.getCurrentPosition();

        var ax = Math.abs( startPos.polar - endPos.polar );
        var ay = Math.abs( startPos.azim - endPos.azim );

        if( ax < 5 && ay < 5 ){

        	view.findMouse( e );
        	var color = view.pick();
        
        }

        
        //view.rayTest();


    },

    down: function ( e ) {

        e.preventDefault();
        isDown = true;
        startPos = view.getCurrentPosition();


        view.findMouse( e );

        //view.rayTest();

    },

    move: function ( e ) {

        e.preventDefault();
        view.findMouse( e );
        //view.rayTest();

    },

    findMouse: function ( e ) {

        if ( e.changedTouches ) {

            mouseBase.x = e.changedTouches[ 0 ].pageX;
            mouseBase.y = e.changedTouches[ 0 ].pageY;

        } else {

            mouseBase.x = e.clientX;
            mouseBase.y = e.clientY;

        }

        mouse.set( ( mouseBase.x / vs.w ) * 2 - 1, - ( mouseBase.y / vs.h ) * 2 + 1 );

    },

    rayTest: function () {

        raycaster.setFromCamera( mouse, camera );
        var hits = raycaster.intersectObjects( content.children, true ), name, uv, x;

        if( hits.length > 0 ){

            name = hits[0].object.name;

            if(name === 'man' || name ==='wom' ){

                uv = hits[ 0 ].uv;
                x =  Math.round(512*uv.x);
                if(x<0) x = x+512;
                pixel.set( x, Math.round(512*uv.y) );

                var color = view.getPixelValue( pixel );

                main.model.showBones( color );

                console.log(pixel, color)

            }

            //console.log(name)

            /*rayControl.position.copy( hits[0].point );
            var n = hits[ 0 ].face.normal.clone();
            n.multiplyScalar( 10 );
            n.add( hits[ 0 ].point );
            rayControl.lookAt( n );*/

        }
    
    },

    initPickScene: function () {

    	//pickingScene = new THREE.Scene();
		pickingTexture = new THREE.WebGLRenderTarget( Math.floor(vs.w*0.5),  Math.floor(vs.h*0.5) );
		pickingTexture.texture.minFilter = THREE.LinearFilter;

    },

    pick: function () {

    	if(mode!=='bones') return;

    	if( pickingTexture === null ) view.initPickScene();

    	var model = main.model;

    	model.swapMaterial(true);
    	plane.visible = false;
    	renderer.render( scene, camera, pickingTexture );
    	plane.visible = true;
    	model.swapMaterial(false);

    	var pixelBuffer = new Uint8Array( 4 );
    	renderer.readRenderTargetPixels( pickingTexture,  Math.floor(mouseBase.x*0.5), Math.floor(vs.h*0.5) -  Math.floor(mouseBase.y*0.5), 1, 1, pixelBuffer );
    	var color = Math.rgbToHex( pixelBuffer );

    	model.showBones( color );

    	return color;

    },

    // SET

    setMode: function ( Mode ) { 
    	if( mode === 'bones' && mode !== Mode ) main.model.hideBones();
    	mode = Mode;
    },

    // GET
    getMode: function () { return mode; },
    getRenderer: function () { return renderer; },
    getControler: function () { return controler; },
    getCamera: function () { return camera; },
    getScene: function () { return scene; },
    getContent: function () { return content; },
    getMouse: function () { return mouse; },

    getSetting: function () { return setting; },

    

    init: function ( container ) {

        mouse = new THREE.Vector2();
        mouseBase = new THREE.Vector2();
        pixel = new THREE.Vector2();
        raycaster = new THREE.Raycaster();

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

        camera = new THREE.PerspectiveCamera( 50, vs.w / vs.h , 1, 2000 );
        camera.position.set( 0, 50, 400 );
        controler = new THREE.OrbitControls( camera, renderer.domElement );
        controler.target.set( 0, 40, 0 );
        controler.enableKeys = false;
        controler.update();

        content = new THREE.Group();
        scene.add( content );

        follow = new THREE.Group();
        scene.add( follow );

        //transformer = new THREE.TransformControls( camera, renderer.domElement );
        //scene.add( transformer );

        if( this.isMobile ) renderer.setClearColor( 0x333333, 1 );
        else renderer.setClearColor( 0x000000, 0 );

        window.addEventListener( 'resize', this.resize, false );

        var dom = renderer.domElement;

        dom.addEventListener( 'mousedown', view.down, false );
        dom.addEventListener( 'mouseup', view.up, false );
        dom.addEventListener( 'mousemove', view.move, false );

        dom.addEventListener( 'touchstart', view.down, false );
        dom.addEventListener( 'touchend', view.up, false );
        dom.addEventListener( 'touchmove', view.move, false );

        //this.addGrid();
        this.addLight();
        this.addShadow( this.isMobile ? false : true );

        requestAnimationFrame( this.render );

        this.autoRotate( { distance:100, polar:75, azim:15 } );

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

            main.updateMaterial();

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
            plane.position.y = 0.5;
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

    extendGeometry: function( geometry ){

        view.reversUV( geometry );
        view.addVertexColor( geometry );

    },

    addVertexColor: function( geometry ){

        var color = new THREE.Float32BufferAttribute( geometry.attributes.position.count*3, 3 );
        var i = color.count, n;

        while(i--){ 
            n = i*3
            color[n] = 1;
            color[n+1] = 1;
            color[n+2] = 1;
        }

        geometry.addAttribute( 'color', color );
        geometry.attributes.color.needsUpdate = true;

    },

    addUV2: function( geometry ){

        geometry.addAttribute( 'uv2', geometry.attributes.uv );

    },

    correctMorph: function ( morphs, name, meshs ){

        for( var i=0; i < morphs.length; i++ ) {

            view.extendGeometry( meshs[ name + '_' + morphs[ i ] ].geometry );
            meshs[name].geometry.morphAttributes.position[i].array = meshs[ name + '_' + morphs[ i ] ].geometry.attributes.position.array;
            meshs[name].geometry.morphAttributes.normal[i].array = meshs[ name + '_' + morphs[ i ] ].geometry.attributes.normal.array;

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

    },

    initCanvasId: function ( img ){

        var canvas = document.createElement( "canvas" ); 
        canvas.width = canvas.height = 512;
        var ctx = canvas.getContext( "2d" );
        ctx.drawImage( img, 0, 0 );
        
        pixels = ctx.getImageData( 0, 0, 512, 512 ).data;
        pixelsLength = pixels.length * 0.25;

    },

    getPixelValue: function ( v ) {


        var cc = [0,0,0,0];
        var color = 0x000000;

        /*if( pix !== undefined ) {
            pix.style.left = (x*0.5) + 'px';
            pix.style.top =  (y*0.5) + 'px';
        }*/

        if( pixels !== undefined ){

            var id = (v.y*512) + v.x;
            var n = id * 4;

            cc[0] = pixels[n];
            cc[1] = pixels[n+1];
            cc[2] = pixels[n+2];
            cc[3] = pixels[n+3];
 
            color = Math.rgbToHex( cc );

        }

        return color;

        
    },




    // ENVMAP

    getEnvmap: function () { return envmap; },

    initSphereEnvmap: function ( map ){

    	envmap = new THREE.Texture( map );
        envmap.mapping = THREE.SphericalReflectionMapping;
        envmap.needsUpdate = true;

    },

    showSky: function (b) {

    	sky.visible = b;

    },

    initEnvScene: function ( map ) {

    	var s = 1;
	    ballScene = new THREE.Scene();
		ballCamera = new THREE.CubeCamera( s*0.5, s*1.2, 512 );
		ballCamera.position.set(0,0,0);
		ballCamera.lookAt( new THREE.Vector3(0,0,5));
		ballScene.add( ballCamera );
	    
	    ballTexture = new THREE.Texture( map );
	    ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
		ball = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 12  ),  new THREE.MeshBasicMaterial({ map:ballTexture, depthWrite:false }) );

		sky = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 12  ),  ball.material );
	    sky.scale.set(-1000,1000,1000);
	    scene.add( sky );
	    sky.visible = false;

	    /*skymin = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 12  ),  new THREE.MeshBasicMaterial() );
	    skymin.scale.set(3,3,3);
	    scene.add( skymin );*/
	    
	    ball.scale.set(-s,s,s);
		ballScene.add( ball );

		view.renderEnvmap();

    },

    renderEnvmap: function () {

    	ballTexture.needsUpdate = true;
    	ballCamera.updateCubeMap( renderer, ballScene );
        envmap = ballCamera.renderTarget.texture;

        //skymin.material.envMap = envmap;

    },


    clear: function ( mesh ){

        var i = mesh.children.length;
        while(i--) mesh.remove( mesh.children[i] );

    },





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
    var invScale = new THREE.Vector3();
    var baseScale = new THREE.Vector3( 1,1,1 );

    var mtx = new THREE.Matrix4();
    var tmtx = new THREE.Matrix4();

    var p1 = new THREE.Vector3();
    var p2 = new THREE.Vector3();

    return function update() {

        var bones = this.bones;
        var boneInverses = this.boneInverses;
        var boneMatrices = this.boneMatrices;
        var boneTexture = this.boneTexture;

        var m, lng, bone;

        // flatten bone matrices to array

        for ( var i = 0, il = bones.length; i < il; i ++ ) {

            bone = bones[ i ];

            // compute the offset between the current and the original transform

            var matrix = bone ? bone.matrixWorld : identityMatrix;

            //var scale = bones[ i ].parent.scale;
            //invScale.set( 1/scale.x, 1/scale.y, 1/scale.z );

            if ( bone.parent && bones[ i ].parent.isBone ) {

                if( bone.userData.mesh !== undefined ){

                    m = bone.userData.mesh;

                    p1.setFromMatrixPosition( bone.parent.matrixWorld );
                    p2.setFromMatrixPosition( matrix );
                    lng = p1.distanceTo( p2 );

                    if( m.name ==='lFoot' || m.name ==='rFoot' || m.name ==='lToe' || m.name ==='rToe' ) tmtx.makeTranslation( -lng*0.5, 0, -1 );
                    else tmtx.makeTranslation( -lng*0.5, 0, 0 );

                    mtx.multiplyMatrices( bone.parent.matrixWorld, tmtx );

                    
                    //bones[ i ].userData.mesh.matrix.copy( matrix );
                    m.position.setFromMatrixPosition( mtx );
                    m.quaternion.setFromRotationMatrix( mtx );
                    m.scale.x = lng;

                    m.updateMatrixWorld(true);

                }

            	
            }

            /*for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

                scaleMatrix = matrix.clone();
                scaleMatrix.multiply( bones[ i ].children[ j ].matrix.clone() )

                //scaleMatrix.multiplyMatrices( matrix, bones[ i ].children[ j ].matrix );
                bones[ i ].children[ j ].matrixWorld.scale( invScale );
                bones[ i ].children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );

            }*/

            //for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

            //}

            /*if( bones[ i ].parent ){
            	var scale = bones[ i ].parent.scale;
            	invScale.set( 1/scale.x, 1/scale.y, 1/scale.z );
            	

            	matrix.scale( invScale );

            	for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

                    scaleMatrix = matrix.clone();
                    scaleMatrix.multiply( bones[ i ].children[ j ].matrix.clone() )

                    //scaleMatrix.multiplyMatrices( matrix, bones[ i ].children[ j ].matrix );
                    bones[ i ].children[ j ].matrixWorld.scale(scale)
                    bones[ i ].children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );

                }
            	//scaleMatrix = matrix.clone();
                //scaleMatrix.multiply( bones[ i ].matrix.clone() );
            	//matrix.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );
            }*/

            /*var scale = bones[ i ].scale;// : baseScale;
            invScale.set( 1/scale.x, 1/scale.y, 1/scale.z )

            for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

            	bones[ i ].children[ j ].scale.copy( invScale )

                /*scaleMatrix = matrix.clone();
                scaleMatrix.multiply( bones[ i ].children[ j ].matrix.clone() )

                //scaleMatrix.multiplyMatrices( matrix, bones[ i ].children[ j ].matrix );
                bones[ i ].children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );*/

            //}

            if( bone.scalling !== undefined ){

                matrix.scale( bone.scalling );

                for ( var j = 0, l = bones[ i ].children.length; j < l; j ++ ) {

                    scaleMatrix = matrix.clone();
                    scaleMatrix.multiply( bone.children[ j ].matrix );

                    //decal.setFromMatrixPosition( scaleMatrix ).sub(bones[ i ].children[ j ].position)

                    //bones[ i ].children[ j ].position.add( decal );
                    //bones[ i ].children[ j ].matrix.setPosition( decal );
                    //bones[ i ].children[ j ].matrixWorldNeedsUpdate = true;

                    //bones[ i ].children[ j ].matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

                    bone.children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );
                    ///
                    //bones[ i ].children[ j ].matrix.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );

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
