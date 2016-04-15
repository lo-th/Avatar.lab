

ammo.skeleton = function( object ){

    this.bones = this.getBoneList( object );// object.bones;//this.getBoneList( object );

    this.data = new Float32Array( this.bones.length*8 );

    //console.log( this.bones );
    this.isRunning = false;
    this.boneDecal = [];

    this.root = object;

    this.matrix = object.matrixWorld;
    this.matrixAutoUpdate = false;

};

ammo.skeleton.prototype = {
    constructor : ammo.skeleton,

    distance : function( v1, v2 ){
        var d = v2.clone().sub(v1);
        return Math.sqrt( d.x * d.x + d.y * d.y + d.z * d.z );

    },

    getBoneList:function( object ){

        var boneList = [];

        for( var i = 0; i < object.bones.length - 30; i ++ ){
            boneList.push( object.bones[i] );
        }

        /*if ( object instanceof THREE.Bone ) {

            boneList.push( object );

        }

        for ( var i = 0; i < object.children.length; i ++ ) {

            boneList.push.apply( boneList, this.getBoneList( object.children[ i ] ) );

        }*/

        return boneList;

    },

    init:function(){

        var i = this.bones.length , bone, name, ln, lz, ls;

        while(i--){

            bone = this.bones[i];
            name = bone.name;

            //if(name === 'Head') console.log( bone.rotation )//ammo.addPart(name, i); 

            //console.log(name, i);

            if(name !== 'Hips'  &&name !== 'Bone001'  && name !== 'LeftBreast' && name !== 'RightBreast' && name !== 'LeftToeEnd' && name !== 'RightToeEnd'  && name !== 'LeftKnee' && name !== 'RightKnee' && name !== 'Top'){

                ln = 5;
                ls = 5;
                lz = 2;

                if(name === 'LeftUpLeg' || name === 'RightUpLeg'){
                  lz = 3;
                  if( bone.children[0]  ) ln = this.distance(bone.position, bone.children[0].position )+2;
                  ls = ln;
                }else if(name === 'LeftLowLeg' || name === 'RightLowLeg'){
                  lz = 2.3;
                  ln = this.distance( bone.parent.position, bone.position )+2;
                  ls = ln;
                }else if(name === 'Chest'){
                  lz = 5;
                  ln = 14;
                  ls = 8;
                 // if( bone.children[2]  ) ln = ammo.distance(bone.position, bone.children[2].position );
                }else if(name === 'Spine1'){
                  ls = -4;
                 // if( bone.children[2]  ) ln = ammo.distance(bone.position, bone.children[2].position );
                }else if(name === 'LeftUpArm' || name === 'RightUpArm'){
                  lz = 2.3;
                  if( bone.children[0]  ) ln = this.distance(bone.position, bone.children[0].position )+4;
                  ls = ln;
                }else if(name === 'LeftLowArm' || name === 'RightLowArm'){
                    lz = 2;
                    ln = this.distance( bone.parent.position, bone.position )+3;
                    ls = ln;
                }else if(name === 'LeftToe' || name === 'RightToe'){
                  //lz = 3;
                 // ln = 6
                  if( bone.children[0]  ) ln = this.distance(bone.position, bone.children[0].position );
                  ls = 0;
                }else if(name === 'LeftHand' || name === 'RightHand'){
                  //lz = 3;
                 // ln = 6
                  if( bone.children[0]  ) ln = this.distance(bone.position, bone.children[0].position );
                  ls = ln;
                }else if(name === 'LeftFoot' || name === 'RightFoot'){
                  lz = 1.6;
                  ln = 6;
                  ls = 3;
                  //if( bone.children[0]  ) ln = ammo.distance(bone.position, bone.children[0].position );
                } else {
                   if( bone.parent ) ln = this.distance( bone.parent.position, bone.position );
                   ls = ln;
                }
                // 

                this.boneDecal[i] = ls*0.5;


               
                if( name === 'Head' )view.add({ type:'sphere', size:[3.8], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
                else if(name === 'LeftToe' || name === 'RightToe' || name === 'LeftFoot' || name === 'RightFoot') view.add({ type:'box', size:[lz*2, ln, lz], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
                else if(name === 'LeftCollar' || name === 'RightCollar') view.add({ type:'sphere', size:[3], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
                else if(name === 'Spine1') view.add({ type:'sphere', size:[6.4], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
                else view.add({ type:'cylinder', size:[lz, ln, lz], pos:bone.getWorldPosition().toArray(), name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });
            }
        

        }

        this.isRunning = true;

    },

    update:function( ){

        if(!this.isRunning) return;

        //skeleton.update();
        //var matrixWorldInv = new THREE.Matrix4();//.getInverse( this.root.matrixWorld );

        var boneMatrix = new THREE.Matrix4();

        var lng = this.bones.length , bone;
        var n;
        var r = this.data;

        var pos = new THREE.Vector3();
        var quat = new THREE.Quaternion();

        var mtx = new THREE.Matrix4();
        var mtx2 = new THREE.Matrix4();

        //while(i--){

        for ( var i = 0; i < lng; i ++ ) {

            if(i !== 0 && i !== 4 && i !== 14 && i !== 16 && i !== 22 && i !== 24 && i !== 8 && i !== 5 && i !== 25  ){
                n = i * 8;

                bone = this.bones[i];

                mtx.makeRotationZ( Math.PI*0.5 );


                if( i===2 || i===20 || i===17 ) mtx2.makeTranslation(0, this.boneDecal[i], -1);
                else  mtx2.makeTranslation(0, this.boneDecal[i], 0);

                mtx.multiply( mtx2 );

                boneMatrix.multiplyMatrices( bone.matrixWorld, mtx );

                //

                pos.setFromMatrixPosition( boneMatrix );

                r[n] = pos.x * 0.1;
                r[n+1] = pos.y * 0.1;
                r[n+2] = pos.z * 0.1;

                quat.setFromRotationMatrix( boneMatrix );

                r[n+3] = quat.x;
                r[n+4] = quat.y;
                r[n+5] = quat.z;
                r[n+6] = quat.w;
            }
                
        }

    },

    /*init:function(){

        var p1 = new THREE.Vector3();
        var p2 = new THREE.Vector3();

        var matrixWorldInv = new THREE.Matrix4().getInverse( this.root.matrixWorld );

        var boneMatrix = new THREE.Matrix4();

        var j = 0;

        for ( var i = 0; i < this.bones.length; i ++ ) {

            var bone = this.bones[ i ];

            if ( bone.parent instanceof THREE.Bone ) {

                boneMatrix.multiplyMatrices( matrixWorldInv, bone.matrixWorld );
                p1.setFromMatrixPosition( boneMatrix );

                boneMatrix.multiplyMatrices( matrixWorldInv, bone.parent.matrixWorld );
                p2.setFromMatrixPosition( boneMatrix );

                d = this.distance( p1, p2 );

                view.add({ type:'cylinder', size:[1, d, 1], name:i, mass:3, flag:2, state:4, friction:0.5, restitution:0.9 });

                j += 2;

            }

        }



    },

    

    update : function(){

        var matrixWorldInv = new THREE.Matrix4().getInverse( this.root.matrixWorld );

        var boneMatrix = new THREE.Matrix4();

        //var j = 0;

        var r = ammo.bonesAr;
        var pos = new THREE.Vector3();
        var quat = new THREE.Quaternion();
        var n;

        for ( var i = 0; i < this.bones.length; i ++ ) {

            var bone = this.bones[ i ];
            n = i * 8;

           // if ( bone.parent instanceof THREE.Bone ) {

              //  boneMatrix.multiplyMatrices( matrixWorldInv, bone.matrixWorld );
                //geometry.vertices[ j ].setFromMatrixPosition( boneMatrix );

              //  boneMatrix.multiplyMatrices( matrixWorldInv, bone.parent.matrixWorld );
                //geometry.vertices[ j + 1 ].setFromMatrixPosition( boneMatrix );

                pos.setFromMatrixPosition( bone.matrixWorld  );// = bone.getWorldPosition();

                r[n] = pos.x * 0.1;
                r[n+1] = pos.y * 0.1;
                r[n+2] = pos.z * 0.1;

                quat.setFromRotationMatrix( bone.matrixWorld );//setFromEuler( bone.rotation );

                r[n+3] = quat.x;
                r[n+4] = quat.y;
                r[n+5] = quat.z;
                r[n+6] = quat.w;

                //j += 2;

            //}

        }



    }*/




}