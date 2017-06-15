var shader = ( function () {

'use strict';

shader = {

    // --------------------------
    //  INIT
    // --------------------------

    init: function () {

        // shader hack

        var mapBasic = [

            '#ifdef USE_MAP',
                'vec4 texelColor = texture2D( map, vUv );',
                'diffuseColor *= texelColor;',
            '#endif',

        ];

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

        var normalPart = [
            '#ifdef USE_NORMALMAP',
                'uniform sampler2D normalMap;',
                'uniform vec2 normalScale;',

                'vec3 perturbNormal2Arb( sampler2D Nmap, vec3 eye_pos, vec3 surf_norm ) {',

                    'vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );',
                    'vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );',
                    'vec2 st0 = dFdx( vUv.st );',
                    'vec2 st1 = dFdy( vUv.st );',

                    'vec3 S = normalize( q0 * st1.t - q1 * st0.t );',
                    'vec3 T = normalize( -q0 * st1.s + q1 * st0.s );',
                    'vec3 N = normalize( surf_norm );',

                    'vec3 mapN = texture2D( Nmap, vUv ).xyz * 2.0 - 1.0;',
                    'mapN.xy = normalScale * mapN.xy;',
                    'mat3 tsn = mat3( S, T, N );',
                    'return normalize( tsn * mapN );',

                '}',
            '#endif',
        ];

        var normal = [
            '#ifdef FLAT_SHADED',
            'vec3 fdx = vec3( dFdx( vViewPosition.x ), dFdx( vViewPosition.y ), dFdx( vViewPosition.z ) );',
            'vec3 fdy = vec3( dFdy( vViewPosition.x ), dFdy( vViewPosition.y ), dFdy( vViewPosition.z ) );',
            'vec3 normal = normalize( cross( fdx, fdy ) );',
            '#else',
            '    vec3 normal = normalize( vNormal ) * flipNormal;',
            '#endif',
            '#ifdef USE_NORMALMAP',
            '   normal = perturbNormal2Arb( normalMap, -vViewPosition, normal );',
                /*'#ifdef USE_ALPHAMAP',
                    'vec3 normalPlus = perturbNormal2Arb( alphaMap, -vViewPosition, normal );',
                    'normal = mix( normal, normalPlus, 0.5 );',
                '#endif',*/
            '#endif',
        ];


        var aoFrag = [
            '#ifdef USE_AOMAP',
                'float ambientOcclusion = ( texture2D( aoMap, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;',
                'reflectedLight.indirectDiffuse *= ambientOcclusion;',
                '#if defined( USE_ENVMAP ) && defined( PHYSICAL )',
                    'float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
                    'reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
                '#endif',
            '#endif',
        ];

        /*var aoFrag = [
            '#ifdef USE_AOMAP',
                'float ambientOcclusion = ( texture2D( aoMap, vUv ).r - 1.0 ) * aoMapIntensity + 1.0;',
                'reflectedLight.indirectDiffuse *= ambientOcclusion;',
                '#if defined( USE_ENVMAP ) && defined( PHYSICAL )',
                    'float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );',
                    'reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );',
                '#endif',
            '#endif',
        ];

        var lightMapFrag = [
            '#ifdef USE_LIGHTMAP',
                'reflectedLight.indirectDiffuse += PI * texture2D( lightMap, vUv ).xyz * lightMapIntensity;',
            '#endif',
        ];

        var light = [
            'GeometricContext geometry;',

            'geometry.position = - vViewPosition;',
            'geometry.normal = normal;',
            'geometry.viewDir = normalize( vViewPosition );',

            'IncidentLight directLight;',

            '#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )',

                'PointLight pointLight;',

                'for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {',

                    'pointLight = pointLights[ i ];',
                    'getPointDirectLightIrradiance( pointLight, geometry, directLight );',
                    '#ifdef USE_SHADOWMAP',
                    'directLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ] ) : 1.0;',
                    '#endif',
                    'RE_Direct( directLight, geometry, material, reflectedLight );',

                '}',

            '#endif',

            '#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )',

                'SpotLight spotLight;',

                'for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {',

                    'spotLight = spotLights[ i ];',
                    'getSpotDirectLightIrradiance( spotLight, geometry, directLight );',
                    '#ifdef USE_SHADOWMAP',
                    'directLight.color *= all( bvec2( spotLight.shadow, directLight.visible ) ) ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;',
                    '#endif',

                    'RE_Direct( directLight, geometry, material, reflectedLight );',

                '}',

            '#endif',

            '#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )',

                'DirectionalLight directionalLight;',

                'for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {',

                    'directionalLight = directionalLights[ i ];',
                    'getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );',
                    '#ifdef USE_SHADOWMAP',
                    'directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;',
                    '#endif',
                    'RE_Direct( directLight, geometry, material, reflectedLight );',

                '}',

            '#endif',

            '#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )',

                'RectAreaLight rectAreaLight;',
                'for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {',
                    'rectAreaLight = rectAreaLights[ i ];',
                    'RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );',
                '}',

            '#endif',

            '#if defined( RE_IndirectDiffuse )',

                'vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );',

                '#ifdef USE_LIGHTMAP',

                    'vec3 lightMapIrradiance = texture2D( lightMap, vUv ).xyz * lightMapIntensity;',
                    '#ifndef PHYSICALLY_CORRECT_LIGHTS',
                        'lightMapIrradiance *= PI;', // factor of PI should not be present; included here to prevent breakage
                    '#endif',
                    'irradiance += lightMapIrradiance;',

                '#endif',

                '#if ( NUM_HEMI_LIGHTS > 0 )',

                    'for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {',
                        'irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );',
                    '}',

                '#endif',

                '#if defined( USE_ENVMAP ) && defined( PHYSICAL ) && defined( ENVMAP_TYPE_CUBE_UV )',
                    'irradiance += getLightProbeIndirectIrradiance(  geometry, 8 );',
                '#endif',

                'RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );',

            '#endif',

            '#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )',

                'vec3 radiance = getLightProbeIndirectRadiance( geometry, Material_BlinnShininessExponent( material ), 8 );',
                '#ifndef STANDARD',
                    'vec3 clearCoatRadiance = getLightProbeIndirectRadiance(  geometry, Material_ClearCoat_BlinnShininessExponent( material ), 8 );',
                '#else',
                    'vec3 clearCoatRadiance = vec3( 0.0 );',
                '#endif',
                'RE_IndirectSpecular( radiance, clearCoatRadiance, geometry, material, reflectedLight );',

            '#endif',
        ];*/

        view.shaderRemplace('physical', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('physical', 'fragment', '#include <normalmap_pars_fragment>', normalPart.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <bumpmap_pars_fragment>', '' );
        view.shaderRemplace('physical', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <alphamap_fragment>', '' );
        view.shaderRemplace('physical', 'fragment', '#include <normal_fragment>', normal.join("\n") );
        //view.shaderRemplace('physical', 'fragment', '#include <lights_template>', light.join("\n") );
        //view.shaderRemplace('physical', 'fragment', '#include <aomap_fragment>', aoFrag.join("\n") );
        view.shaderRemplace('physical', 'fragment', '#include <emissivemap_fragment>', '' );
        

        view.shaderRemplace('phong', 'fragment', '#include <bumpmap_pars_fragment>', [ 'uniform sampler2D bumpMap;', 'uniform float bumpScale;' ].join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_pars_fragment>', "uniform sampler2D emissiveMap;" );
        view.shaderRemplace('phong', 'fragment', '#include <bumpmap_pars_fragment>', '' );
        view.shaderRemplace('phong', 'fragment', '#include <map_fragment>', map.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <normal_fragment>', normal.join("\n") );
        view.shaderRemplace('phong', 'fragment', '#include <emissivemap_fragment>', '' );

        view.shaderRemplace('basic', 'fragment', '#include <map_fragment>', mapBasic.join("\n") );
        //view.shaderRemplace('basic', 'fragment', '#include <tonemapping_fragment>', '' );
        

    },


}

return shader;

})();