var gui = ( function () {

'use strict';

var ui;
var content, mainMenu, menu, timebarre;
var gender, genderIM
var isOpen = false;

var selectColor = '#db0bfa'

var BB = [ 'X', 'VIEW', 'VIDEO', 'ANIMATION', 'MATERIAL', 'BONES' ];

var current = 'none';

var isMan = true;

var bone, sx, sy, sz, wx, wy, wz;


gui = {

    init: function ( container ) {

        content = document.createElement( 'div' );
        content.style.cssText = 'position: absolute; top:0; left:0; pointer-events:none; width:100%; height:100%;';
        container.appendChild( content );

        gender = document.createElement( 'div' );
        gender.style.cssText = 'position: absolute; bottom:50px; left:10px; pointer-events:auto; width:60px; height:90px; cursor:pointer;';

        genderIM = new Image();
        genderIM.src = 'assets/textures/m.png';

        gender.addEventListener( 'click', function(e){ 
            if(isMan) {
                isMan = false;
                genderIM.src = 'assets/textures/w.png';
            } else {
                isMan = true;
                genderIM.src = 'assets/textures/m.png';
            }

            main.switchModel();

        }, false );

        gender.appendChild( genderIM );
        content.appendChild( gender );

        mainMenu = document.createElement( 'div' );
        mainMenu.style.cssText = 'position: absolute; top:50px; right:0; pointer-events:none; width:200px; height:100%; display:none;';
        content.appendChild( mainMenu );

        menu = document.createElement( 'div' );
        menu.style.cssText = 'position: absolute; top:0px; left:0px; height:50px; width:100%; pointer-events:none; ';
        content.appendChild( menu );

        timebarre = new Timebarre( content, selectColor );

        for(var i=0; i<BB.length; i++ ) this.addButton(i);

        ui = new UIL.Gui( { w:200, bg:'rgba(23,23,23,0)', close:false, parent:mainMenu, top:50, css:'right:0; transition:none;' } );

    },

    addButton: function ( i ) {

        var b = document.createElement('div');
        b.style.cssText =  'color:#CCC;  font-size: 15px;  margin:0px 0px; padding: 0px 15px; line-height:50px; position:relative; pointer-events:auto; height:50px; display:inline-block; text-align:center; cursor:pointer; transition:all 0.3s ease;';
        b.textContent = BB[i];
        b.id = i;

        b.addEventListener( 'mouseover', function(e){ this.style.color = '#FFF'; this.style.background = 'rgba(153,153,153,0.5)'; }, false );
        b.addEventListener( 'mouseout', function(e){ this.style.color = '#CCC';this.style.background = 'none';}, false );
        b.addEventListener( 'mousedown', function(e){ gui.select( this.id ); }, false );

        menu.appendChild(b);

    },

    close: function () {

        if(!isOpen) return;

        mainMenu.style.display = 'none';
        isOpen = false;

    },

    open: function () {

        if( isOpen ) return;

        mainMenu.style.display = 'block';
        isOpen = true;

    },

    select: function ( id ) {

        view.setMode('normal');

        id = Number(id);
        ui.clear();
        timebarre.hide();
        gui.open();

        switch( id ){
            case 0: gui.close(); break;
            case 1: gui.view(); break;
            case 2: gui.video(); break;
            case 3: gui.animation(); break;
            case 4: gui.material(); break;
            case 5: gui.bones(); break;
           // case 5: gui.morph(); break;
        }

    },


    view: function () {

        var params = view.getSetting();

        ui.add('Bool', { name:'MID RESOLUTION', value:view.pixelRatio === 1 ? false : true, p:60 } ).onChange( view.setPixelRatio );

        ui.add('Bool', { name:'GRID', value:view.isGrid, p:60 } ).onChange( view.addGrid );
        ui.add('Bool', { name:'SHADOW', value:view.isShadow, p:60 } ).onChange( view.addShadow );
        ui.add('Bool', { name:'SKELETON', value: main.model.isSkeleton, p:60 } ).onChange( function(b){ main.showSkeleton(b); } );
        ui.add('Bool', { name:'SKY', value:false, p:60 } ).onChange( view.showSky );

        ui.add('title',  { name:' ', h:30});

        ui.add( params, 'gammaInput', { type:'Bool', fontColor:'#EEE', bColor:'#b2b2b2', p:60  } ).onChange( function(){ view.setTone( 'up' ); } );
        ui.add( params, 'gammaOutput', { type:'Bool', fontColor:'#EEE', bColor:'#b2b2b2', p:60  } ).onChange( function(){ view.setTone( 'up' ); } );

        ui.add( params, 'exposure', { min:0, max:10, precision:2, fontColor:'#fc4100' } ).onChange( function(){ view.setTone(); } );
        ui.add( params, 'whitePoint', { min:0, max:10, precision:1, fontColor:'#fc4100' } ).onChange( function(){ view.setTone(); } );
        ui.add('list', { name:'type',  bColor:'#b2b2b2', list:['None', 'Linear', 'Reinhard', 'Uncharted2', 'Cineon'], fontColor:'#333', value:params.tone, h:30 }).onChange( function(v){ view.setTone(v); } );

    },

    video: function () {

        ui.add('Bool', { name:'CAPTURE MODE', value:view.getCaptueMode(), p:60 } ).onChange( function( b ){ view.captureMode( b ) } );
        ui.add('number', { name:'resolution', value:view.videoSize, precision:0, step:10 }).onChange( view.setVideoSize );
        ui.add('button', { name:'START', h:20, p:0 }).onChange( function( ){view.startCapture()} );
        ui.add('button', { name:'STOP', h:20, p:0 }).onChange( function( ){view.saveCapture()}  );

    },

    material: function () {

        var model = main.model;
        var settings = model.settings;

        var mats = ['Basic', 'Normal', 'Depth', 'Toon', 'Lambert', 'Phong','Standard'];

        ui.add('list', { name:'type', width:100, list:mats, value:settings.type, full:true }).onChange( function( name ){ model.setMaterial( name ); } );

        ui.add( settings, 'muscles', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'oamap', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'lightmap', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'metalness', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'roughness', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'skinAlpha', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );
        ui.add( settings, 'shininess', { min:0, max:200, fontColor:'#D4B87B', precision:0 } ).onChange( gui.applyMaterial );
        ui.add( settings, 'opacity', { min:0, max:1, fontColor:'#D4B87B' } ).onChange( gui.applyMaterial );

    },

    applyMaterial: function(){

        main.model.updateSetting();

    },

    bones: function () {

        view.setMode('bones');

        bone = ui.add('title', { name:'none', h:30, r:10 } );

        var model = main.model;

        sx = ui.add('slide',  { name:'scale X',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScalling('x', v); } );
        sy = ui.add('slide',  { name:'scale Y',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScalling('y', v); } );
        sz = ui.add('slide',  { name:'scale Z',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScalling('z', v); } );

        /*wx = ui.add('slide',  { name:'scale X',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScale('x', v); } );
        wy = ui.add('slide',  { name:'scale Y',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScale('y', v); } );
        wz = ui.add('slide',  { name:'scale Z',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B', stype:1, bColor:'#999' }).onChange( function(v){ model.setScale('z', v); } );*/

    },

    setBones: function( name, id, v ){

        bone.text( name );
        bone.text2( id );
        sx.setValue(v.x);
        sy.setValue(v.y);
        sz.setValue(v.z);

        /*wx.setValue(1);
        wy.setValue(1);
        wz.setValue(1);*/

    },

    animation: function () {

        ui.add('slide', { name:'framerate', min:24, max:60, value:60, precision:0, step:1, stype:1 }).onChange( view.setFramerate );

        current = 'anim';
        ui.add('slide',  { name:'animation', min:-1, max:1, value:main.timescale, precision:2, stype:1 }).onChange( main.setTimescale );
        ui.add('Bool', { name:'LOCK HIP', value: main.model.isLockHip, p:60 } ).onChange( main.lockHip );
        ui.add('button', { name:'LOAD BVH', fontColor:'#D4B87B', h:40, drag:true, p:0 }).onChange( main.loadAnimation );

        var an = main.animations, name;

        for(var i=0; i<an.length; i++){

            name = an[i];
            //ui.add( 'button', { name:name, p:0 }).onChange( avatar.play );
            ui.add( 'button', { name:name, p:0 }).onChange( function(n){ main.model.play( n ); } );

        }

        timebarre.show();

    },

    addAnim: function( name ){

        if( current !== 'anim' ) return;
        //ui.add( 'button', { name:name, p:0 }).onChange( avatar.play );
        ui.add( 'button', { name:name, p:0 }).onChange( function(n){ main.model.play( n ); } );

    },

    /*morph: function () {

        var mo = avatar.getMorph(), name;

        for(var i=0; i<mo.length; i++){

            name = mo[i];
            ui.add('slide',  { name:'eye '+name, min:0, max:1, value:0, precision:2 }).onChange( avatar.morphEye );

        }

        ui.add('slide',  { name:'eye size', min:0.5, max:2, value:1, precision:2 }).onChange( avatar.sizeEye );

        for(var i=0; i<mo.length; i++){

            name = mo[i];
            ui.add('slide',  { name:name, min:0, max:1, value:0, precision:2 }).onChange( avatar.morphMouth  );
        }

        ui.add('slide',  { name:'mouth size', min:0.5, max:2, value:1, precision:2 }).onChange( avatar.sizeMouth );
        

    },*/

    // PLAY BARRE

    updateTimeBarre: function ( m ) {

        if( !timebarre.isHide ) {

            timebarre.setTotalFrame( m.frameMax, m.frameTime );
            timebarre.update( m.frame );

        }

    },

    resize: function () {

        if( timebarre ) timebarre.resize();

    },

   /* setTotalFrame: function ( v, ft ) {

        if( timebarre ) timebarre.setTotalFrame( v, ft );

    },

    updateTime: function ( f ) {

        if( timebarre ) timebarre.update( f );

    },
*/
    inPlay:function(){
        if( timebarre ) timebarre.inPlay();
    }




}



return gui;

})();


