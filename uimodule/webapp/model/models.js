sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (JSONModel, Device) {
    "use strict";

    return {
        _oModel: null,
        createDeviceModel: function () {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },
        getOdataModel: function () {
            if (this._oModel) {
                return this._oModel;
            }
            const sPath = "/catalog/";
            //builds model
            return new sap.ui.model.odata.v4.ODataModel({
                serviceUrl: sPath,
                synchronizationMode: "None"
            });
        },
    };
});
