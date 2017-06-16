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