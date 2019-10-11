var resourceFile =  resourceFile || 'resources';

var container = document.getElementById('container');

// webgl 1 or 2 
var forceGL1 = false

view.init( container, forceGL1 );
view.setCamera( { distance:300, phi:15, theta:0, time:0 } );

pool.load( resourceFile + '.json', onResourceLoaded );

function onResourceLoaded () {

    avatar.load( pool.get( resourceFile ), onComplete );

}

function onComplete () {
    
    view.addGrid( true );
    // optional interface
    gui.init( container );


}


///// extra funcion for direct load BVH or Face

var dom = view.getDom();

dom.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
dom.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
dom.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
dom.addEventListener( 'drop', dropAnimation, false );

function dropAnimation( e ){

    e.preventDefault();

    if (e.dataTransfer.items) {

        var file = e.dataTransfer.files[0];

    } else return;

    var reader = new FileReader();
    var name = file.name;
    var type = name.substring(name.lastIndexOf('.')+1, name.length );
    var tn = name.substring( name.lastIndexOf('.')-2, name.lastIndexOf('.') );

    if( type === 'z' || type === 'hex'|| type === 'ply' || type === 'hdr') reader.readAsArrayBuffer( file );
    else if ( type === 'bvh' || type === 'BVH' || type === 'obj' ) reader.readAsText( file );
    else if ( type === 'jpg' || type === 'png' ) reader.readAsDataURL( file );
    else return;

    reader.onload = function ( e ) {

        if( type === 'BVH' || type === 'bvh' ){
            avatar.loadAnimation( e.target.result, name, type );
            avatar.play(name);
        }

        if( type === 'hdr' || type === 'jpg' || type === 'png' ) view.setDirectEnvironement( e.target.result, type === 'hdr' ? true : false )



    }.bind(this);

};