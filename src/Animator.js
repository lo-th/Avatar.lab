
var Animator = function ( mesh ){

    //this.skeleton = mesh.skeleton;
    //this.bones = this.skeleton.bones;

    this.mesh = mesh.clone();///new THREE.SEA3D.SkinnedMesh( new THREE.PlaneBufferGeometry() );
    //this.mesh.skeleton = mesh.skeleton;

    this.bones = this.mesh.skeleton.bones;

    this.poseMatrix = [];
    this.b = {};

    var lng = this.bones.length;
    var bone, name, i;
    var p = new THREE.Vector3();

    for( i=0; i<lng; i++){

        bone = this.bones[i];
        name = bone.name;
        //bone.name = name;

        this.b[ name ] = bone;
        this.poseMatrix[i] = bone.matrixWorld.clone();

        if( name === 'hip' ) p.setFromMatrixPosition( this.poseMatrix[i] );

    }

    this.mesh.userData.posY = p.y;

    this.mesh.geometry.dispose();

    //console.log( this.py );

    //this.reset()

}

Animator.prototype = {

    reset:function(){

        this.mesh.stopAll();

        var i, name, bone, lng = this.bones.length;

        for( i=0; i<lng; i++){

            bone = this.bones[i];
            bone.matrixWorld.copy( this.poseMatrix[i] );

        }

    },

    stop: function (){

        this.mesh.stopAll();

    },

    play: function ( name, crossfade, offset, weight ){

        this.mesh.play( name, crossfade, offset, weight );

    },

}



/*var animator = ( function () {

'use strict';


animator = {

    skeleton: null,
    bones: null,

    poseMatrix: [],
    b: {},

    py:0,


    init: function ( mesh ) {

        this.skeleton = mesh.skeleton;
        this.bones = skeleton.bones;

        var lng = this.bones.length;
        var bone, name, i;
        var p = new THREE.Vector3();

        for( i=0; i<lng; i++){

            bone = this.bones[i];
            name = bone.name;
            //bone.name = name;

            this.b[ name ] = bone;
            this.poseMatrix[i] = bone.matrixWorld.clone();

            if( name === 'hip' ) this.p.setFromMatrixPosition( this.poseMatrix[i] );

        }

        this.py = p.y;

        console.log( this.py );

    },



}
    
return avatar;

})();*/