var Timebarre = function( p, sel ){

    this.select = sel;

    this.playIcon = "<svg width='18px' height='17px'><path fill='#CCC' d='M 14 8 L 5 3 4 4 4 13 5 14 14 9 14 8 Z'/></svg>";
    this.pauseIcon = "<svg width='18px' height='17px'><path fill='#CCC' d='M 14 4 L 13 3 11 3 10 4 10 13 11 14 13 14 14 13 14 4 M 8 4 L 7 3 5 3 4 4 4 13 5 14 7 14 8 13 8 4 Z'/></svg>";

    this.playing = true;

    this.parent = p;

    this.down = false;
    this.isHide = true;

    this.width = window.innerWidth - 80;
    this.totalFrame = 0;
    this.frame = 0;
    this.ratio = 0;

    this.content = document.createElement('div');
    this.content.style.cssText = "position:absolute; bottom:0; left:0px; width:100%; height:50px; pointer-events:none; display:none; ";
    this.parent.appendChild( this.content );

    this.timeInfo = document.createElement('div');
    this.timeInfo.style.cssText = "position:absolute; bottom:36px; left:60px; width:200px; height:10px; pointer-events:none; color:#CCC; ";
    this.content.appendChild(this.timeInfo);

    this.timeline = document.createElement('div');
    this.timeline.style.cssText = "position:absolute; bottom:20px; left:60px; width:"+this.width+"px; height:5px; border:3px solid rgba(255,255,255,0.2); pointer-events:auto; cursor:pointer;";
    this.content.appendChild(this.timeline);

    this.framer = document.createElement('div');
    this.framer.style.cssText = "position:absolute; top:0px; left:0px; width:1px; height:5px; background:#CCC; pointer-events:none;";
    this.timeline.appendChild(this.framer);

    this.playButton = document.createElement('div');
    this.playButton.style.cssText = "position:absolute; top:5px; left:10px; width:18px; height:18px; pointer-events:auto; cursor:pointer; border:3px solid rgba(255,255,255,0.2); padding: 5px 5px;";
    this.content.appendChild( this.playButton );

    this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;
    this.playButton.childNodes[0].childNodes[0].setAttribute('fill', '#CCC');



        //this.playButton.addEventListener('mouseover', editor.play_over, false );
        //this.playButton.addEventListener('mouseout', editor.play_out, false );
        

    var _this = this;
    //window.addEventListener( 'resize', function(e){ _this.resize(e); }, false );
    this.timeline.addEventListener( 'mouseover', function ( e ) { _this.tOver(e); }, false );
    this.timeline.addEventListener( 'mouseout', function ( e ) { _this.tOut(e); }, false );

    this.timeline.addEventListener( 'mousedown', function ( e ) {  _this.tDown(e); }, false );
    document.addEventListener( 'mouseup', function ( e ) {  _this.tUp(e); }, false );
    document.addEventListener( 'mousemove', function ( e ) {  _this.tMove(e); }, false );//e.stopPropagation();

    this.playButton.addEventListener('mousedown',  function ( e ) { _this.play_down(e); }, false );
    this.playButton.addEventListener('mouseover',  function ( e ) { _this.play_over(e); }, false );
    this.playButton.addEventListener('mouseout',  function ( e ) { _this.play_out(e); }, false );
}



