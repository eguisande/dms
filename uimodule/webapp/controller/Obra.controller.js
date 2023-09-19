sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator",
  "sap/ui/core/util/File"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator, File) {
  "use strict";

  return Controller.extend("com.aysa.pgo.altaobras.controller.Obra", {
    onInit: async function () {
      const oModel = this.getModel("AppJsonModel")
      const oManifest = this.getOwnerComponent().getManifestObject()
      const urlCatalog = oManifest.resolveUri("catalog")
      const urlDMS = oManifest.resolveUri("dms")
      const urlWF = oManifest.resolveUri("bpmworkflowruntime")
      const urlUserApi = oManifest.resolveUri("user-api")
      const urlPdfApi = oManifest.resolveUri("api")
      Services.setUrl(urlCatalog, urlDMS, urlWF, urlUserApi, urlPdfApi)
      this.getRouter().getRoute("Obra").attachPatternMatched(this._onObjectMatched, this);
      Services.getContratistas().then(data => {
        oModel.setProperty("/Contratistas", data.value)
      })
    },

    _onObjectMatched: async function () {
      try {
        BusyIndicator.show(0)
        const oModel = this.getModel("AppJsonModel")
        //Se reemplaza por getUserRoles
        //const { email, Groups: aGroups } = await Services.getUser()
        const { email } = await Services.getUser()
        const oUserRoles = await Services.getUserRoles()
        this.setUserData(oUserRoles.value, email)
        const aaltaobras = await this.getObrasData()
        oModel.setProperty("/altaobras", aaltaobras)
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice")
        MessageToast.show(message)
      } finally {
        BusyIndicator.hide()
      }
    },

    setUserData: function (aGroups, user) {
      const oModel = this.getModel("AppJsonModel")
      const sJefeInspector = aGroups.find(oGrupo => oGrupo === "PGO_JefeInspeccion")
      const sInspector = aGroups.find(oGrupo => oGrupo === "PGO_Inspector")
      const sContratista = aGroups.find(oGrupo => oGrupo === "PGO_Contratista")
      const sAreaGenero = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaGenero")
      const sAreaCarteleria = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaCarteleria")
      const sAreaMedioambiente = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaMedioambiente")
      const sAreaPolizas = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaPolizas")
      const sAreaSegHigiene = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaSeguridadHigiene")
      const sAreaPermisos = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaPermisos")
      const sAreaIngenieria = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaIngenieria")
      const sAreaInterferencias = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaInterferencias")
      const sAll = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_AreaGenero"
      || oGrupo === "PGO_AreaCarteleria" || oGrupo === "PGO_AreaMedioambiente" || oGrupo === "PGO_AreaPolizas" || oGrupo === "PGO_AreaSeguridadHigiene" || oGrupo === "PGO_AreaPermisos"
      || oGrupo === "PGO_AreaIngenieria" || oGrupo === "PGO_AreaInterferencias")
      const sCreateDelete = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista")
      const sEdit = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista")
      const sCargaIncial = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Inspector")
      const sComunicaciones = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_AreaGenero"
        || oGrupo === "PGO_AreaCarteleria" || oGrupo === "PGO_AreaMedioambiente" || oGrupo === "PGO_AreaPolizas" || oGrupo === "PGO_AreaSeguridadHigiene" || oGrupo === "PGO_AreaPermisos"
        || oGrupo === "PGO_AreaIngenieria" || oGrupo === "PGO_AreaInterferencias")
      const sEjecucion = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Contratista")
      oModel.setProperty("/Permisos", {
        user,
        delete: !!sCreateDelete && true,
        create: !!sCreateDelete && true,
        edit: !!sEdit && true,
        all: !!sAll && true,
        jefe: !!sJefeInspector && true,
        inspector: !!sInspector && true,
        contratista: !!sContratista && true,
        genero: !!sAreaGenero && true,
        carteleria: !!sAreaCarteleria && true,
        medioAmbiente: !!sAreaMedioambiente && true,
        polizas: !!sAreaPolizas && true,
        seghigiene: !!sAreaSegHigiene && true,
        permisos: !!sAreaPermisos && true,
        ingenieria: !!sAreaIngenieria && true,
        interferencias: !!sAreaInterferencias && true,
        cargaInicial: !!sCargaIncial && true,
        comunicaciones: !!sComunicaciones && true,
        ejecucion: !!sEjecucion && true
      })
    },

    getObrasData: async function () {
      const oModel = this.getModel("AppJsonModel")
      const { all, jefe, inspector, contratista, user } = oModel.getProperty("/Permisos")
      if (all) {
        const { value } = await Services.getObras()
        return value
      }
      if (jefe) {
        const { value } = await Services.getObrasJefeInspector(user, "JE")
        return value
      }
      if (inspector) {
        const { value } = await Services.getObrasJefeInspector(user, "EM")
        return value
      }
      if (contratista) {
        const { value } = await Services.getObrasByContratista()
        return value
      }
    },

    handleSortDialog: function () {
      const oView = this.getView();
      if (!this.pDialog) {
        this.pDialog = Fragment.load({
          id: oView.getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.SortDialog"
        }).then(oDialog => {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }
      this.pDialog.then(oDialog => {
        oDialog.open();
      });
    },

    handleSortDialogConfirm: function (oEvent) {
      const oTable = this.byId("idTablaaltaobras");
      const mParams = oEvent.getParameters();
      const oBinding = oTable.getBinding("items");
      const sPath = mParams.sortItem.getKey();
      const bDescending = mParams.sortDescending;
      const aSorters = [new sap.ui.model.Sorter(sPath, bDescending)];
      oBinding.sort(aSorters);
    },

    onSearch: function (oEvent) {
      const sSearch = oEvent.getParameter("newValue");
      const oTable = this.byId("idTablaaltaobras");
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
      oBinding.filter(aFilter);
    },

    openDialogAltaAsignacion: function () {
      const oView = this.getView();
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/Alta", {});
      // oModel.setProperty("/Alta", {
      //   PI: "1960N06",
      //   //nroProveedor: "9987"
      // })
      if (!this.pDialogAlta) {
        this.pDialogAlta = Fragment.load({
          id: oView.getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AltaAsignacion"
        }).then(oDialog => {
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
        BusyIndicator.show(0)
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
          MessageToast.show(resourceBundle.getText("errorpinroproveedor"))
        }
      } catch (error) {
        const message = resourceBundle.getText("errorservice")
        MessageToast.show(message)
      } finally {
        BusyIndicator.hide()
      }
    },

    onViewObra: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navTo("Detalle", { ID }, false)
    },

    onDeleteObra: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      BusyIndicator.show(0)
      try {
        await this.showMessageConfirm("eliminarregistro");
        const message = this.getResourceBundle().getText("obraeliminada");
        MessageBox.success(message);
        await Services.deleteObra(ID)
        await this._onObjectMatched()
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice")
        error && MessageToast.show(message)
      }
      finally {
        BusyIndicator.hide()
      }
    },

    showMessageConfirm: function (sText) {
      return new Promise((res, rej) => {
        MessageBox.confirm(this.getResourceBundle().getText(sText), {
          actions: [MessageBox.Action.CANCEL, "Aceptar"],
          emphasizedAction: "Aceptar",
          onClose: sAction => sAction === "Aceptar" ? res() : rej(false)
        })
      })
    },

    onNavigateToCargaInicial: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgocargainicial", { ID })
    },

    onNavigateToPermisos: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgopermisos", { ID })
    },

    onNavigateToOferta: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgooferta", { ID })
    },

    onViewPartidimetro: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgopartidimetro", { ID })
    },

    onNavigateToInterferencias: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgointerferencias", { ID })
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

    onNavigateToCargaInicialMedioAmbiente: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgocargainicial", { ID, area_ID: "MA" })
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

    onNavigateToPlanTrabajo: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoplantrabajo", { ID })
    },

    onNavigateToListadoPresentaciones: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgolistadopresentaciones", { ID })
    },

    onNavigateToSeguridadHigiene: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoseguridadhigiene", { ID })
    },

    onNavigateToListadoPlanos: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgolistadoplanos", { ID })
    },

    onNavigateToDiagramaCuadra: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgotramos", { ID })
    },

    onNavigateToControlDocumentacion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgocontroldocumentacion", { ID })
    },

    onNavigateToActasSuspension: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoactassuspension", { ID })
    },

    onNavigateToNotasMinutas: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgonotasminutas", { ID })
    },

    onNavigateToParteDiario: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgopartediario", { ID })
    },
   
    onNavigateToMemoriaCalculo: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgomemoriacalculo", { ID })
    },

    onNavigateToMemoriaCalculoOCE: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgomemoriacalculooce", { ID })
    },
    
    onNavigateToAcopioMateriales: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoacopiomateriales", { ID })
    },

    onNavigateToActasProrroga: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoactasprorroga", { ID })
    },

    onNavigateToInspecElectro: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoinspeccioneselectro", { ID })
    },

    onNavigateToControlPersonal: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgocontrolpersonal", { ID })
    },

    onNavigateToActasTradicion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoactastradicion", { ID })
    },

    onNavigateToRegistrosObra: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoregistrosobra", { ID })
    },

    onNavigateToActasConstatacion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoactasconstatacion", { ID })
    },

    onNavigateToActasAdicionales: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgoactasadicionales", { ID })
    },

    onNavigateToControlSostenimiento: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject()
      this.navToCross("pgocontrolsostenimiento", { ID })
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
      const oObra = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      MessageBox.confirm(this.getResourceBundle().getText("enviarconfirm"), {
        actions: [MessageBox.Action.CANCEL, "Aceptar"],
        emphasizedAction: "Aceptar",
        onClose: async (sAction) => {
          if (sAction !== "Aceptar") {
            return
          }
          try {
            BusyIndicator.show(0)
            const jefe_inspeccion = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID === "JE")
              .map(item => ({
                usuario: item.inspector.usuario,
                correo: item.inspector.correo
              }))
            const inspectores = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID !== "JE")
              .map(item => ({
                usuario: item.inspector.usuario,
                correo: item.inspector.correo
              }))
            const oPayload = {
              definitionId: "pgo.wfaltaobra",
              context: {
                id_obra: oObra.ID,
                cuit: oObra.contratista.nro_documento,
                razon_social: oObra.contratista.razonsocial,
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
            const response = await Services.postWorkflow(oPayload);
            if (response.status === 201) {
              Services.updateObra(oObra.ID, { estado_ID: "PI" }).then(oResponse => {
                if (oResponse.error) {
                  const message = this.getResourceBundle().getText("errorupdate");
                  MessageToast.show(message);
                } else {
                  const message = this.getResourceBundle().getText("obraenviada");
                  MessageBox.success(message);
                  this._onObjectMatched();
                }
              })
            } else {
              const message = this.getResourceBundle().getText("errorservice");
              MessageToast.show(message);
            }
          } catch (error) {
            console.log("--- Error WF ---", error);
            const message = this.getResourceBundle().getText("errorservice");
            MessageToast.show(message);
          } finally {
            BusyIndicator.hide();
          }
        }
      });
    },

    onOpenDialogContratistas: function () {
      const oView = this.getView();
      const oModel = this.getModel("AppJsonModel");
      if (!this._pValueHelpDialogInspectores) {
        this._pValueHelpDialogInspectores = Fragment.load({
          id: oView.getId(),
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.ValueHelpDialogContratistas",
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

    createPdf: async function () {
      const oTable = this.byId("idTablaaltaobras");
      const oBinding = oTable.getBinding("items");
      const oObras = oBinding.oList;
      const { firstname, lastname } = await Services.getUser();
      const oObrasPayload = oObras.map(item => {
        return {
          "nombre": item.nombre === null ? "" : item.nombre,
          "estado": item.estado === null ? "" : item.estado.descripcion,
          "tipo_contrato": item.tipo_contrato === null ? "" : item.tipo_contrato.descripcion,
          "nrop3": item.p3 === null ? "" : item.p3,
          "registro_proveedor": item.contratista.registro_proveedor === null ? "" : item.contratista.registro_proveedor,
          "razonsocial": item.contratista.razonsocial === null ? "" : item.contratista.razonsocial,
          "direccion": item.direccion === null ? "" : item.direccion.descripcion,
          "fluido": item.fluido === null ? "" : item.fluido.descripcion,
          "partido": item.partido === null ? "" : item.partido.descripcion,
          "tipo_obra": item.tipo_obra === null ? "" : item.tipo_obra.descripcion
        }
      })
      const oPayload = {
        "doc_id": "listado_obras",
        "usuario": firstname + " " + lastname,
        "fecha": this.formatter.formatDatePdf(new Date()),
        "formato": "base64",
        "obras": oObrasPayload
      }
      const oBinary = await Services.createPdf(oPayload);
      const timeStamp = (new Date()).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[^0-9]/g, '');
      let sFileName = "listado_obras_" + timeStamp;
      const sMimeType = "pdf";
      let aBuffer = this.base64ToArrayBuffer(oBinary[0]);
      File.save(aBuffer, sFileName, sMimeType);
    },

    base64ToArrayBuffer: function (sBinLine) {
      let binary_string = window.atob(sBinLine);
      let len = binary_string.length;
      let bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    }

  });
});