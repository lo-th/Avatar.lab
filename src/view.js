var view = ( function () {

'use strict';

var renderer, scene, camera, controler, transformer, clock, plane, materialShadow, ambient, light, follow, mouse, pixel, raycaster, content;
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

var version = '';

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

    isGL2: false,

    framerate: 60,

    pixelRatio : 1,

    isMobile: false,
    isShadow: false,
    isGrid: false,
    videoSize: [1920/3,1080/3],

    update: function ( d ) {

        //var delta = clock.getDelta();
        if( main.model ) main.model.update( d ); //delta );
        
    },

    render: function ( time ) {

        requestAnimationFrame( view.render );

        TWEEN.update();

        t.now = time;// !== undefined ? time : 0;//( typeof performance === 'undefined' ? Date : performance ).now();

        t.delta = t.now - t.then;

        if ( t.delta > t.inter ) {

            t.then = t.now - ( t.delta % t.inter );

            view.update( t.delta * 0.001 );

            renderer.render( scene, camera );

            if( isCapture ) capturer.capture( renderer.domElement );

            if ( t.now - 1000 > t.tmp ){ 
                t.tmp = t.now; 
                gui.setText( t.n + ' ' + version );
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
        	view.pick();
        
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

    	if( mode !== 'bones' ) return;

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

    	//return color;

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

    getWebGL: function ( force ) {

        // WebGLExtensions
        // 

        var canvas = document.createElement("canvas"), gl;
        canvas.style.cssText = 'position: absolute; top:0; left:0; width:100%; height:100%;'//pointer-events:auto;

        var isWebGL2 = false;

        var options = { 
            antialias: this.isMobile ? false : true, 
            alpha: this.isMobile ? false : true, 
            stencil:false, depth:true, precision:"highp", premultipliedAlpha:true, preserveDrawingBuffer:false 
        }

        if( !force ){

            gl = canvas.getContext( 'webgl2', options );
            if (!gl) gl = canvas.getContext( 'experimental-webgl2', options );
            isWebGL2 = !!gl;

        }

        if(!isWebGL2) {
            gl = canvas.getContext( 'webgl', options );
            if (!gl) gl = canvas.getContext( 'experimental-webgl', options );
        }

        options.canvas = canvas;
        options.context = gl;
        version = isWebGL2 ? 'GL2':'GL1';

        view.isGL2 = isWebGL2;

        if(isWebGL2){ 
            gl.v2 = true;

            //shader.convertToV2();
            /*var ext = gl.getExtension( 'OES_texture_float_linear' );//
            var ext2 = gl.getExtension( 'EXT_color_buffer_float' );
            console.log( ext )
            console.log( ext2 )*/
        }


        return options;

    },

    init: function ( container, forceGL1 ) {

        //console.log(THREE.WebGLShader)

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

        //clock = new THREE.Clock();

        //t.then = ( typeof performance === 'undefined' ? Date : performance ).now();
        t.inter = 1000 / this.framerate;

        view.testMobile();

        vs.w = window.innerWidth;
        vs.h = window.innerHeight;

        renderer = new THREE.WebGLRenderer( view.getWebGL( forceGL1 ) );
        
        view.pixelRatio = 1;//window.devicePixelRatio;//this.isMobile ? 0.5 : window.devicePixelRatio;
        renderer.setPixelRatio( view.pixelRatio );
        renderer.setSize( vs.w, vs.h );
        renderer.domElement.style.position = 'absolute';
        container.appendChild( renderer.domElement );

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

        // renderer.setClearColor( 0xff3333, 1 );

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

    disableTone: function( v ) {

        renderer.gammaInput = false;
        renderer.gammaOutput = false;
        renderer.toneMapping = THREE.NoToneMapping;

    },

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

        if( nup ) main.updateMaterial();

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

            plane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 200, 200, 1, 1 ), new THREE.ShadowMaterial({opacity:0.4}) );
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
            plane.material.dispose();
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

    reversUV: function ( geometry ){

        // correct inversion of normal map in symetrics mesh

        var uv = geometry.attributes.uv.array;
        var i = Math.floor(uv.length * 0.25);
        while( i-- ) uv[ i * 2 ] *= -1;
        geometry.attributes.uv.needsUpdate = true;

        // for ao map
        view.addUV2( geometry );

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

    


    // SHADER HACK

    /*uniformPush : function( type, name, value ){

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

    },*/

    // CAMERA AUTO CONTROL

    autoRotate: function ( o, time, delay, callback ) {

        callback = callback || function(){};

        var c = view.getCurrentPosition();
        controler.enabled = false;

        new TWEEN.Tween( c ).to( o, time || 2000 )
        .delay( delay || 0 )
        .easing( TWEEN.Easing.Quadratic.Out )
        .onUpdate( function() { view.orbit( c ); } )
        .onComplete( function() { controler.enabled = true;  callback(); } )
        .start();

    },

    orbit: function ( o ) {

        var phi = o.polar * Math.torad;
        var theta = o.azim * Math.torad;

        controler.target.set( o.x, o.y, o.z );
        camera.position.copy( controler.target );
        camera.position.x += o.distance * Math.sin(phi) * Math.sin(theta);
        camera.position.y += o.distance * Math.cos(phi);
        camera.position.z += o.distance * Math.sin(phi) * Math.cos(theta);
        controler.update();

    },

    getCurrentPosition: function ( log ) {

        var p = {};
        var t = controler.target;
        var c = camera.position;
        p.x = t.x;
        p.y = t.y;
        p.z = t.z;
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
        ballCamera = new THREE.CubeCamera( 0.1, 10, 256 );
        ballCamera.renderTarget.texture.minFilter = THREE.LinearMipMapLinearFilter
		//ballCamera = new THREE.CubeCamera( s*0.5, s*1.2, 512 );
		//ballCamera.position.set(0,0,0);
		ballCamera.lookAt( new THREE.Vector3(0,0,5));
		ballScene.add( ballCamera );
	    
	    ballTexture = new THREE.Texture( map );
	    ballTexture.wrapS = ballTexture.wrapT = THREE.ClampToEdgeWrapping;
        ballTexture.needsUpdate = true;
		ball = new THREE.Mesh( new THREE.SphereGeometry( 2, 20, 12 ),  new THREE.MeshBasicMaterial({ map:ballTexture, depthWrite:false }) );
        ball.geometry.scale( - 1, 1, 1 );
        ballScene.add( ball );

		sky = new THREE.Mesh( new THREE.SphereGeometry( 1000, 20, 12  ),  ball.material );
	    sky.geometry.scale( - 1, 1, 1 );
	    scene.add( sky );
	    sky.visible = false;

	    /*skymin = new THREE.Mesh( new THREE.SphereGeometry( 1, 20, 12  ),  new THREE.MeshBasicMaterial({envMap: ballCamera.renderTarget.texture}) );
	    skymin.scale.set(3,3,3);
	    scene.add( skymin );*/
	    
	    

		view.renderEnvmap();

    },

    renderEnvmap: function () {

        view.disableTone();

    	//
    	ballCamera.update( renderer, ballScene );
        envmap = ballCamera.renderTarget.texture;

       // skymin.material.envMap = envmap;

        view.setTone();

        

    },


    clear: function ( mesh ){

        var i = mesh.children.length;
        while(i--) mesh.remove( mesh.children[i] );

    },





}



return view;

})();