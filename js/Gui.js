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

    }



return Gui;

})();