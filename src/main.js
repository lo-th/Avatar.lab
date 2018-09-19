var main = ( function () {

'use strict';

var modelName = 'avatar_test';//.tjs
var envmame = 'studio';
var path = './assets/'

var models = [

    'bvh/base.z',
    'models/' + modelName + '.sea',

];

/*var textures = [

    'envmap/' + envmame + '.jpg',
    'avatar_c.png', 
    'avatar_id.png',
    'avatar_ao.png',
    'avatar_n_m.png', 'avatar_n_w.png', 
    'avatar_skin_n_m.png', 'avatar_skin_n_w.png', 
    'avatar_l_m.png', 'avatar_l_w.png', 
    'muscular.png',
    'metalmuscl.png',
    'transition.png',
    'eye_m.png', 'eye_w.png', 'eye_n.png', 'eye_l.png',
    'UV_Grid_Sm.jpg',

];*/

var mq = 'low/';
var mt = '.jpg';

var textures = [

    'envmap/' + envmame + '.jpg',
    
    'avatar_id.png',
    'transition.png',

    mq+'avatar_c'+mt, 
    mq+'avatar_ao'+mt,
    mq+'avatar_n_m'+mt, mq+'avatar_n_w'+mt, 
    mq+'avatar_skin_n_m'+mt, mq+'avatar_skin_n_w'+mt, 
    mq+'avatar_l_m'+mt, mq+'avatar_l_w'+mt, 
    mq+'muscular.png',
    mq+'metalmuscl'+mt,
    
    'eye_m.png', 'eye_w.png', 'eye_n.png', 'eye_l.png',
    'UV_Grid_Sm.jpg',

];

var scene, man, woman, bvhLoader;

var isMan = false;
var isMorph = false;


main = {

	model: null,
	animations: [],
	timescale: 0.5,

    // --------------------------
    //   INIT
    // --------------------------

    init: function ( container, forceGL1 ) {

        view.init( container, forceGL1 );
        gui.init( container );
        //shader.init();

        scene = view.getContent();
        bvhLoader = new THREE.BVHLoader();

        view.setTone();

        main.loadModel();

    },

    // --------------------------
    //   LOAD
    // --------------------------

    loadModel: function () {

    	var asset = [], i = models.length;
        while(i--) asset[i] = path + models[i];
        pool.load( asset, main.onLoadModel );

    },

    loadTextures: function () {

    	var asset = [], i = textures.length;
        while(i--) asset[i] = path + 'textures/' + textures[i];
        pool.load( asset, main.onLoadTextures );

    },

    // --------------------------
    //   ON LOAD
    // --------------------------

    onLoadModel: function ( p ) {

        var meshs = pool.meshByName ( modelName );

    	view.extendGeometry( meshs.man.geometry );
        view.extendGeometry( meshs.woman.geometry );

        /*if( isMorph ){

            view.correctMorph( [ 'big' ], 'man', meshs );
            view.correctMorph( [ 'big' ], 'woman', meshs );

        }*/

        man = new Model( 'man', meshs, isMorph );
        woman = new Model( 'wom', meshs, isMorph );


        // define tpose for skin model
        bvhLoader.addModel(man.mesh);
        bvhLoader.addModel(woman.mesh);

        main.setTimescale();

        // animation

        main.addAnimation( 'base', p.base );

        //

        main.switchModel();
        main.model.play('idle');
        main.loadTextures();

    },

    onLoadTextures: function ( p ) {

    	var txt = {};

        var i = textures.length, name, n, t;

        while(i--){

            n = textures[i];
            name = n.substring( n.lastIndexOf('/')+1, n.lastIndexOf('.') )

            if( name === envmame ) view.initEnvScene( p[name] );
            else {

                t = new THREE.Texture( p[name] );
                t.flipY = false;
                if( name === 'avatar_c' || name === 'avatar_ao' || name === 'muscular' ) t.wrapS = THREE.MirroredRepeatWrapping;
                else t.wrapS = THREE.RepeatWrapping;
                t.needsUpdate = true;
                txt[ name ] = t;

            }

        }

        man.setTextures( txt );
        woman.setTextures( txt );

        //view.setTone();

    },

    // --------------------------
    //   CHOOSE MODEL
    // --------------------------

    switchModel: function () {

        var currentPlay = '';
        var matset = null;

        if( main.model !== null ) {
            matset = main.model.settings;
            currentPlay = main.model.currentPlay;
            main.model.removeTo( scene );
        }

        isMan = isMan ? false : true;
        main.model = isMan ? man : woman;

        if(matset!==null){ 
            main.model.settings = matset;
            main.model.updateSetting();
        }

        main.model.addTo( scene );

        gui.update();

        if( currentPlay ) main.model.play( currentPlay );

    },

    // --------------------------
    //   ANIMATION
    // --------------------------

    loadAnimation: function ( data, name, type ) {

        // lzma compress format
    	if( type === 'z' || type === 'hex' ) data = SEA3D.File.LZMAUncompress( data );




        name = name.substring( 0, name.lastIndexOf('.') );
        //console.log( data, type )
        main.applyAnimation( name, bvhLoader.parseData( data ) );

    },

    addAnimation: function ( name, data ) {

        main.applyAnimation( name, bvhLoader.parseData( data ) );

    },

    applyAnimation: function ( name, result ){

        if( main.animations.indexOf( name ) !== -1 ) return;

        //var leg = result.leg || 0;

        //leg = 0

        //console.log(leg)
        //var manRatio = man.hipPos.y / Math.abs(leg);
        ///var womRatio = woman.hipPos.y / Math.abs(leg);

        result.clip.name = name;
        var bvhClip = result.clip;
        var seq = [];
        //var decale = man.hipPos.y;

        if( name === 'base' ){

        	seq = [

                ['idle', 5, 25], ['walk', 325, 355],
                ['walk_side_r', 360, 390], ['walk_diag_r', 395, 425],
                ['walk_side_l', 430, 460], ['walk_diag_l', 465, 495],
                ['run', 500, 530 ], ['run_side_r', 535, 565 ], ['run_diag_r', 570, 600 ],
                ['run_side_l', 605, 635 ], ['run_diag_l', 640, 670 ],
                ['crouch', 675, 705], ['crouch_side_r', 710, 740 ], ['crouch_diag_r', 745, 775 ], 
                ['crouch_side_l', 780, 810 ], ['crouch_diag_l', 815, 845 ],

            ];

        }

       
        //man.reset();
        //woman.reset();

        bvhLoader.applyToModel( man.mesh, result, seq );
        bvhLoader.applyToModel( woman.mesh, result, seq );

        //bvhLoader.applyToModel( man.mesh, bvhClip, man.poseMatrix, seq, leg );
        //bvhLoader.applyToModel( woman.mesh, bvhClip, woman.poseMatrix, seq, leg );

        if( seq.length ){
            for( var i=0; i < seq.length; i++ ){ 
                main.animations.push( seq[i][0] );
                gui.addAnim( seq[i][0] );
            }
        } else { 
            main.model.play( name );
            main.animations.push( name );
            gui.addAnim( name );
        }

    },

    setTimescale: function ( v ) {

        if( v !== undefined ) main.timescale = v;
        man.setTimescale( main.timescale );
        woman.setTimescale( main.timescale );

    },

    lockHip: function ( b ) {

    	man.isLockHip = b;
    	woman.isLockHip = b;

    },

    // --------------------------
    //   TEXTURES
    // --------------------------

    updateMaterial: function () {

        man.updateMaterial();
        woman.updateMaterial();

    },

    // --------------------------
    //   SKELETON
    // --------------------------

    showSkeleton: function ( b ) {

        man.isSkeleton = b;
        woman.isSkeleton = b;
        main.model.showSkeleton( b );

    },

    
}

return main;

})();