var avatar = ( function () {

'use strict';

var modelName = 'avatar_test';
var path = './assets'

var assets = [
    
    '/textures/medium.jpg',
    '/textures/avatar_c.png', 
    '/textures/avatar_n_m.png',
    '/textures/avatar_n_w.png', 
    '/textures/avatar_l_m.png',
    '/textures/avatar_l_w.png', 
    '/textures/avatar_ao.png',
    '/textures/muscular.png',
    '/textures/metalmuscl.png',
    '/textures/transition/t5.png',

    '/textures/eye.png',
    '/textures/eye_n.png',

    '/bvh/base.z',

    '/models/'+modelName+'.sea',

];

var timescale = 0.5;

var man, woman, scene, bvhLoader, center = null;
var model = null;
var isMan = false;
var isHelper = false;
var currentPlay = '';
var isloaded = false;
var tmpname = '';

var animator = null;

var frameTime = 0;

var animations = [];
var morphs = ['close', 'happy', 'sad', 'open' ];

var isWithMorph = false;

avatar = {

    init: function ( Path ) {

        if( Path !== undefined ) path = Path;

        scene = view.getScene();
        bvhLoader = new THREE.BVHLoader();

        var i = assets.length;
        while(i--) {
            assets[i] = path + assets[i];
        }

     
        pool.load( assets, avatar.onLoad );

    },

    onLoad: function ( p ) {

        // shader hack

        //view.shaderPush('physical', 'fragment', [ "uniform sampler2D bumpMap;", "uniform float bumpScale;" ] );

        //view.uniformPush('physical', 'muscle', {  value: txt['muscular']  });
        //view.uniformPush('physical', 'skinAlpha', {  value: 0.0  });

        var map = [
        
            '#ifdef USE_MAP',

                'vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );',
                'vec4 baseColor = texelColor;',
                
                '#ifdef USE_BUMPMAP',

                    'vec4 texelColor2 = mapTexelToLinear( texture2D( bumpMap, vUv ) );',
                    'vec4 transitionTexel = vec4(0.0);',

                    '#ifdef USE_EMISSIVEMAP',
                        "transitionTexel = texture2D( emissiveMap, vUv );",
                        'float mixRatio = 0.0;',
                        'float threshold = 0.3;',

                        'mixRatio = bumpScale;',

                        "float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
                        "float mixf = clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",
                        "baseColor = mix( texelColor2, texelColor, mixf );",
                        //"baseColor = mix( texelColor, texelColor2, mixf );",
                    '#else',
                        "baseColor = mix( texelColor2, texelColor, 1.0 - bumpScale );",
                    "#endif",

                '#endif',

                'diffuseColor *= baseColor;',

            '#endif',

        ];

        /*var nr = [
            '#ifdef USE_MAP',
            'vec4 oldDiff = diffuseColor;',
            'vec4 texelColor = texture2D( map, vUv );',
            'texelColor = mapTexelToLinear( texelColor );',
            'diffuseColor *= texelColor;',
            '#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP ) || defined( USE_BUMPMAP )',
            '    vec4 muscleColor = texture2D( bumpMap, vUv );',
            '    muscleColor = mapTexelToLinear( muscleColor );',
            '    diffuseColor = oldDiff * mix( muscleColor, texelColor, bumpScale );',
            '#endif',
            '#endif',
        ];*/

        var nj = [
            '#ifdef FLAT_SHADED',
            'vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );',
            'vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );',
            'vec3 normal = normalize( cross( fdx, fdy ) );',
            '#else',
            '    vec3 normal = normalize( vNormal ) * flipNormal;',
            '#endif',
            '#ifdef USE_NORMALMAP',
            '    normal = perturbNormal2Arb( -vViewPosition, normal );',
            //'#elif defined( USE_BUMPMAP )',
            //'    normal = perturbNormalArb( -vViewPosition, normal, dHdxy_fwd() );',
            '#endif',
        ];

        view.shaderRemplace('physical', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('physical', 'fragment', '#include <bumpmap_pars_fragment>', '' );
        view.shaderRemplace('physical', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <normal_fragment>', nj.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_fragment>', '' );
        

        view.shaderRemplace('phong', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('phong', 'fragment', '#include <bumpmap_pars_fragment>', '' );
        view.shaderRemplace('phong', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <normal_fragment>', nj.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_fragment>', '' );
        

        // textures

        var txt = {};

        txt['env'] = new THREE.Texture( p.medium );
        txt['env'].mapping = THREE.SphericalReflectionMapping;
        txt['env'].needsUpdate = true;

        txt['transition'] = new THREE.Texture( p.t5 );
        txt['transition'].wrapS = THREE.RepeatWrapping;
        txt['transition'].flipY = false;
        txt['transition'].needsUpdate = true;

        txt['avatar_c'] = new THREE.Texture( p.avatar_c );
        txt['avatar_c'].wrapS = THREE.MirroredRepeatWrapping;
        txt['avatar_c'].flipY = false;
        txt['avatar_c'].needsUpdate = true;

        txt['avatar_n_m'] = new THREE.Texture( p.avatar_n_m );
        txt['avatar_n_m'].wrapS = THREE.RepeatWrapping;
        txt['avatar_n_m'].flipY = false;
        txt['avatar_n_m'].needsUpdate = true;

        txt['avatar_n_w'] = new THREE.Texture( p.avatar_n_w );
        txt['avatar_n_w'].wrapS = THREE.RepeatWrapping;
        txt['avatar_n_w'].flipY = false;
        txt['avatar_n_w'].needsUpdate = true;

        txt['avatar_l_m'] = new THREE.Texture( p.avatar_l_m );
        txt['avatar_l_m'].wrapS = THREE.RepeatWrapping;
        txt['avatar_l_m'].flipY = false;
        txt['avatar_l_m'].needsUpdate = true;

        txt['avatar_l_w'] = new THREE.Texture( p.avatar_l_w );
        txt['avatar_l_w'].wrapS = THREE.RepeatWrapping;
        txt['avatar_l_w'].flipY = false;
        txt['avatar_l_w'].needsUpdate = true;

        txt['avatar_ao'] = new THREE.Texture( p.avatar_ao );
        txt['avatar_ao'].wrapS = THREE.MirroredRepeatWrapping;
        txt['avatar_ao'].flipY = false;
        txt['avatar_ao'].needsUpdate = true;

        txt['muscular'] = new THREE.Texture( p.muscular );
        //txt['muscular'].wrapS = THREE.RepeatWrapping;
        txt['muscular'].wrapS = THREE.MirroredRepeatWrapping;
        txt['muscular'].flipY = false;
        txt['muscular'].needsUpdate = true;

        //

        

        txt['eye'] = new THREE.Texture( p.eye );
        txt['eye'].flipY = false;
        txt['eye'].needsUpdate = true;

        txt['eye_n'] = new THREE.Texture( p.eye_n );
        txt['eye_n'].flipY = false;
        txt['eye_n'].needsUpdate = true;

        // sea meshs

        var meshs = pool.meshByName ( modelName );

        

        /*
        var uv = meshs.man.geometry.attributes.uv.array.length * 0.25;
        var uv2 = meshs.woman.geometry.attributes.uv.array.length * 0.25;
        console.log(uv, uv2)
        */

        //
        view.reversUV( meshs.man.geometry );
        view.reversUV( meshs.woman.geometry );


        if(isWithMorph){

        	view.reversUV( meshs.man_big.geometry );
            view.reversUV( meshs.woman_big.geometry );

            view.correctMorph( 'man', meshs );
            view.correctMorph( 'woman', meshs );

        }
        
        // UV HACK
   /*  
        view.reversUV( meshs.man.geometry );
  
        view.reversUV( meshs.woman_big.geometry );
        view.reversUV( meshs.man_big.geometry );

        
        //view.correctMorph( 'woman', meshs );
        // morph hack*/

        /*avatar.correctMorph('mouth_w', meshs );
        avatar.correctMorph('mouth_m', meshs );
        avatar.correctMorph('eye_m', meshs );
        avatar.correctMorph('eye_w', meshs );*/

        // init Model

        animator = new Animator( meshs.man );

        man = new V.Model( 'man', meshs, txt, isWithMorph );
        woman = new V.Model( 'wom', meshs, txt, isWithMorph );


        avatar.switchModel();


        avatar.addAnimation( 'base', p.base );

        //avatar.loadAnimation( path + '/bvh/base.z');


        isloaded = true;
/**/
        //avatar.addHelper()

    },

    loadSingle: function ( data, name, type ) {

        var d = bvhLoader.parse( data );
        name = name.substring(0, name.lastIndexOf('.') );
        avatar.parseBvhAnimation( name, d );

    },

    /*loadAnimation: function ( file ) {

        pool.reset();
        tmpname = file.substring( file.lastIndexOf('/')+1, file.lastIndexOf('.') );
        pool.load( file, avatar.getCompressAnimation );

    },

    getCompressAnimation: function ( p ) {

        //avatar.parseBvhAnimation( tmpname, bvhLoader.parse( SEA3D.File.LZMAUncompress( p[tmpname] ) ) );

        avatar.parseBvhAnimation( tmpname, bvhLoader.parse(  p[tmpname]  ) );

    },*/

    addAnimation: function ( name, buffer ) {

        avatar.parseBvhAnimation( name, bvhLoader.parse( buffer ) );

    },

    parseBvhAnimation: function ( name, result ){

        if( animations.indexOf( name ) !== -1 ) return;

        //console.log( name, result.clip.frameTime, result.clip.frames );

        var leg = result.leg || 0;
        //var manRatio = man.hipPos.y / Math.abs(leg);
        ///var womRatio = woman.hipPos.y / Math.abs(leg);

        result.clip.name = name;
        var bvhClip = result.clip;
        var seq = null;
        var decale = man.hipPos.y;

        if( name === 'base' ) seq = [

                ['idle', 5, 25],

                ['walk', 325, 355],
                ['walk_side_r', 360, 390],
                ['walk_diag_r', 395, 425],
                ['walk_side_l', 430, 460],
                ['walk_diag_l', 465, 495],

                ['run', 500, 530 ],
                ['run_side_r', 535, 565 ],
                ['run_diag_r', 570, 600 ],
                ['run_side_l', 605, 635 ],
                ['run_diag_l', 640, 670 ],

                ['crouch', 675, 705],
                ['crouch_side_r', 710, 740 ],
                ['crouch_diag_r', 745, 775 ],
                ['crouch_side_l', 780, 810 ],
                ['crouch_diag_l', 815, 845 ],

            ]

        animator.reset();
        bvhLoader.applyToModel( animator.mesh, bvhClip, animator.poseMatrix, seq, leg );



        man.reset();
        woman.reset();

        //man.stop();
        //woman.stop();

        bvhLoader.applyToModel( man.mesh, bvhClip, man.poseMatrix, seq, leg );
        bvhLoader.applyToModel( woman.mesh, bvhClip, woman.poseMatrix, seq, leg );

        if( seq !== null ){  
            avatar.play( seq[0][0] )
            for( var i=0; i<seq.length; i++ ){ 
                animations.push( seq[i][0] );
                gui.addAnim( seq[i][0] );
            }
        } else { 
            avatar.play( name );
            animations.push( name );
            gui.addAnim( name );
        }

    },

    lockHip: function ( b ) {

        model.lockHip( b );

    },

    addSkeleton: function ( b ) {

        model.addSkeleton( b );

    },

    getModel: function (){

        return model;

    },

    addHelper: function ( b ) {

        isHelper = true;

        center = new THREE.Mesh( new THREE.CircleGeometry(25), new THREE.MeshBasicMaterial({ color:0x00FF00, wireframe:true }) );
        center.geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI*0.5 ) );
        view.getScene().add( center );

    },

    switchModel: function () {

        //model.switchGender();

        if( model !== null ) model.removeFromScene( scene );

        if( isMan ){

            //model.switchGender();

            isMan = false;
            model = woman;
            model.addToScene( scene );

        } else {

            //model.switchGender();

            isMan = true;
            model = man;
            model.addToScene( scene );

        }

        avatar.setTimescale();

        if( currentPlay ) avatar.play( currentPlay );

    },

    correctMorph: function (  name, meshs  ) {
        
        for( var i=0; i < morphs.length; i++ ) {

            meshs[name].geometry.morphAttributes.position[i].array = meshs[name+'_'+morphs[i]].geometry.attributes.position.array;
            meshs[name].geometry.morphAttributes.normal[i].array = meshs[name+'_'+morphs[i]].geometry.attributes.normal.array;

        }


    },

    getTimescale: function () {

        return timescale;

    },

    setTimescale: function ( v ) {

        if( v !== undefined ) timescale = v;
        model.setTimescale( timescale );

    },

    getAnimations: function () {

        return animations;

    },

    pause: function () {
        
        model.mesh.pauseAll();

    },

    unPause: function () {

        model.mesh.unPauseAll();

    },

    playOne: function ( f ) {

        var offset = f * frameTime;

        model.mesh.play( currentPlay, 0, offset, 1 );
        model.mesh.pauseAll();


    },

    play: function ( name, crossfade, offset, weight ) {

        if(!model) return;

        //animator.stop();
        //animator.mesh.unPauseAll();
        //animator.mesh.play( name, crossfade, offset, weight );

        model.stop();
        model.mesh.unPauseAll();
        model.mesh.play( name, crossfade, offset, weight );

        gui.inPlay();

        //var anim = model.mesh.animations
        //console.log(anim)
        currentPlay = name;

        avatar.getAnimationInfo( name );

    },

    update: function ( delta ) {

        if( !isloaded ) return;

        //THREE.SEA3D.AnimationHandler.update( 0.007 );
        THREE.SEA3D.AnimationHandler.update( delta );

        model.update();

        if( isHelper ){ 
            center.position.copy( model.getHipPos() );
            center.position.y = 0;
        }

        gui.updateTime( model.getTime() );

    },

    getAnimationInfo: function ( name ) {

        var i = model.mesh.animations.length, n, anim;
        while(i--){

            n = model.mesh.animations[i];
            if( n.name === name ) anim = n;

        }

        if( anim ){ 

            frameTime = anim.clip.frameTime;
            
            var duration = anim.clip.duration;
            var frame = Math.round( duration / frameTime );
             //console.log( duration, frame );

            gui.setTotalFrame( frame, frameTime );
            
        }



    },



}

return avatar;

})();