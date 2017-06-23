/**
 * @author mrdoob / http://mrdoob.com/
 */

function addLineNumbers( string ) {

	var lines = string.split( '\n' );

	for ( var i = 0; i < lines.length; i ++ ) {

		lines[ i ] = ( i + 1 ) + ': ' + lines[ i ];

	}

	return lines.join( '\n' );

}

function WebGLShader( gl, type, string ) {

	if( gl.v2 !== undefined ){

        if( type === gl.VERTEX_SHADER ){
        	string = '#version 300 es\n' + string;
			string = string.replace(/attribute /g, "in ");
			string = string.replace(/varying /g, "out ");
			string = string.replace(/transpose/g, "transposition");
        } else {
        	string = '#version 300 es\n' + string;
			string = string.replace('uniform vec3 cameraPosition;', "uniform vec3 cameraPosition;\nout vec4 FragColor_gl;\n");
			string = string.replace('#extension GL_OES_standard_derivatives : enable', "");// FRAGMENT_SHADER_DERIVATIVE_HINT ?
			string = string.replace(/varying /g, "in ");
			string = string.replace(/transpose/g, "transposition");
			string = string.replace(/gl_FragColor/g, "FragColor_gl");
			string = string.replace(/texture2D/g, "texture");
			string = string.replace(/textureCube/g, "texture");
        }

    }

	var shader = gl.createShader( type );

	gl.shaderSource( shader, string );
	gl.compileShader( shader );

	if ( gl.getShaderParameter( shader, gl.COMPILE_STATUS ) === false ) {

		console.error( 'THREE.WebGLShader: Shader couldn\'t compile.' );

	}

	if ( gl.getShaderInfoLog( shader ) !== '' ) {

		console.warn( 'THREE.WebGLShader: gl.getShaderInfoLog()', type === gl.VERTEX_SHADER ? 'vertex' : 'fragment', gl.getShaderInfoLog( shader ), addLineNumbers( string ) );

	}

	// --enable-privileged-webgl-extension
	// console.log( type, gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( shader ) );

	return shader;

}


export { WebGLShader };
