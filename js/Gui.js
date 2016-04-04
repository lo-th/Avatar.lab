'use strict';


var Gui = ( function () {

    var ui = null;
    var rubric = [ 'Play', 'Animation', 'BVH', 'Edit', 'Render' ];
    var canvas = null;
    var ctx = null;
    var content = null;
    var buttons = [];
    var current = 0;

    var sx, sy, sz;
    




    Gui = function () {
        //this.init();
    };

    Gui.init = function(){
        this.topMenu();
        //UIL.COLOR = 'no';
        ui = new UIL.Gui({size:250, color:'no', height:30 });
        ui.callbackClose = Gui.draw;
        ui.setBG('rgba(80,80,80,0.8)');

        
        this.basicMenu();

    };

    Gui.resize = function( w ){

        this.draw();

    };

    Gui.topMenu = function(){

        content = document.createElement('div');
        content.style.cssText =  'position: absolute; top:0; left:0px; pointer-events:none; width:100%; height:30px; '

        canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 40;

        canvas.style.cssText =  'position: absolute; top:0; left:0; pointer-events:none; width:100px; height:30px; opacity:0.8; '

        ctx = canvas.getContext("2d");

        content.appendChild(canvas);
        document.body.appendChild(content);

        for(var i=0;i<rubric.length; i++){
            var b = document.createElement('div');
            b.style.cssText =  'color:#CCC; margin-left:5px; margin-right:5px; padding-top:10px; position:relative; pointer-events:auto; width:100px; height:20px; display:inline-block; text-align:center; font-size: 14px; cursor:pointer; letter-spacing: 1px;';
            b.textContent = rubric[i];
            b.id = i;

            b.addEventListener('mouseover', function(e){ this.style.color = '#D4B87B'; }, false );
            b.addEventListener('mouseout', function(e){ this.style.color = '#CCC';}, false );
            b.addEventListener('mousedown', function(e){ Gui.switchID(this.id); }, false );

            content.appendChild(b);
        }

        this.draw();

    };

    Gui.switchID = function(id){

        
        current = id;

        switch(rubric[current]){
            case 'Play': Gui.basicMenu(); break;
            case 'Animation': Gui.animationMenu(); break;
            case 'BVH': Gui.bvhMenu(); break;
            case 'Edit': Gui.editMenu(); break;
            case 'Render': Gui.renderMenu(); break;
        }

        /*if(current === '3'){console.log(id);
            Gui.renderMenu();
        }else{
            Gui.basicMenu();
        }*/

        this.draw();

    };

    Gui.draw = function(){

        ctx.clearRect(0,0,canvas.width,canvas.height);

        var w = window.innerWidth;
        canvas.style.width = w + 'px';
        canvas.width = w;
        canvas.height = 30;

        ctx.fillStyle = 'rgba(80,80,80,1)';
        //ctx.fillRect( 0,0, w, 30);
        ctx.rect(0,0, w, 30);

        ctx.fill();

        ctx.globalCompositeOperation = 'xor';
        ctx.fillStyle = 'rgba(80,80,80,1)';
        //ctx.fillStyle = '#000';
        Gui.roundRect(current*110 + 5, 5, 100, 50, 10, true, false);

        //ctx.stroke();
        //ctx.fill();

        if(ui && !ui.isOpen ) Gui.roundRect( w-260, -10, 250, 40, 10, true, false);
            
        else ctx.fillRect( w-260,0, 250, 30);


        //ctx.clip();

    };

    Gui.roundRect = function ( x, y, width, height, radius, fill, stroke) {
        if (typeof stroke == "undefined" ) { stroke = true; }
        if (typeof radius === "undefined") { radius = 5; }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
       // if (stroke) { ctx.stroke(); }
       // if (fill) { }        
    }

    Gui.editMenu = function(){

        

        ui.clear();
        ui.add('title', { name:'AVATAR LAB', prefix:version, h:30, r:10 } );
        ui.add('button', { name:'Man/Woman', p:4, h:30, r:10 } ).onChange( function(v){ switchGender(); } );
        ui.add('list',   { name:'Bone',  list:avatar.bonesNames, height:30, value:'Hips'}).onChange( function(v){ avatar.showBones(v); } );

        sx = ui.add('slide',  { name:'scale X',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B' }).onChange( function(v){ avatar.setScalling('x', v); } );
        sy = ui.add('slide',  { name:'scale Y',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B' }).onChange( function(v){ avatar.setScalling('y', v); } );
        sz = ui.add('slide',  { name:'scale Z',  min:0, max:2, value:1, precision:2, fontColor:'#D4B87B' }).onChange( function(v){ avatar.setScalling('z', v); } );

        avatar.toEdit();

    }

    Gui.setScallingValue = function( v ){
        sx.setValue(v.x);
        sy.setValue(v.y);
        sz.setValue(v.z);
    };

    Gui.animationMenu = function(){

        avatar.toAnimation();

        ui.clear();

        ui.add('title', { name:'AVATAR LAB', prefix:version, h:30, r:10 } );//.onChange( function(v){ switchGender(); } );
        ui.add('button', { name:'Man/Woman', p:4, h:30, r:10 } ).onChange( function(v){ avatar.switchGender(); } );
        ui.add('bool', { name:'Visible', p:70, h:20, value:true } ).onChange( function(v){ heroVisibility(); } );
       // ui.add('bool', { name:'BVH Skeleton', p:70, h:20, value:false } ).onChange( function(v){ skeletonVisibility(); } );
        ui.add('bool', { name:'Helper', p:70, h:20, value:false } ).onChange( function(v){ helperVisibility(); } );

        ui.add('list',   { name:'Animation',  list:avatar.animationsNames, p:40, height:30, value:avatar.cAnimation}).onChange( function(v){ avatar.playAnimation(v); } );

    };

    Gui.bvhMenu = function(){

        avatar.toBvh();

        ui.clear();

        ui.add('title', { name:'AVATAR LAB', prefix:version, h:30, r:10 } );//.onChange( function(v){ switchGender(); } );
        ui.add('button', { name:'Man/Woman', p:4, h:30, r:10 } ).onChange( function(v){ switchGender(); } );
        ui.add('bool', { name:'Visible', p:70, h:20, value:true } ).onChange( function(v){ heroVisibility(); } );
        ui.add('bool', { name:'BVH Skeleton', p:70, h:20, value:false } ).onChange( function(v){ skeletonVisibility(); } );
        ui.add('bool', { name:'Helper', p:70, h:20, value:false } ).onChange( function(v){ helperVisibility(); } );

        ui.add('button', { name:'LOAD', p:4, h:30, r:10, loader:true, drag:true } ).onChange( function(result,fname){ bvhReader.read(result,fname); } );

        ui.add('slide',  { name:'speed',  min:0, max:1, value:0.5, precision:2, fontColor:'#D4B87B' }).onChange( bvhReader.setSpeed );

        ui.add('button', { name:'Action', p:4, h:30, r:10 } ).onChange(  function(){ bvhReader.load("bvh/action.z") }  );
        ui.add('button', { name:'Story', p:4, h:30, r:10 } ).onChange(  function(){ bvhReader.load("bvh/story.z") }  );



    };


    Gui.basicMenu = function(){

        ui.clear();

        ui.add('title', { name:'AVATAR LAB', prefix:version, h:30, r:10 } );//.onChange( function(v){ switchGender(); } );
        ui.add('button', { name:'Man/Woman', p:4, h:30, r:10 } ).onChange( function(v){ switchGender(); } );
        ui.add('bool', { name:'Visible', p:70, h:20, value:true } ).onChange( function(v){ heroVisibility(); } );
       // ui.add('bool', { name:'BVH Skeleton', p:70, h:20, value:false } ).onChange( function(v){ skeletonVisibility(); } );
        ui.add('bool', { name:'Helper', p:70, h:20, value:false } ).onChange( function(v){ helperVisibility(); } );

    };

    Gui.renderMenu = function(){

        ui.clear();

        ui.add('title', { name:'AVATAR LAB', prefix:version, h:30, r:10 } );

        ui.add('bool', { name:'PostEffect', p:70, h:20, value:false } ).onChange( function(v){ postEffect(); } );
        ui.add('bool', { name:'Shadow', p:70, h:20, value:false } ).onChange( function(v){ shadow(); } );

        ui.add('slide',  { name:'bg alpha',  min:0, max:1, value:0.4, precision:2, fontColor:'#D4B87B' }).onChange( function(v){back.material.opacity = v;} );
    

        ui.add('list',   { name:'ToneMap',  list:['None', 'Linear', 'Reinhard', 'Cineon', 'Uncharted2'], height:30, value:'Uncharted2'}).onChange( function(v){ setToneMap(v);  } );
        ui.add('slide',  { name:'Exposure',  min:0, max:10, value:3, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingExposure = v; } );
        ui.add('slide',  { name:'WhiteP',  min:0, max:10, value:5, precision:1, fontColor:'#D4B87B' }).onChange( function(v){ renderer.toneMappingWhitePoint = v; } );

        ui.add('list',   { name:'EnvMap',  list:['black', 'brush', 'chrome', 'glow', 'medium', 'metal', 'plastic', 'red', 'skin' ,'sky', 'smooth', 'yellow', 'luma', 'lava'], height:30, value:'yellow'}).onChange( function(v){ switchEnv(v);  } );

        ui.add('slide',  { name:'metalness',  min:0, max:1, value:0.4, precision:2, fontColor:'#D4B87B' }).onChange( setMetalness );
        ui.add('slide',  { name:'roughness',  min:0, max:1, value:0.5, precision:2, fontColor:'#D4B87B' }).onChange( setRoughness );

    }



return Gui;

})();