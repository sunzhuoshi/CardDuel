cc.Class({
    extends: cc.Component,

    properties: {
        captionLabel: {
            default: null,
            type: cc.Label
        },

        valueLabel: {
            default: null,
            type: cc.Label
        }
    },

    showRoomID: function(roomID) {
        this.node.active = true;
        this.valueLabel.string = roomID;
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
