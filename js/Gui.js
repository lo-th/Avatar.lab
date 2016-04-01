'use strict';


var Gui = ( function () {

    var ui = null;
    




    Gui = function () {
        //this.init();
    };

    Gui.init = function(){
        //UIL.COLOR = 'no';
        ui = new UIL.Gui({size:250, color:'no'});

        this.basicMenu();

    };

    Gui.basicMenu = function(){

        ui.add('button', { name:'Man/Woman', p:4, h:40 } ).onChange( function(v){ switchGender(); } );
        ui.add('bool', { name:'Visible', p:70, h:20, value:true } ).onChange( function(v){ heroVisibility(); } );
        ui.add('bool', { name:'BVH Skeleton', p:70, h:20, value:false } ).onChange( function(v){ skeletonVisibility(); } );
        ui.add('bool', { name:'Helper', p:70, h:20, value:false } ).onChange( function(v){ helperVisibility(); } );
        ui.add('bool', { name:'PostEffect', p:70, h:20, value:false } ).onChange( function(v){ postEffect(); } );
        ui.add('bool', { name:'Shadow', p:70, h:20, value:false } ).onChange( function(v){ shadow(); } );
    

        ui.add('list',   { name:'list',  list:['None', 'Linear', 'Reinhard', 'Cineon', 'Uncharted2'], height:30, value:'Uncharted2'}).onChange( function(v){ setToneMap(v);  } );
        ui.add('slide',  { name:'Exposure',  min:0, max:10, value:3, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingExposure = v; } );
        ui.add('slide',  { name:'WhiteP',  min:0, max:10, value:5, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingWhitePoint = v; } );

        ui.setBG('rgba(48,48,48,0.8)')

    }



return Gui;

})();