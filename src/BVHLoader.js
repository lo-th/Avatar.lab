/**
* @author herzig / http://github.com/herzig
*
* Description: reads BVH files and outputs a single THREE.Skeleton and an THREE.AnimationClip
*
* Currently only supports bvh files containing a single root.
*
*/

THREE.BVHLoader = function( manager ) {

	this.numFrames = 0;
	this.frameTime = 0;



	this.animateBonePositions = true;
	this.animateBoneRotations = true;

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.BVHLoader.prototype = {

	constructor: THREE.BVHLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( scope.manager );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function( buffer ) {

			onLoad( scope.parse( buffer ) );

		}, onProgress, onError );

	},

	parse: function ( buffer ) {

		var self = this;
        var hipToFoot = 0;

		/*
			reads a string array (lines) from a BVH file
			and outputs a skeleton structure including motion data

			returns thee root node:
			{ name: "", channels: [], children: [] }
		*/
		function readBvh( lines ) {

			// read model structure
			if ( nextLine( lines ) !== "HIERARCHY" ) {

				throw "HIERARCHY expected";

			}

			var list = []; // collects flat array of all bones
			var root = readNode( lines, nextLine( lines ), list );

			// read motion data
			if ( nextLine( lines ) != "MOTION" ) {

				throw "MOTION  expected";

			}

			// number of frames
			var tokens = nextLine( lines ).split( /[\s]+/ );
			var numFrames = parseInt( tokens[ 1 ] );
			if ( isNaN( numFrames ) ) {

				throw "Failed to read number of frames.";

			}

			self.numFrames = numFrames;

			// frame time
			tokens = nextLine( lines ).split( /[\s]+/ );
			var frameTime = parseFloat( tokens[ 2 ] );
			if ( isNaN( frameTime ) ) {

				throw "Failed to read frame time.";

			}

			self.frameTime = frameTime;

			// read frame data line by line
			for ( var i = 0; i < numFrames; ++ i ) {

				tokens = nextLine( lines ).split( /[\s]+/ );

				readFrameData( tokens, i * frameTime, root, list );

			}

			return list;

		}

		/*
			Recursively reads data from a single frame into the bone hierarchy.
			The passed bone hierarchy has to be structured in the same order as the BVH file.
			keyframe data is stored in bone.frames.

			- data: splitted string array (frame values), values are shift()ed so
			this should be empty after parsing the whole hierarchy.
			- frameTime: playback time for this keyframe.
			- bone: the bone to read frame data from.
		*/
		function readFrameData( data, frameTime, bone ) {

			// end sites have no motion data
			if ( bone.type === "ENDSITE" ) {

				return;

			}

			// add keyframe
			var keyframe = {
				time: frameTime,
				position: { x: 0, y: 0, z: 0 },
				rotation: new THREE.Quaternion(),
			};

			bone.frames.push( keyframe );

			var quat = new THREE.Quaternion();

            var torad = 0.0174532925199432957; // Math.PI / 180

			var vx = new THREE.Vector3( 1, 0, 0 );
			var vy = new THREE.Vector3( 0, 1, 0 );
			var vz = new THREE.Vector3( 0, 0, 1 );

			// parse values for each channel in node
			for ( var i = 0; i < bone.channels.length; ++ i ) {

				switch ( bone.channels[ i ] ) {

				case "Xposition":
					keyframe.position.x = parseFloat( data.shift().trim() );
					break;
				case "Yposition":
					keyframe.position.y = parseFloat( data.shift().trim() );
					break;
				case "Zposition":
					keyframe.position.z = parseFloat( data.shift().trim() );
					break;
				case "Xrotation":
					quat.setFromAxisAngle( vx, parseFloat( data.shift().trim() ) * torad );
					keyframe.rotation.multiply( quat );
					break;
				case "Yrotation":
					quat.setFromAxisAngle( vy, parseFloat( data.shift().trim() ) * torad );
					keyframe.rotation.multiply( quat );
					break;
				case "Zrotation":
					quat.setFromAxisAngle( vz, parseFloat( data.shift().trim() ) * torad );
					keyframe.rotation.multiply( quat );
					break;
				default:
					throw "invalid channel type";

				}

			}

			// parse child nodes
			for ( var i = 0; i < bone.children.length; ++ i ) {

				readFrameData( data, frameTime, bone.children[ i ] );

			}

		}



		/*
		 Recursively parses the HIERACHY section of the BVH file

		 - lines: all lines of the file. lines are consumed as we go along.
		 - firstline: line containing the node type and name e.g. "JOINT hip"
		 - list: collects a flat list of nodes

		 returns: a BVH node including children
		*/
		function readNode( lines, firstline, list, isEnd ) {

			var node = { name: "", type: "", frames: [] };
			list.push( node );

			// parse node type and name.
			var tokens = firstline.split( /[\s]+/ );

			if ( tokens[ 0 ].toUpperCase() === "END" && tokens[ 1 ].toUpperCase() === "SITE" ) {

				node.type = "ENDSITE";
				node.name = "ENDSITE"; // bvh end sites have no name

			} else {

				node.name = tokens[ 1 ];
				node.type = tokens[ 0 ].toUpperCase();

			}

			if ( nextLine( lines ) != "{" ) {

				throw "Expected opening { after type & name";

			}

			// parse OFFSET
			tokens = nextLine( lines ).split( /[\s]+/ );

			if ( tokens[ 0 ] !== "OFFSET" ) {

				throw "Expected OFFSET, but got: " + tokens[ 0 ];

			}

			if ( tokens.length != 4 ) {

				throw "OFFSET: Invalid number of values";

			}

			var offset = {
				x: parseFloat( tokens[ 1 ] ),
				y: parseFloat( tokens[ 2 ] ),
				z: parseFloat( tokens[ 3 ] )
			};

			if ( isNaN( offset.x ) || isNaN( offset.y ) || isNaN( offset.z ) ) {

				throw "OFFSET: Invalid values";

			}

			node.offset = offset;

            if( node.name == 'lThigh' || node.name == 'lShin' || node.name == 'lFoot' || isEnd ) hipToFoot += offset.y;
            //if(  node.name == 'lShin' || node.name == 'lFoot' || isEnd ) hipToFoot += offset.y;

            //if(isEnd) console.log( hipToFoot );

			// parse CHANNELS definitions
			if ( node.type != "ENDSITE" ) {

				tokens = nextLine( lines ).split( /[\s]+/ );

				if ( tokens[ 0 ] != "CHANNELS" ) {

					throw "Expected CHANNELS definition";

				}

				var numChannels = parseInt( tokens[ 1 ] );
				node.channels = tokens.splice( 2, numChannels );
				node.children = [];

			}

            var isEndFoot = node.name == 'lFoot' ? true : false;

			// read children
			while ( true ) {

				var line = nextLine( lines );

				if ( line === "}" ) {

					return node;

				} else {

					node.children.push( readNode( lines, line, list, isEndFoot ) );

				}

			}

		}

        function getHeight(){

            /*var node, name;

            for(var i=0; i<list.length; i++ ){

                node = list[i];
                name = node.name;

            }*/


            
        }

		/*
			recursively converts the internal bvh node structure to a THREE.Bone hierarchy

			source: the bvh root node
			list: pass an empty array, collects a flat list of all converted THREE.Bones

			returns the root THREE.Bone
		*/

		function toTHREEBone( source, list ) {

			var bone = new THREE.Bone();
			list.push( bone );

			bone.position.add( source.offset );
			bone.name = source.name;

			if ( source.type != "ENDSITE" ) {

				for ( var i = 0; i < source.children.length; ++ i ) {

					bone.add( toTHREEBone( source.children[ i ], list ) );

				}

			}

			return bone;

		}

		/*
			builds a THREE.AnimationClip from the keyframe data saved in each bone.

			bone: bvh root node

			returns: a THREE.AnimationClip containing position and quaternion tracks
		*/

		function toTHREEAnimation( bones ) {

			var tracks = [];

			// create a position and quaternion animation track for each node
			for ( var i = 0; i < bones.length; ++ i ) {

				var bone = bones[ i ];

				if ( bone.type == "ENDSITE" ) continue;

				// track data
				var times = [];
				var positions = [];
				var rotations = [];

				for ( var j = 0; j < bone.frames.length; ++ j ) {

					var frame = bone.frames[ j ];

					times.push( frame.time );

					// the animation system animates the position property,
					// so we have to add the joint offset to all values
					positions.push( frame.position.x + bone.offset.x );
					positions.push( frame.position.y + bone.offset.y );
					positions.push( frame.position.z + bone.offset.z );

					rotations.push( frame.rotation.x );
					rotations.push( frame.rotation.y );
					rotations.push( frame.rotation.z );
					rotations.push( frame.rotation.w );

				}

				if ( scope.animateBonePositions ) {

					tracks.push( new THREE.VectorKeyframeTrack(
						".bones[" + bone.name + "].position", times, positions ) );

				}

				if ( scope.animateBoneRotations ) {

					tracks.push( new THREE.QuaternionKeyframeTrack(
						".bones[" + bone.name + "].quaternion", times, rotations ) );

				}

			}

			var clip = new THREE.AnimationClip( "animation", - 1, tracks );
			//clip.frames = self.numFrames;
			//clip.frameTime = self.frameTime;

			return clip;

		}

		/*
			returns the next non-empty line in lines
		*/
		function nextLine( lines ) {

			var line;
			// skip empty lines
			while ( ( line = lines.shift().trim() ).length === 0 ) { }
			return line;

		}

		var scope = this;

		// convert buffer to ASCII string
		var text = "";
		var raw = new Uint8Array( buffer );
		for ( var i = 0; i < raw.length; ++ i ) {

			text += String.fromCharCode( raw[ i ] );

		}

		var lines = text.split( /[\r\n]+/g );

		var bones = readBvh( lines );

		var threeBones = [];
		toTHREEBone( bones[ 0 ], threeBones );

		var threeClip = toTHREEAnimation( bones );

		return {
			skeleton: new THREE.Skeleton( threeBones ),
			clip: threeClip,
            leg: hipToFoot
		};

	},


	// ADDON


	findTime: function( times, value ){

        var lng = times.length, i, t, n = 0;

        for( i=0; i<lng; i++ ){

            t = times[i];
            if( t > value ) break;
            n = i;

        }

        return n;

    },

    applyToModel: function ( model, clip, tPose, seq, leg ) {

        leg = leg || 1;
        var hipos = model.userData.posY || 1;
        var ratio = hipos / Math.abs( leg );

        var lng, lngB, lngS, n, i, j, k, bone, name, tmptime, tracks;



        var modelName = model.name;

        //console.log(model.position)
        //model.position.copy(position)

        var utils = THREE.AnimationUtils;

        var bones = model.skeleton.bones;
        var baseTracks = clip.tracks;
        var nodeTracks = []; // 0:position, 1:quaternion

        var times, positions, resultPositions, rotations, resultRotations, pos, rot;

        var matrixWorldInv = new THREE.Matrix4().getInverse( model.matrixWorld );

       // var pp = new THREE.Vector3(0,0,0).setFromMatrixPosition( model.matrixWorld );
        //console.log(pp)
        //if(rootMatrix) matrixWorldInv = rootMatrix.clone();

        var globalQuat = new THREE.Quaternion();
        var globalPos = new THREE.Vector3();
        var globalMtx = new THREE.Matrix4();
        var localMtx = new THREE.Matrix4();
        var parentMtx;
        
        var resultQuat = new THREE.Quaternion();
        var resultPos = new THREE.Vector3();
        var resultScale = new THREE.Vector3();

       // var testPos = new THREE.Vector3();
       // var hipPos = new THREE.Vector3();
        //var minY = 10000;
        //var maxY = 0;
        //var distance = 0;


        //py = py || 0;

        

        //rootMtx.setPosition( new THREE.Vector3(0,0,0) );

        // 1° get bones worldMatxix in Tpose

        if( tPose === undefined ){

            tPose = [];
            lngB = bones.length;

            for( i = 0; i < lngB; i++ ){ 

                tPose[i] = bones[ i ].matrixWorld.clone();

            }

        }

        // 2° find same name bones track 

        lngB = bones.length

        for ( i = 0; i < lngB; ++ i ) {

            bone = bones[ i ];
            name = bone.name;

            if( name === 'root' ) bone.matrixWorld.copy( tPose[i] );
            if( name === 'hip' ) bone.matrixWorld.copy( tPose[i] );

            nodeTracks[ i ] = this.findBoneTrack( name, baseTracks );

        }

        // 3° divide track in sequency

        var fp = Math.floor(clip.frameTime * 1000);
        var frametime = 1/30;
        if( fp === 33 ) frametime = 1/30;
        if( fp === 16 ) frametime = 1/60;
        if( fp === 11 ) frametime = 1/90;
        if( fp === 8 ) frametime = 1/120;

        //clip.frameTime;

        var clipName = clip.name;
        var clipStart = 0;
        var clipEnd = 0;
        var timeStart = 0;
        var timeEnd = 0;
        var startId = 0;
        var endId = 0;
        var clipLoop = 1;

        var hipId;

        var sequences = [[ clip.name, 0, clip.frames ]];

        if(seq.length) sequences = seq;

        lngS = sequences.length;

        for( k = 0; k < lngS; k++ ){

            clipName = sequences[k][0];
            clipStart = sequences[k][1];
            clipEnd = sequences[k][2];//+1;
            clipLoop = sequences[k][3] !== undefined ? sequences[k][3] : 1;

            timeStart = clipStart * frametime;
            timeEnd = clipEnd * frametime;

            tracks = [];

            // 4° copy track to track with correct matrix

            lngB = bones.length;

            for ( i = 0; i < lngB; i ++ ) {

                bone = bones[ i ];
                name = bone.name;

                if( name === 'hip' ) hipId = i;

                if( nodeTracks[i].length === 2 ){

                    parentMtx = bone.parent ? bone.parent.matrixWorld : matrixWorldInv;

                    // rotation

                    rot = nodeTracks[i][1];

                    startId = this.findTime( baseTracks[rot].times, timeStart );
                    endId = this.findTime( baseTracks[rot].times, timeEnd ) + 1;

                    tmptime = utils.arraySlice( baseTracks[rot].times, startId, endId );
                    rotations = utils.arraySlice( baseTracks[rot].values, startId * 4, endId * 4 );

                    resultRotations = [];
                    times = [];


                    lng  = tmptime.length;

                    for( j = 0; j < lng; j ++ ){

                        times[j] = tmptime[j] - timeStart;

                        n = j*4;

                        globalQuat.set( rotations[n], rotations[n+1], rotations[n+2], rotations[n+3] );

                        globalMtx.identity().makeRotationFromQuaternion( globalQuat );
                        globalMtx.multiply( tPose[i] );

                        localMtx.identity().getInverse( parentMtx );
                        localMtx.multiply( globalMtx );
                        localMtx.decompose( resultPos, resultQuat, resultScale );

                        resultQuat.normalize();

                        resultRotations[n] = resultQuat.x;
                        resultRotations[n+1] = resultQuat.y;
                        resultRotations[n+2] = resultQuat.z;
                        resultRotations[n+3] = resultQuat.w;

                    }

                    if( times.length > 0 ) tracks.push( new THREE.QuaternionKeyframeTrack( ".bones[" + name + "].quaternion", times, resultRotations ) );

                }

            }

            // HIP position 

            i = hipId;
            bone = bones[ i ];
            name = bone.name;

            if( nodeTracks[i].length === 2 ){

                parentMtx = bone.parent ? bone.parent.matrixWorld : matrixWorldInv;

                pos = nodeTracks[i][0];
                
                startId = this.findTime( baseTracks[pos].times, timeStart );
                endId = this.findTime( baseTracks[pos].times, timeEnd ) + 1;

                tmptime = utils.arraySlice( baseTracks[pos].times, startId, endId );
                positions = utils.arraySlice( baseTracks[pos].values, startId * 3, endId * 3 );

                times = [];
                resultPositions = [];

                lng = tmptime.length;

                for( j = 0; j < lng; j++ ){

                    times[j] = tmptime[j] - timeStart;

                    n = j*3;

                    globalPos.set( positions[n], positions[n+1], positions[n+2] );
                    globalPos.set( positions[n], positions[n+1] * ratio, positions[n+2] );
                    //globalPos.multiplyScalar( ratio );

                    globalMtx.identity();
                    globalMtx.setPosition( globalPos );
                   
                    localMtx.identity().getInverse( parentMtx );
                    localMtx.multiply( globalMtx );

                    localMtx.decompose( resultPos, resultQuat, resultScale );

                    resultPositions[n] = resultPos.x;
                    resultPositions[n+1] = resultPos.y;
                    resultPositions[n+2] = resultPos.z;

                }

                if( times.length > 0 ) tracks.push( new THREE.VectorKeyframeTrack( ".bones[" + name + "].position", times, resultPositions ) );

            }




            //}

            // 5° apply new clip to model

            //var newClip = new THREE.AnimationClip( clipName, timeEnd-timeStart, tracks );
            var newClip = new THREE.AnimationClip( clipName, -1, tracks );
            newClip.frameTime = frametime;
            newClip.repeat = clipLoop === 1 ? true : false;
            newClip.timeScale = 1;

            model.addAnimation( newClip );

            //console.log( ratio );

           // if( clipName === 'idle'){ model.playw( 'idle', 1 ); }
            //else model.play( 0 );



            

        }

        // replace model
        //model.position.copy( oldPosition );

    },

    findBoneTrack: function( name, tracks ){

        var n, nodeName, type, result = [];
        for ( var i = 0; i < tracks.length; ++ i ) {

            n = tracks[i].name;
            nodeName = n.substring( n.indexOf('[')+1, n.indexOf(']') );
            type = n.substring( n.lastIndexOf('.')+1 );

            if( name === nodeName ){
                if(type === 'position') result[0] = i;
                else result[1] = i;
            } 

        }

        return result;

    }


};
