sap.ui.define([
    "com/aysa/pgo/obras/controller/BaseController",
    "com/aysa/pgo/obras/services/Services",
    "sap/ui/core/Fragment"
], function (Controller, Services, Fragment) {
    "use strict";

    return Controller.extend("com.aysa.pgo.obras.controller.Obra", {
        onInit: function () {
            const oModel = this.getModel("AppJsonModel")
            const oManifest = this.getOwnerComponent().getManifestObject()
            const urlCatalog = oManifest.resolveUri("catalog")
            const urlDMS = oManifest.resolveUri("dms")
            const urlWF = oManifest.resolveUri("bpmworkflowruntime")
            const urlUserApi = oManifest.resolveUri("user-api")
            Services.setUrl(urlCatalog, urlDMS, urlWF, urlUserApi)
            this.getRouter().getRoute("Obra").attachPatternMatched(this._onObjectMatched, this);

            Services.getContratistas().then(data => {
                oModel.setProperty("/Contratistas", data.value)
            })

            Services.getUser().then(data => {
                console.log("--USER--", data)
            })

        },

        _onObjectMatched: async function () {
            try {
                sap.ui.core.BusyIndicator.show(0)
                const oModel = this.getModel("AppJsonModel")
                const { value } = await Services.getObras();
                oModel.setProperty("/Obras", value)
            } catch (error) {
                const message = this.getResourceBundle().getText("errorservice")
                sap.m.MessageToast.show(message)
            } finally {
                sap.ui.core.BusyIndicator.hide()
            }
        },

        handleSortDialog: function () {
            const oView = this.getView();
            // create dialog lazily
            if (!this.pDialog) {
                this.pDialog = Fragment.load({
                    id: oView.getId(),
                    controller: this,
                    name: "com.aysa.pgo.obras.view.fragments.dialogs.SortDialog"
                }).then(oDialog => {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this.pDialog.then(oDialog => {
                oDialog.open();
            });
        },

        handleSortDialogConfirm: function (oEvent) {
            const oTable = this.byId("idTablaObras");
            const mParams = oEvent.getParameters();
            const oBinding = oTable.getBinding("items");
            const sPath = mParams.sortItem.getKey();
            const bDescending = mParams.sortDescending;
            const aSorters = [new sap.ui.model.Sorter(sPath, bDescending)];

            // apply the selected sort and group settings
            oBinding.sort(aSorters);
        },

        onSearch: function (oEvent) {
            const sSearch = oEvent.getParameter("newValue");
            const oTable = this.byId("idTablaObras");
            const oBinding = oTable.getBinding("items");
            const aFilter = [
                new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({
                            path: 'nombre',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'estado/descripcion',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'tipo_contrato/descripcion',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'tipo_obra/descripcion',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'fluido/descripcion',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'p3',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                    ],
                    and: false
                })

            ];

            // apply the selected sort and group settings
            oBinding.filter(aFilter);

        },

        openDialogAltaAsignacion: function () {
            const oView = this.getView();
            const oModel = this.getModel("AppJsonModel");
            oModel.setProperty("/Alta", {
                PI: "1960N06",
                //nroProveedor: "9987"
            })

            // create dialog lazily
            if (!this.pDialogAlta) {
                this.pDialogAlta = Fragment.load({
                    id: oView.getId(),
                    controller: this,
                    name: "com.aysa.pgo.obras.view.fragments.dialogs.AltaAsignacion"
                }).then(oDialog => {
                    // connect dialog to the root view of this component (models, lifecycle)
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this.pDialogAlta.then(oDialog => {
                oDialog.setModel(oModel)
                oDialog.open();
            });
        },


        onCloseDialogAltaAsignacion: function () {
            this.byId("idAltaAsignacionDialog").close()
        },

        onCloseDialogContratista: function () {
            this.byId("idSelectDialogContratista").close()
        },

        onSearchContratista: function (oEvent) {
            const sSearch = oEvent.getParameter("value");

            const aFilter = [
                new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter({
                            path: 'registro_proveedor',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'razonsocial',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'tipo_documento/descripcion',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'nro_documento',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'domicilio_legal',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                        new sap.ui.model.Filter({
                            path: 'telefono',
                            operator: sap.ui.model.FilterOperator.Contains,
                            value1: sSearch
                        }),
                    ],
                    and: false
                })

            ];
            const oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter(aFilter);
        },


        onSelectContratista: function (oEvent) {

            const oModel = this.getModel("AppJsonModel");
            const { registro_proveedor } = oEvent.getParameter("selectedItem").getBindingContext("AppJsonModel").getObject()
            oModel.setProperty("/Alta/nroProveedor", registro_proveedor)

        },

        onAltaAsignacion: async function () {
            const oModel = this.getModel("AppJsonModel")
            const { PI, nroProveedor } = oModel.getProperty("/Alta");
            const resourceBundle = this.getResourceBundle()
            try {

                this.byId("idInputPI").setValueState(PI ? "None" : "Error")
                this.byId("idInputNroProveedor").setValueState(nroProveedor ? "None" : "Error")

                if (!PI || !nroProveedor) {
                    return
                }

                sap.ui.core.BusyIndicator.show(0)
                const [oOrdenCompra, { value: quantity }, { value: OCQuantity }, oContratista] = await Promise.all([
                    Services.getValidatePIPorveedor(PI, nroProveedor),
                    Services.getQuantity(PI),
                    Services.getOCQuantity(PI),
                    Services.getContratista(nroProveedor),
                ])
                if (oOrdenCompra.ID && oContratista.ID) {

                    oModel.setProperty("/ObraDetalle", oOrdenCompra);
                    oModel.setProperty("/ObraDetalle/quantity", quantity);
                    oModel.setProperty("/ObraDetalle/contratista", oContratista);
                    oModel.setProperty("/ObraDetalle/PI", this.getPITable(OCQuantity));
                    this.navTo("Detalle", {}, false)
                } else {
                    sap.m.MessageToast.show(resourceBundle.getText("errorpinroproveedor"))
                }
            } catch (error) {
                const message = resourceBundle.getText("errorservice")
                sap.m.MessageToast.show(message)
            } finally {
                sap.ui.core.BusyIndicator.hide()
            }
        },

        onViewObra: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navTo("Detalle", { ID }, false)
        },

        onNavigateToCargaInicial: async function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgocargainicial", { ID })
        },

        onNavigateToOferta: async function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgooferta", { ID })
        },

        onViewPartidimetro: async function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgopartidimetro", { ID })
        },

        onNavigateToPreconstruccion: async function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgopreconstruccion", { ID })
        },

        onNavigateToCargaInicialInspeccion: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgocargainicial", { ID, area_ID: "IN" })
        },

        onNavigateToCargaInicialGenero: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgocargainicial", { ID, area_ID: "GE" })
        },

        onNavigateToCargaInicialCarteleria: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgocargainicial", { ID, area_ID: "CA" })
        },

        onNavigateToOrdenServicio: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgoordenserv", { ID })
        },
        onNavigateToNotaPedido: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgonotapedido", { ID })
        },
        
        onNavigateToPoliza: function (oEvent) {
            const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
            this.navToCross("pgopolizas", { ID })
        },

        navToCross: function (semanticObject, params) {
            sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(oService => {
                oService.hrefForExternalAsync({
                    target: {
                        semanticObject,
                        action: "display"
                    },
                    params
                }).then(sHref => {
                    sap.m.URLHelper.redirect(sHref)
                });
            });
        },

        onEnviar: async function (oEvent) {
            try {
                sap.ui.core.BusyIndicator.show(0)

                const oObra = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
                const jefe_inspeccion = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID === "JE")
                    .map(item => ({
                        nombre: item.inspector.nombre,
                        correo: item.inspector.usuario
                    }))

                const inspectores = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID !== "JE")
                    .map(item => ({
                        nombre: item.inspector.nombre,
                        correo: item.inspector.usuario
                    }))

                const oPayload = {
                    definitionId: "pgo.wfaltaobra",
                    context: {
                        id_obra: oObra.ID,
                        cuit: oObra.contratista.nro_documento,
                        razon_social: oObra.contratista.razonsocial,
                        //proveedor: oObra.nro_proveedor,
                        proveedor: oObra.contratista.registro_proveedor,
                        nrop3: oObra.p3,
                        nombre: oObra.nombre,
                        fluido: oObra.fluido.descripcion,
                        partido: oObra.partido.descripcion,
                        sistema: oObra.sistema.descripcion,
                        direccion: oObra.direccion.descripcion,
                        gerencia: oObra.gerencia.descripcion,
                        acumar: oObra.acumar ? "Si" : "No",
                        tipo_contrato: oObra.tipo_contrato.descripcion,
                        tipo_obra: oObra.tipo_obra.descripcion,
                        no_redetermina: oObra.no_redetermina ? "Si" : "No",
                        fecha_firma_contrato: oObra.fecha_firma,
                        jefe_inspeccion,
                        inspectores,
                        pi: oObra.pi.map(item => ({
                            codigo: item.pi,
                            tipo_obra: item.tipo_pi.descripcion,
                            monto_original: item.quantity
                        }))
                    }
                }

                await Services.postWorkflow(oPayload)

                await Services.updateObra(oObra.ID, { estado_ID: "PI" })

                this._onObjectMatched()
            } catch (error) {
                console.log("--- Error WF ---", error)
                const message = this.getResourceBundle().getText("errorservice")
                sap.m.MessageToast.show(message)
            } finally {
                sap.ui.core.BusyIndicator.hide()
            }
        },

        onOpenDialogContratistas: function () {
            const oView = this.getView();
            const oModel = this.getModel("AppJsonModel");

            if (!this._pValueHelpDialogInspectores) {
                this._pValueHelpDialogInspectores = Fragment.load({
                    id: oView.getId(),
                    name: "com.aysa.pgo.obras.view.fragments.dialogs.ValueHelpDialogContratistas",
                    controller: this
                }).then(oValueHelpDialog => {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }
            this._pValueHelpDialogInspectores.then(oValueHelpDialog => {
                oValueHelpDialog.setModel(oModel)
                oValueHelpDialog.open();
            });
        },


    });
});