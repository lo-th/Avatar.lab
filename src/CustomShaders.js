var CustomShaders = function ( parameters, type ) {

    var type = type || 'standard';
    var uniformPlus = {

    };

    var v_add = [
    'precision highp float;',
    'precision highp int;',
    '#define NUM_CLIPPING_PLANES 0',
    '#define USE_SKINNING',
    '#define MAX_BONES 100',
    'attribute vec3 position;',
    'attribute vec3 normal;',
    'attribute vec4 color;',
    'attribute vec2 uv;',
    'attribute vec2 uv2;',
    
    'attribute vec4 skinIndex;',
    'attribute vec4 skinWeight;',

    'uniform mat4 modelMatrix;',
    'uniform mat4 modelViewMatrix;',
    'uniform mat4 projectionMatrix;',
    'uniform mat4 viewMatrix;',
    'uniform mat3 normalMatrix;',
    'uniform vec3 cameraPosition;',
    ' ',
    ];

    var f_add = [
    'precision highp float;',
    'precision highp int;',
    '#define NUM_CLIPPING_PLANES 0',
    'vec4 linearToOutputTexel( vec4 p ){ return p; }',
    ' ',
    ];

    this.material = new THREE.RawShaderMaterial( {
        uniforms: THREE.UniformsUtils.merge( [ THREE.ShaderLib[ type ].uniforms, uniformPlus ] ),
        vertexShader: v_add.join("\n") + THREE.ShaderLib[type]['vertexShader'],//pool.get( 'terrain_ph_vs2' ),
        fragmentShader: f_add.join("\n") + THREE.ShaderLib[type]['fragmentShader'],//pool.get( 'terrain_ph_fs2' )
    });

    this.material.fog = false; // set to use scene fog
    this.material.lights = true; // set to use scene lights
    this.material.clipping = false; // set to use user-defined clipping planes

    this.material.setValues( parameters );

}

CustomShaders.prototype = {


}