Timebarre.prototype = {

    inPlay: function ( e ) {
        this.playing = true;
        this.playButton.innerHTML = this.playIcon;
    },

    play_down: function ( e ) {

        if( this.playing ){ 
            this.playing = false;
            main.model.pause();
        } else {
            this.playing = true;
            main.model.unPause();
        }

        this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;

    },

    play_over: function ( e ) { 

        //this.playButton.style.border = "1px solid " + selectColor;
        //this.playButton.style.background = selectColor;
        this.playButton.childNodes[0].childNodes[0].setAttribute('fill', this.select );

    },

    play_out: function ( e ) { 

        //this.playButton.style.border = "1px solid #3f3f3f";
        //this.playButton.style.background = 'none';
        this.playButton.childNodes[0].childNodes[0].setAttribute('fill', '#CCC');

    },

    show: function () {

        if(!this.isHide) return;
        this.content.style.display = 'block';
        this.isHide = false;
    },

    hide:function () {

        if(this.isHide) return;
        this.content.style.display = 'none';
        this.isHide = true;

    },
    
    setTotalFrame:function( t, ft ){

        this.totalFrame = t;
        this.frameTime = ft;
        this.ratio = this.totalFrame / this.width;
        this.timeInfo.innerHTML = this.totalFrame + ' frames';

    },

    resize:function(e){

        this.width = window.innerWidth - 80;
        this.timeline.style.width = this.width+'px';
        this.ratio = this.totalFrame / this.width;

    },

    update: function ( f ) {

        //if( this.isHide ) return;

        this.frame = f;
        this.timeInfo.innerHTML = this.frame + ' / ' + this.totalFrame;
        this.framer.style.width = this.frame / this.ratio + 'px';

    },

    tOut:function(e){

        if(!this.down) this.framer.style.background = "#CCC";

    },

    tOver:function(e){

        this.framer.style.background = this.select;

    },

    tUp:function(e){

        this.down = false;
        this.framer.style.background = "#CCC";

    },

    tDown:function(e){

        this.down = true;
        this.tMove(e);
        this.playing = false;
        this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;
        this.framer.style.background = this.select;

    },

    tMove:function(e){

        if(this.down){
            var f = Math.floor((e.clientX-20)*this.ratio);
            if(f<0) f = 0;
            if(f>this.totalFrame) f = this.totalFrame; 
            this.frame = f;
            main.model.playOne( this.frame );
            //this.parent.gotoFrame(this.frame);
        }
    }

}