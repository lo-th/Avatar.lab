var shader = ( function () {

'use strict';

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

/*var blur = [

    'vec3 blur1Color = texture2D( tBlur1, vUv ).xyz;',
    'vec3 blur2Color = texture2D( tBlur2, vUv ).xyz;',
    'vec3 blur3Color = texture2D( tBlur3, vUv ).xyz;',
    'vec3 blur4Color = texture2D( tBlur4, vUv ).xyz;',

    'outgoingLight = vec3( vec3( 0.22,  0.437, 0.635 ) * nonblurColor + ',
        'vec3( 0.101, 0.355, 0.365 ) * blur1Color + ',
        'vec3( 0.119, 0.208, 0.0 )   * blur2Color + ',
        'vec3( 0.114, 0.0,   0.0 )   * blur3Color + ',
        'vec3( 0.444, 0.0,   0.0 )   * blur4Color );',

    'outgoingLight *= sqrt( colDiffuse.xyz );',
    'outgoingLight += ambientLightColor * diffuse * colDiffuse.xyz + totalSpecularLight;',

];

var normalPart = [

    '#ifdef USE_NORMALMAP',
        'uniform sampler2D normalMap;',
        'uniform vec2 normalScale;',

        //'vec3 perturbNormal2Arb( sampler2D Nmap, vec3 eye_pos, vec3 surf_norm ) {',
        'vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm ) {',

            'vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );',
            'vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );',
            'vec2 st0 = dFdx( vUv.st );',
            'vec2 st1 = dFdy( vUv.st );',

            'vec3 S = normalize( q0 * st1.t - q1 * st0.t );',
            'vec3 T = normalize( -q0 * st1.s + q1 * st0.s );',
            'vec3 N = normalize( surf_norm );',

            'vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;',
            'mapN.xy = normalScale * mapN.xy;',
            'mat3 tsn = mat3( S, T, N );',
            'return normalize( tsn * mapN );',

        '}',
    '#endif',
];*/

var normal = [
    '#ifdef FLAT_SHADED',
    'vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );',
    'vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );',
    'vec3 normal = normalize( cross( fdx, fdy ) );',
    '#else',
    '    vec3 normal = normalize( vNormal ) * flipNormal;',
    '#endif',
    '#ifdef USE_NORMALMAP',
    '   normal = perturbNormal2Arb( -vViewPosition, normal );',
    //'   normal = perturbNormal2Arb( normalMap, -vViewPosition, normal );',
        /*'#ifdef USE_ALPHAMAP',
            'vec3 normalPlus = perturbNormal2Arb( alphaMap, -vViewPosition, normal );',
            'normal = mix( normal, normalPlus, 0.5 );',
        '#endif',*/
    '#endif',
];

/*
var aoFrag = [
    '#ifdef USE_AOMAP',
        'float ambientOcclusion = ( texture2D( aoMap, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;',
        'reflectedLight.indirectDiffuse *= ambientOcclusion;',
        '#if defined( USE_ENVMAP ) && defined( PHYSICAL )',
            'float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
            'reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
        '#endif',
    '#endif',
];*/

shader = {

    // --------------------------
    //  INIT
    // --------------------------

    init: function () {

        /*view.shaderRemplace('physical', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('physical', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <alphamap_fragment>', '' );
        view.shaderRemplace('physical', 'fragment', '#include <normal_fragment>', normal.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_fragment>', '' );
        

        view.shaderRemplace('phong', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('phong', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <normal_fragment>', normal.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_fragment>', '' );
        view.shaderRemplace('phong', 'fragment', '#include <alphamap_fragment>', '' );

        view.shaderRemplace('basic', 'fragment', '#include <map_fragment>', mapBasic.join("\n") );*/
        //view.shaderRemplace('basic', 'fragment', '#include <tonemapping_fragment>', '' );
        

    },

    change: function ( material ) {

        var name, uniforms, fragment, vertex;

        material.onBeforeCompile = function ( shader ) {

            name = shader.name;
            uniforms = shader.uniforms;


            vertex = shader.vertexShader;
            fragment = shader.fragmentShader;

            fragment = fragment.replace( '#include <map_fragment>', map.join("\n") );
            //fragment = fragment.replace( '#include <normal_fragment>', normal.join("\n") );
            fragment = fragment.replace( '#include <alphamap_fragment>', '' );
            fragment = fragment.replace( '#include <emissivemap_fragment>', '' );

            /*if(view.isGL2){

                vertex = '#version 300 es\n' + vertex;
                vertex = vertex.replace(/attribute /g, "in ");
                vertex = vertex.replace(/varying /g, "out ");
                vertex = vertex.replace(/transpose/g, "transposition");

                fragment = '#version 300 es\n' + fragment;
                fragment = fragment.replace('uniform vec3 cameraPosition;', "uniform vec3 cameraPosition;\nout vec4 FragColor_gl;\n");
                fragment = fragment.replace('#extension GL_OES_standard_derivatives : enable', "");// FRAGMENT_SHADER_DERIVATIVE_HINT ?
                fragment = fragment.replace(/varying /g, "in ");
                fragment = fragment.replace(/transpose/g, "transposition");
                fragment = fragment.replace(/gl_FragColor/g, "FragColor_gl");
                fragment = fragment.replace(/texture2D/g, "texture");
                fragment = fragment.replace(/textureCube/g, "texture");
                
            }*/

            //vertex = '#version 300 es\n' + vertex;

            //


            shader.vertexShader = vertex;
            shader.fragmentShader = fragment;

           // console.log(shader.vertexShader)

            return shader;

        }

    },


}

return shader;

})();