'use strict';


var Gui = ( function () {

    var ui = null;
    




    Gui = function () {
        //this.init();
    };

    Gui.init = function(){
        //UIL.COLOR = 'no';
        ui = new UIL.Gui({size:250, color:'no'});

        this.topMenu();
        this.basicMenu();

    };

    Gui.resize = function(){

    };

    Gui.topMenu = function(){

        var c = document.createElement('canvas');




    };

    Gui.basicMenu = function(){
        ui.add('title', { name:'AVATAR LAB', prefix:'v0.1', h:30, r:10 } );//.onChange( function(v){ switchGender(); } );
        ui.add('button', { name:'Man/Woman', p:4, h:30, r:10 } ).onChange( function(v){ switchGender(); } );
        ui.add('bool', { name:'Visible', p:70, h:20, value:true } ).onChange( function(v){ heroVisibility(); } );
        ui.add('bool', { name:'BVH Skeleton', p:70, h:20, value:false } ).onChange( function(v){ skeletonVisibility(); } );
        ui.add('bool', { name:'Helper', p:70, h:20, value:false } ).onChange( function(v){ helperVisibility(); } );

        var gr0 = ui.add('group', { name:'Render Options', height:30 });

        gr0.add('bool', { name:'PostEffect', p:70, h:20, value:false } ).onChange( function(v){ postEffect(); } );
        gr0.add('bool', { name:'Shadow', p:70, h:20, value:false } ).onChange( function(v){ shadow(); } );
    

        gr0.add('list',   { name:'ToneMap',  list:['None', 'Linear', 'Reinhard', 'Cineon', 'Uncharted2'], height:30, value:'Uncharted2'}).onChange( function(v){ setToneMap(v);  } );
        gr0.add('slide',  { name:'Exposure',  min:0, max:10, value:3, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingExposure = v; } );
        gr0.add('slide',  { name:'WhiteP',  min:0, max:10, value:5, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingWhitePoint = v; } );

        gr0.open();

        ui.setBG('rgba(128,128,128,0.8)')

    };



return Gui;

})();