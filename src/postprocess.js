var postprocess = ( function () {

'use strict';

var scene, camera, renderer, uniforms;

var composer, composerUV1, composerUV2, composerUV3, composerBeckmann, firstPass = true;



postprocess = {

    // --------------------------
    //  INIT
    // --------------------------

    init: function () {

        scene = view.getScene();
        camera = view.getCamera();
        renderer = view.getRenderer();

        var renderModelUV = new THREE.RenderPass( scene, camera, materialUV, new THREE.Color( 0x575757 ) );

        var effectCopy = new THREE.ShaderPass( THREE.CopyShader );

        var effectBloom1 = new THREE.BloomPass( 1, 15, 2, 512 );
        var effectBloom2 = new THREE.BloomPass( 1, 25, 3, 512 );
        var effectBloom3 = new THREE.BloomPass( 1, 25, 4, 512 );

        effectBloom1.clear = true;
        effectBloom2.clear = true;
        effectBloom3.clear = true;

        effectCopy.renderToScreen = true;

        //

        var pars = {
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat,
            stencilBuffer: false
        };

        var rtwidth = 512;
        var rtheight = 512;

        //

        composer = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );
        composer.addPass( renderModelUV );

        var renderScene = new THREE.TexturePass( composer.renderTarget2.texture );

        //

        composerUV1 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

        composerUV1.addPass( renderScene );
        composerUV1.addPass( effectBloom1 );

        composerUV2 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

        composerUV2.addPass( renderScene );
        composerUV2.addPass( effectBloom2 );

        composerUV3 = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );

        composerUV3.addPass( renderScene );
        composerUV3.addPass( effectBloom3 );

        //

        var effectBeckmann = new THREE.ShaderPass( THREE.ShaderSkin[ "beckmann" ] );
        composerBeckmann = new THREE.EffectComposer( renderer, new THREE.WebGLRenderTarget( rtwidth, rtheight, pars ) );
        composerBeckmann.addPass( effectBeckmann );

        //

        uniforms[ "tBlur1" ].value = composer.renderTarget2.texture;
        uniforms[ "tBlur2" ].value = composerUV1.renderTarget2.texture;
        uniforms[ "tBlur3" ].value = composerUV2.renderTarget2.texture;
        uniforms[ "tBlur4" ].value = composerUV3.renderTarget2.texture;

        uniforms[ "tBeckmann" ].value = composerBeckmann.renderTarget1.texture;
        

    },

    render: function () {

        if ( firstPass ) {

            composerBeckmann.render();
            firstPass = false;

        }

        composer.render();

        composerUV1.render();
        composerUV2.render();
        composerUV3.render();

    }



}

return postprocess;

})();