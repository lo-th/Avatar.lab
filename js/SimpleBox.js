/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.SimpleBox = function () {
	THREE.Group.call( this );

	this.type = 'Group';
var min = -0.5;
	var max = 0.5;
	//var indices = new Uint16Array( [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );
	var positions = new Float32Array( [

		// down
		-0.5,0.5,0.5,   0.5,0.5,0.5,
		-0.5,-0.5,0.5,  0.5,-0.5,0.5,

		0.5,-0.5,0.5,   0.5,0.5,0.5,
		-0.5,-0.5,0.5,  -0.5,0.5,0.5,

		// up
		-0.5,0.5,-0.5,   0.5,0.5,-0.5,
		-0.5,-0.5,-0.5,  0.5,-0.5,-0.5,

		-0.5,0.5,-0.5,   -0.5,-0.5,-0.5,
		0.5,0.5,-0.5,  0.5,-0.5,-0.5,

		//mid
		-0.5,0.5,0.5,   -0.5,0.5,-0.5,
		-0.5,-0.5,0.5,  -0.5,-0.5,-0.5,

		0.5,0.5,0.5,   0.5,0.5,-0.5,
		0.5,-0.5,0.5,  0.5,-0.5,-0.5,

	] );

	var colors = new Float32Array( [

		0,0.5,1,  0,0.5,1,
		0,0.5,1,  0,0.5,1,
		0,0.5,1,  0,0.5,1,
		0,0.5,1,  0,0.5,1,

		0.5,1,0,  0.5,1,0,
		0.5,1,0,  0.5,1,0,
		0.5,1,0,  0.5,1,0,
		0.5,1,0,  0.5,1,0,

		0,0.5,1,  0.5,1,0,
		0,0.5,1,  0.5,1,0,
		0,0.5,1,  0.5,1,0,
		0,0.5,1,  0.5,1,0,

	] );


	var geometry = new THREE.BufferGeometry();
	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

	geometry.computeBoundingSphere();

	this.buffer = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true }));
	//this.buffer = new THREE.LineSegments( geometry, new THREE.LineBasicMaterial({ color: 0xffff00 }));
	//this.buffer.frustumCulled = false;

	///this.update(1);

	this.add(this.buffer);

};

THREE.SimpleBox.prototype = Object.create( THREE.Group.prototype );
THREE.SimpleBox.prototype.constructor = THREE.SimpleBox;