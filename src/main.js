var main = ( function () {

'use strict';


main = {

    // --------------------------
    //  INIT
    // --------------------------

    init: function ( container ) {

        view.init( container );
        gui.init( container );
        avatar.init();

    },

}

return main;

})();