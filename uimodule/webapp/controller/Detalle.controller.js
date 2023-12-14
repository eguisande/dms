sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator",
  "sap/m/IconTabFilter"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator, IconTabFilter) {
  "use strict";

  return Controller.extend("com.aysa.pgo.altaobras.controller.Detalle", {
    mailRegex: /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/,
    numTextInputRegex: /^[0-9A-Za-z]+([\s]{1}[0-9A-Za-z]+)*$/,
    textInputRegex: /^[A-Za-z]+([\s]{1}[A-Za-z]+)*$/,

    onInit: function () {
      const oManifest = this.getOwnerComponent().getManifestObject();
      const urlCatalog = oManifest.resolveUri("catalog");
      const urlDMS = oManifest.resolveUri("dms");
      const urlWF = oManifest.resolveUri("bpmworkflowruntime");
      const urlUserApi = oManifest.resolveUri("user-api");
      const urlPdfApi = oManifest.resolveUri("generatePDF");
      Services.setUrl(urlCatalog, urlDMS, urlWF, urlUserApi, urlPdfApi);
      this.getRouter().getRoute("Detalle").attachPatternMatched(this._onObjectMatched, this);
    },

    _onObjectMatched: async function (oEvent) {
      const { ID } = oEvent.getParameter("arguments");
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/Editable", true);
      oModel.setProperty("/SelectedContratista", "");
      oModel.setProperty("/P3s", []);
      oModel.setProperty("/ProyectosInversion", []);
      oModel.setProperty("/OrdenesCompra", []);
      //this.clearToken();
      this.loadCombos(ID);
      const oNavPage = this.byId("wizardNavContainer");
      //Vistas de creación
      const oPageWizard = this.byId("wizardContentPage");
      //Vistas de detalle-edición
      const oPageReview = this.byId("wizardReviewPage");
      //Reset Wizard
      const oWizard = this.byId("CreateObraWizard");
      const oFirstStep = oWizard.getSteps().at(0);
      oWizard.discardProgress(oFirstStep);
      // scroll to top
      oWizard.goToStep(oFirstStep);
      //navigate wizard
      if (ID) {
        oNavPage.to(oPageReview);
        await this.setDataToView(oModel, ID);
        const aSteps = oWizard.getSteps();
        aSteps.forEach(oStep => {
          oWizard.nextStep();
        });
      } else {
        oModel.setProperty("/ObraDetalle", []);
        this.setUmMaximoPLazo();
        const oFirstStep = oWizard.getSteps().at(0);
        oWizard.discardProgress(oFirstStep);
        // scroll to top
        oWizard.goToStep(oFirstStep);
        oNavPage.to(oPageWizard);
      }
    },

    loadCombos: async function (ID) {
      try {
        const oModel = this.getModel("AppJsonModel");
        BusyIndicator.show(0);
        const [
          oObra,
          aDirecciones,
          aDireccionGerencias,
          aInspectores,
          aTiposContratos,
          aFluidos,
          aPartidos,
          aSistemas,
          aTiposObras,
          aMonedas,
          aUnidadesMedida,
          aSistemasContratacion,
          aFinanciamientos,
          aAreas,
          aTiposPI,
          aContratistas
        ] = await Promise.all([
          ID ? Services.getObra(ID) : {},
          Services.getDirecciones(),
          Services.getGerencias(),
          Services.getInspectores(),
          Services.getTiposContratos(),
          Services.getFluidos(),
          Services.getPartidos(),
          Services.getSistemas(),
          Services.getTiposObras(),
          Services.getMonedas(),
          Services.getUnidadesMedida(),
          Services.getSistemasContratacion(),
          Services.getFinanciamientos(),
          Services.getAreas(),
          Services.getTiposPI(),
          Services.getContratistas()
        ]);
        let Jefes = aInspectores.value.filter(item => item.tipo_inspector_ID === 'JE');
        if (oObra.inspectores) {
          Jefes = Jefes.map(inspector => {
            oObra.inspectores.forEach(obraIn => {
              if (inspector.ID == obraIn.inspector_ID) {
                inspector.selected = true;
              }
            });
            return inspector;
          });
        }
        oModel.setProperty("/Combos", {
          Direcciones: aDirecciones.value,
          DireccionGerencias: aDireccionGerencias.value,
          JefeInspectores: Jefes,
          Inspectores: aInspectores.value.filter(item => item.tipo_inspector_ID === 'EM'),
          TiposContratos: aTiposContratos.value,
          TiposPI: aTiposPI.value,
          Fluidos: aFluidos.value,
          Partidos: aPartidos.value,
          Sistemas: aSistemas.value,
          TiposObras: aTiposObras.value,
          Monedas: aMonedas.value,
          UnidadesMedida: aUnidadesMedida.value,
          SistemasContratacion: aSistemasContratacion.value,
          Financiamientos: aFinanciamientos.value,
          Areas: aAreas.value,
          Contratistas: aContratistas.value
        });
        BusyIndicator.hide();
      } catch (error) {
        console.log(error);
        const message = this.getResourceBundle().getText("errorservice");
        BusyIndicator.hide();
        MessageToast.show(message);
      }
    },

    setDataToView: async function (oModel, ID) {
      try {
        const oObra = await Services.getObra(ID);
        //Info de los pi de cada p3
        await this.getPiData(oObra);
        //Lista de pi para tabla de proyectos de inversion
        await this.getPiList(oObra);
        //Obtengo los importes y tipos de cambio de cada p3
        await this.getImportesP3(oObra);
        //Lista de responsables de cada pi - to do 
        //await this.getResponsables(oObra);
        // const [oOrdenCompra, { value: quantity }, { value: OCQuantity }] = await Promise.all([
        //   Services.getValidatePIPorveedor(oObra.proyecto_inversion, oObra.contratista.registro_proveedor),
        //   Services.getQuantity(oObra.proyecto_inversion),
        //   Services.getOCQuantity(oObra.proyecto_inversion)
        // ]);
        // const oMultiJefes = this.getView().byId("idMultiInputJefes");
        // const oMultiInspectores = this.getView().byId("idMultiInputInspectores");
        // const aInspectoresNotNull = oObra.inspectores.filter(item => item.inspector !== null);
        // const aJefes = aInspectoresNotNull.filter(item => item.inspector.tipo_inspector_ID === 'JE');
        // const aInspectores = aInspectoresNotNull.filter(item => item.inspector.tipo_inspector_ID === 'EM');
        const oObraDetalle = {
          //...oOrdenCompra,
          //quantity,
          //PI: this.getPITable(oObra.pi),
          // JefesInspectores: aJefes.map(item => (item.inspector_ID)), //Jefes de inspección
          // Inspectores: aInspectores.map(item => (item.inspector_ID)) //Inspectores
          ID,
          ...oObra,
          fecha_firma: this.formatter.formatDateInput(oObra.fecha_firma),
          monto_total: this.getMontoTotal(oObra)      
        };
        // this.setTokensWizard(oMultiJefes, aJefes);
        // this.setTokensWizard(oMultiInspectores, aInspectores);
        oModel.setProperty("/ObraDetalle", oObraDetalle);
        oModel.setProperty("/Editable", oObraDetalle.estado_ID === "BO" || oObraDetalle.estado_ID === "RE");
        oModel.updateBindings(true);
        //this.setInspectoresDeUnJefe(true);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice");
        MessageToast.show(message);
        oModel.setProperty("/ObraDetalle", []);
      }
    },

     //Obtengo los pi que pertenecen a cada p3
     getPiData: function (oObra) {
      oObra.p3.forEach(p3 => {
        const data = p3.pi.map(function (item) {
          return {
            nro_pi: item.pi,
            monto: item.monto
          };
        });
        const nros_pi = data.map(o => o.nro_pi).join(', ');
        const montos_pi = data.map(o => o.monto).join(', ');
        p3.nros_pi = nros_pi;
        p3.montos_pi = montos_pi;
      });
    },

    //Obtengo los importes y tipos de cambio de cada p3
    getImportesP3: function (oObra) {
      oObra.p3.forEach(p3 => {
        const data = p3.importes.map(function (item) {
          return {
            importe: item.importe,
            tipo_cambio: item.tipo_cambio,
            moneda_ID: item.moneda_ID
          };
        });
        const importes = data.map(o => o.importe).join(', ');
        const tipos_cambio = data.map(o => o.tipo_cambio).join(', ');
        const monedas = data.map(o => o.moneda_ID).join(', '); 
        p3.importesP3 = importes;
        p3.tipos_cambioP3 = tipos_cambio;
        p3.monedasP3 = monedas;
      });
    },

    getPiList: function (oObra) {
      const piData = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(pi => {
          piData.push(pi);
        });
      });
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/PiList", piData);
    },

    //Obtengo los inspectores
    setInspectoresDeUnJefe: async function (select) {
      const oModel = this.getModel("AppJsonModel");
      const oObraDetalle = oModel.getProperty("/ObraDetalle");
      const aInspectores = await Services.getInspectores();
      let Inspectores = aInspectores.value.filter(item => item.tipo_inspector_ID === 'EM' && oObraDetalle.JefesInspectores.includes(item.jefe_inspeccion_ID));
      Inspectores = Inspectores.map(inspector => {
        if (select) {
          inspector.selected = true;
        }
        return inspector;
      });
      oModel.setProperty("/Combos/Inspectores", Inspectores);
    },

    //Sumo los importes de cada pi
    getMontoTotal: function (oObra) {
      const oModel = this.getModel("AppJsonModel");
      let suma = 0;
      oObra.p3.forEach(e => {
        e.importes.forEach(i => {
          if (i.tipo_cambio !== 1) {
            let montoArs = i.importe * i.tipo_cambio
            suma = suma + montoArs
          } else {
            suma = suma + i.importe            
          }
        })
        return suma
      });
      oModel.setProperty("/monto_total", suma);
      oModel.setProperty("/monto_contrato", suma);
    },

    //Agregar ordenes de compra
    addOC: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/OrdenCompra", {});
      if (!this._oOCDialog) {
        this._oOCDialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarOC"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oOCDialog.then(oDialog => {
        oDialog.open();
      });
    },

    closeOCDialog: function () {
      this.byId("idAddOCDialog").close();
    },

    confirmAddOC: function () {
      const oModel = this.getModel("AppJsonModel");
      const OC = oModel.getProperty("/OrdenCompra");
      const ordenes_compra = oModel.getProperty("/OrdenesCompra");
      ordenes_compra.push(OC);
      oModel.setProperty("/OrdenesCompra", ordenes_compra);
      this.closeOCDialog();
    },

    deleteOC: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/OrdenesCompra");
      items.splice(idx, 1);
      this.byId("idOrdenesCompraTable").getBinding("items").refresh();
    },

    //Agregar proyectos de inversion
    addPI: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/PI", {});
      if (!this._oPIDialog) {
        this._oPIDialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarPI"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oPIDialog.then(oDialog => {
        oDialog.open();
      });
    },

    closePIDialog: function () {
      this.byId("idAddPIDialog").close();
    },

    confirmAddPI: function () {
      const oModel = this.getModel("AppJsonModel");
      const PI = oModel.getProperty("/PI");
      const proyectos_inversion = oModel.getProperty("/ProyectosInversion");
      proyectos_inversion.push(PI);
      oModel.setProperty("/ProyectosInversion", proyectos_inversion);
      //Sumos los importes de cada pi
      this.sumaImportes(proyectos_inversion);
      this.closePIDialog();
    },

    deletePI: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/ProyectosInversion");
      items.splice(idx, 1);
      //Sumos los importes de cada pi
      this.sumaImportes(items);
      this.byId("idProyectosInversionTable").getBinding("items").refresh();
    },

    //Sumo los importes de cada pi
    sumaImportes: function (importes) {
      const oModel = this.getModel("AppJsonModel");
      let suma = 0;
      importes.forEach(e => {
        if (e.tipo_cambio !== 1) {
          let montoArs = Number(e.importe) * Number(e.tipo_cambio)
          suma = suma + montoArs
        } else {
          suma = suma + Number(e.importe)            
        }
      });
      oModel.setProperty("/monto_total", suma);
      oModel.setProperty("/monto_contrato", suma);
    },

    //Agregar responsables de cada pi
    addResponsables: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/GrupoResponsables", {});
      if (!this._oResponsablesDialog) {
        this._oResponsablesDialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarResponsables"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oResponsablesDialog.then(oDialog => {
        oDialog.open();
      });
    },

    closeResponsablesDialog: function () {
      this.byId("idAddResponsablesDialog").close();
    },

    confirmAddResponsables: function () {
      const oModel = this.getModel("AppJsonModel");
      const grupoResponsables = oModel.getProperty("/GrupoResponsables");
      const responsables = oModel.getProperty("/Responsables");
      responsables.push(grupoResponsables);
      oModel.setProperty("/Responsables", responsables);
      this.closeResponsablesDialog();
    },

    deleteResponsable: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/Responsables");
      items.splice(idx, 1);
      this.byId("idResponsablesTable").getBinding("items").refresh();
    },

    //Agregar P3
    addP3: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/P3", {});
      if (!this._oP3Dialog) {
        this._oP3Dialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarP3"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oP3Dialog.then(oDialog => {
        oDialog.open();
      });
    },

    closeP3Dialog: function () {
      this.byId("idAddP3Dialog").close();
    },

    confirmAddP3: function () {
      const oModel = this.getModel("AppJsonModel");
      const P3 = oModel.getProperty("/P3");
      const p3s = oModel.getProperty("/P3s");
      p3s.push(P3);
      oModel.setProperty("/P3s", p3s);
      this.closeP3Dialog();
    },

    deleteP3: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/P3s");
      items.splice(idx, 1);
      this.byId("idP3Table").getBinding("items").refresh();
    },

    //Selección de contratista
    onChangeContratista: function () {
      const oModel = this.getModel("AppJsonModel");
      const aContratistas = oModel.getProperty("/Combos/Contratistas");
      const selected = oModel.getProperty("/SelectedContratista");
      const contratistaData = aContratistas.filter(item => item.ID === selected);
      oModel.setProperty("/ObraDetalle/razonsocial", contratistaData[0].razonsocial);
      oModel.setProperty("/ObraDetalle/nro_documento", contratistaData[0].nro_documento);
    },

    //TO DO
    getResponsables: function (oObra) {
      const piData = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(pi => {
          piData.push(pi.ID);
        });
      });
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/PiList", piData);
    },

    setTokensWizard: function (oMultiInput, aData) {
      oMultiInput.setTokens(
        aData.map(item => {
          const { ID, nombre } = item.inspector;
          return new sap.m.Token({ text: nombre, key: ID });
        })
      );
    },

    //TO DO - validar campos obligatorios
    wizardCompletedHandler: function () {
      const oModel = this.getModel("AppJsonModel");
      const oObraDetalle = oModel.getProperty("/ObraDetalle");
      // if (this.validateFields(oObraDetalle) && !oModel.getProperty("/Detalle")) {
      //   const message = this.getResourceBundle().getText("errorfields");
      //   return MessageToast.show(message);
      // }
      const oNavPage = this.byId("wizardNavContainer");
      const oPageReview = this.byId("wizardReviewPage");
      oNavPage.to(oPageReview);
    },

    onChangeDireccion: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const sDireccion = oModel.getProperty("/ObraDetalle/direccion_ID");
      const oDialogJefes = this.byId("idSelectDialogJefes");
      const oDialogInspectores = this.byId("idSelectDialogInspectores");
      oModel.setProperty("/ObraDetalle/gerencia_ID", null);
      oModel.setProperty("/ObraDetalle/JefesInspectores", []);
      oModel.setProperty("/ObraDetalle/Inspectores", []);
      oDialogJefes && oDialogJefes.clearSelection();
      oDialogInspectores && oDialogInspectores.clearSelection();
      this.setComboFilter(sDireccion);
      this.clearToken();
    },

    clearToken: function () {
      const oMultiJefes = this.getView().byId("idMultiInputJefes");
      const oMultiInspectores = this.getView().byId("idMultiInputInspectores");
      oMultiJefes.setTokens([]);
      oMultiInspectores.setTokens([]);
    },

    setComboFilter: function (sDireccion) {
      const oCombo = this.byId("idComboDireccionGerencias", sDireccion);
      const oBinding = oCombo.getBinding("items");
      const aFilter = [new sap.ui.model.Filter({
        path: 'direccion_ID',
        operator: sap.ui.model.FilterOperator.EQ,
        value1: sDireccion
      })];
      oBinding.filter(aFilter);
    },

    editStepOne: function () {
      this.navigationToStep(0);
    },

    editStepTwo: function () {
      this.navigationToStep(1);
    },

    editStepThree: function () {
      this.navigationToStep(2);
    },

    editStepFour: function () {
      this.navigationToStep(3);
    },

    editStepFive: function () {
      this.navigationToStep(4);
    },

    navigationToStep: function (nStep) {
      this.byId("wizardNavContainer").back();
      const oWizard = this.byId("CreateObraWizard");
      const oStep = oWizard.getSteps().at(nStep);
      setTimeout(() => {
        oWizard.goToStep(oStep);
      }, 200);
    },

    handleWizardCancel: function () {
      const oModel = this.getModel("AppJsonModel");
      if (!oModel.getProperty("/Detalle")) {
        MessageBox.confirm(this.getResourceBundle().getText("cancelarconfirm"), {
          actions: ["Sí", "No"],
          emphasizedAction: "No",
          onClose: async (sAction) => {
            if (sAction === "No") {
              return;
            } else {
              this.onNavBack();
            }
          }
        });
      } else {
        this.onNavBack();
      }
    },

    onOpenDialogJefe: function () {
      const oView = this.getView();
      const oModel = this.getModel("AppJsonModel");
      if (!this._pValueHelpDialogJefes) {
        this._pValueHelpDialogJefes = Fragment.load({
          id: oView.getId(),
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.ValueHelpDialogJefes",
          controller: this
        }).then(oValueHelpDialog => {
          oView.addDependent(oValueHelpDialog);
          return oValueHelpDialog;
        });
      }
      this._pValueHelpDialogJefes.then(oValueHelpDialog => {
        oValueHelpDialog.setModel(oModel);
        this.setFilterDireccion(oValueHelpDialog, oModel);
        oValueHelpDialog.open();
      });
    },

    onOpenDialogInspectores: function () {
      const oView = this.getView();
      const oModel = this.getModel("AppJsonModel");
      if (!this._pValueHelpDialogInspectores) {
        this._pValueHelpDialogInspectores = Fragment.load({
          id: oView.getId(),
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.ValueHelpDialogInspectores",
          controller: this
        }).then(oValueHelpDialog => {
          oView.addDependent(oValueHelpDialog);
          return oValueHelpDialog;
        });
      }
      this._pValueHelpDialogInspectores.then(oValueHelpDialog => {
        oValueHelpDialog.setModel(oModel);
        this.setFilterDireccion(oValueHelpDialog, oModel);
        oValueHelpDialog.open();
      });
    },

    setFilterDireccion: function (oValueHelpDialog, oModel) {
      const idDireccion = oModel.getProperty("/ObraDetalle/direccion_ID");
      const oBinding = oValueHelpDialog.getBinding("items");
      oBinding.filter([
        new sap.ui.model.Filter("direccion_ID", sap.ui.model.FilterOperator.Contains, idDireccion),
        new sap.ui.model.Filter("borrado", sap.ui.model.FilterOperator.NE, true)
      ]);
    },

    onValueHelpDialogJefesConfirm: function (oEvent) {
      const oMultiJefes = this.getView().byId("idMultiInputJefes");
      this.setDataMultiInput(oEvent, oMultiJefes, "JefesInspectores");
      this.setInspectoresDeUnJefe(false);
    },

    onValueHelpDialogInpectoresConfirm: function (oEvent) {
      const oMultiInspectores = this.getView().byId("idMultiInputInspectores");
      this.setDataMultiInput(oEvent, oMultiInspectores, "Inspectores");
    },

    setDataMultiInput: function (oEvent, oMultiJefes, sProperty) {
      const oSelectedItem = oEvent.getParameter("selectedItems");
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty(`/ObraDetalle/${sProperty}`, oSelectedItem.map(item => {
        const { ID } = item.getBindingContext("AppJsonModel").getObject();
        return ID;
      }));
      oMultiJefes.setTokens(
        oSelectedItem.map(item => {
          const { ID, nombre } = item.getBindingContext("AppJsonModel").getObject();
          return new sap.m.Token({ text: nombre, key: ID });
        })
      );
    },

    deleteJefe: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      let sType = oEvent.getParameter("type"),
        aRemovedTokens = oEvent.getParameter("removedTokens"),
        oMultiJefes = this.getView().byId("idMultiInputJefes"),
        aJefes = oModel.getProperty("/Combos/JefeInspectores");
      if (sType == "removed") {
        aJefes.forEach(item => {
          if (item.ID == aRemovedTokens[0].getKey()) item.selected = false;
        });
        oMultiJefes = oMultiJefes.getTokens().filter(function (oContext) {
          return oContext.getKey() !== aRemovedTokens[0].getKey();
        });
        oModel.refresh();
      }
      oModel.setProperty(`/ObraDetalle/JefesInspectores`, oMultiJefes)
        ;
    },

    deleteInspector: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      let sType = oEvent.getParameter("type"),
        aRemovedTokens = oEvent.getParameter("removedTokens"),
        oMultiInspectores = this.getView().byId("idMultiInputInspectores"),
        aInspectores = oModel.getProperty("/Combos/Inspectores");
      if (sType == "removed") {
        aInspectores.forEach(item => {
          if (item.ID == aRemovedTokens[0].getKey()) item.selected = false;
        });
        oMultiInspectores = oMultiInspectores.getTokens().filter(function (oContext) {
          return oContext.getKey() !== aRemovedTokens[0].getKey();
        });
        oModel.refresh();
      }
      oModel.setProperty(`/ObraDetalle/Inspectores`, oMultiInspectores)
        ;
    },

    onValueHelpDialogJefesClose: function () {
      this.byId("idSelectDialogJefes").close();
    },

    onValueHelpDialogInspectoresClose: function () {
      this.byId("idSelectDialogInspectores").close();
    },

    onSearchInspector: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const sValue = oEvent.getParameter("value");
      const idDireccion = oModel.getProperty("/ObraDetalle/direccion_ID");
      const aFilter =
        [
          new sap.ui.model.Filter("nombre", sap.ui.model.FilterOperator.Contains, sValue),
          new sap.ui.model.Filter("direccion_ID", sap.ui.model.FilterOperator.Contains, idDireccion)
        ];
      const oBinding = oEvent.getParameter("itemsBinding");
      oBinding.filter(aFilter);
    },

    //Datos financieros y cumplimientos: seteo maximo plazo de extension
    setMaximoPlazo: function () {
      const oModel = this.getModel("AppJsonModel");
      const message = this.getResourceBundle().getText("errorplazomax");
      let plazo_ejecucion_model = oModel.getProperty("/ObraDetalle/plazo_ejecucion");
      if (this.byId("idStep4Incremento").getValue() === 0) {
        oModel.setProperty("/ObraDetalle/incremento_maximo", 0);
      }
      let incremento_maximo_model = oModel.getProperty("/ObraDetalle/incremento_maximo");
      let incremento_maximo = Number(incremento_maximo_model);
      let plazo_ejecucion = Number(plazo_ejecucion_model);
      let maximo_plazo_extension = plazo_ejecucion + ((plazo_ejecucion * incremento_maximo) / 100);
      maximo_plazo_extension = Math.round(maximo_plazo_extension);
      oModel.setProperty("/ObraDetalle/maximo_plazo_extension", maximo_plazo_extension);
      if (maximo_plazo_extension > plazo_ejecucion + 180) {
        this.byId("idStep4PlazoEjecucion").setValueState("Error");
        MessageToast.show(message);
      } else {
        this.byId("idStep4PlazoEjecucion").setValueState("None");
      }
    },

    setUmMaximoPLazo: function () {
      //17/7/23: Se asocia a la entidad UMGeneral y se pone predeterminado no editable la UM Días
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/ObraDetalle/um_plazo_ID", "D");
      let um_plazo_original = oModel.getProperty("/ObraDetalle/um_plazo_ID");
      oModel.setProperty("/ObraDetalle/um_plazo_maximo_ID", um_plazo_original);
    },

    handleWizardSubmit: async function () {
      let that = this;
      MessageBox.confirm(this.getResourceBundle().getText("saveConfirm"), {
        actions: [MessageBox.Action.CANCEL, "Aceptar"],
        emphasizedAction: "Aceptar",
        onClose: async (sAction) => {
          if (sAction !== "Aceptar") {
            return;
          }
          try {
            BusyIndicator.show(0);
            const oModel = this.getModel("AppJsonModel");
            const oObraDetalle = oModel.getProperty("/ObraDetalle");
            const aAreas = oModel.getProperty("/Combos/Areas");
            const inspectores = [...oObraDetalle.JefesInspectores?.map(jefe => { return { inspector_ID: jefe }; }) || [],
            ...oObraDetalle.Inspectores?.map(item => { return { inspector_ID: item }; }) || []];
            const pi = oObraDetalle.PI.map(item => {
              const oPI = {
                pi: item.pi,
                tipo_pi_ID: item.tipo_pi_ID,
                quantity: item.quantity,
                sistema_contratacion_ID: item.sistema_contratacion_ID,
              };
              return item.ID ? { ID: item.ID, ...oPI } : oPI;
            });
            const oPayload = {
              p3: oObraDetalle.p3,
              nombre: oObraDetalle.nombre,
              proyecto_inversion: oObraDetalle.proyecto_inversion,
              tipo_obra_ID: oObraDetalle.tipo_obra_ID,
              tipo_contrato_ID: oObraDetalle.tipo_contrato_ID,
              tipo_pi_ID: oObraDetalle.tipo_pi_ID,
              fluido_ID: oObraDetalle.fluido_ID,
              partido_ID: oObraDetalle.partido_ID,
              sistema_ID: oObraDetalle.sistema_ID,
              direccion_ID: oObraDetalle.direccion_ID,
              gerencia_ID: oObraDetalle.gerencia_ID,
              inspectores,
              acumar: oObraDetalle.acumar,
              representante: oObraDetalle.representante,
              telefono: oObraDetalle.telefono,
              correo: oObraDetalle.correo,
              no_redetermina: oObraDetalle.no_redetermina,
              fecha_firma: this.formatter.formatDateToBack(oObraDetalle.fecha_firma),
              pi,
              representante_tecnico: oObraDetalle.representante_tecnico,
              nro_matricula: oObraDetalle.nro_matricula,
              apoderado: oObraDetalle.apoderado,
              incremento_maximo: oObraDetalle.incremento_maximo,
              moneda_ID: oObraDetalle.moneda,
              plazo_ejecucion: Number(oObraDetalle.plazo_ejecucion),
              um_plazo_ID: oObraDetalle.um_plazo_ID,
              maximo_plazo_extension: Number(oObraDetalle.maximo_plazo_extension),
              um_plazo_maximo_ID: oObraDetalle.um_plazo_maximo_ID,
              acopio_materiales: oObraDetalle.acopio_materiales,
              anticipo_financiero: oObraDetalle.anticipo_financiero,
              fondo_reparo: oObraDetalle.fondo_reparo,
              financiamiento_obra_ID: oObraDetalle.financiamiento_obra_ID,
              contratista_ID: oObraDetalle.contratista.ID,
              nro_poliza: oObraDetalle.nro_poliza,
              extendida_por: oObraDetalle.extendida_por,
              porcentaje_cobertura: oObraDetalle.porcentaje_cobertura,
              nro_contrato: oObraDetalle.nro_contrato,
              nro_proveedor: oObraDetalle.nro_proveedor,
              proveedor: oObraDetalle.proveedor,
              cuit: oObraDetalle.cuit,
              oc: oObraDetalle.oc,
              fecha_oc: oObraDetalle.fecha_oc,
              quantity: oObraDetalle.quantity,
              tasa_cambio: oObraDetalle.tasa_cambio,
            };
            if (oObraDetalle.ID) {
              await Services.updateObra(oObraDetalle.ID, oPayload);
            } else {
              const oPreconstruccion = await Services.createPreconstruccion();
              await Promise.all([
                Services.postObra({
                  ...oPayload,
                  estado_ID: "BO",
                  estado_datos_contratista_ID: "AC",
                  preconstruccion_ID: oPreconstruccion.ID
                }),
                Services.createFolderDMS(oObraDetalle.p3, oObraDetalle.nro_proveedor, aAreas)
              ]);
            }
            const message = this.getResourceBundle().getText("cambiosguardados");
            MessageBox.success(message, {
              actions: [MessageBox.Action.CLOSE],
              onClose: function () {
                that.onNavBack();
              }
            });
          } catch (error) {
            const message = this.getResourceBundle().getText("errorservice");
            MessageToast.show(message);
          } finally {
            BusyIndicator.hide();
          }
        }
      });
    },

    validateFields: function (oObraDetalle) {
      const idMultiInputJefes = this.byId("idMultiInputJefes");
      const idMultiInputInspectores = this.byId("idMultiInputInspectores");
      const idStep1P3 = this.byId("idStep1P3");
      const idStep1Nombre = this.byId("idStep1Nombre");
      const idStep2Representante = this.byId("idStep2Representante");
      const oModel = this.getModel("AppJsonModel");
      if (!oModel.getProperty("/Combos")) {
        return;
      }
      const aInputs = [
        this.byId("idStep1P3"),
        this.byId("idStep1Nombre"),
        this.byId("idStep1TipoContrato"),
        this.byId("idStep1Fluido"),
        this.byId("idStep1TipoObra"),
        this.byId("idStep1Partido"),
        this.byId("idStep1Sistema"),
        this.byId("idStep2Representante"),
        this.byId("idStep2Telefono"),
        this.byId("idStep2Correo"),
        this.byId("idStep3Direccion"),
        this.byId("idComboDireccionGerencias"),
        //this.byId("idStep4TipoPI"),
        this.byId("idStep4FechaFirma"),
        this.byId("idStep4PlazoEjecucion"),
        this.byId("idStep4UM"),
        this.byId("idStep4PlazoMaxEjecucion"),
        this.byId("idStep4UMEjecucion"),
        this.byId("idStep4Financiamientos"),
        this.byId("idStep4Incremento"),
        this.byId("idStep4AnticipoFinanciero"),
        this.byId("idStep4FondoReparo"),
        this.byId("idStep5Poliza"),
        this.byId("idStep5ExtendidaPor"),
        this.byId("idStep5Cobertura"),
        ...oModel.getProperty("/ObraDetalle/PI")
      ];
      aInputs.forEach(oInput => {
        oInput.setValueState(oInput.getValue() ? "None" : "Error");
        oInput.getType && oInput.getType() === "Email" && oInput.setValueState(this.mailRegex.test(oInput.getValue()) ? "None" : "Error");
        if (oInput.mProperties?.max) {
          oInput.setValueState(oInput.getValue() >= 0 && oInput.getValue() <= 100 ? "None" : "Error");
        }
      });
      idMultiInputJefes.setValueState(idMultiInputJefes.getTokens().length ? "None" : "Error");
      idMultiInputInspectores.setValueState(idMultiInputInspectores.getTokens().length ? "None" : "Error");
      idStep1P3.setValueState(this.numTextInputRegex.test(idStep1P3.getValue()) ? "None" : "Error");
      idStep1Nombre.setValueState(this.numTextInputRegex.test(idStep1Nombre.getValue()) ? "None" : "Error");
      idStep2Representante.setValueState(this.textInputRegex.test(idStep2Representante.getValue()) ? "None" : "Error");
      oModel.updateBindings(true);
      return [...aInputs, idMultiInputJefes, idMultiInputInspectores, idStep1P3, idStep1Nombre, idStep2Representante].some(item => item.getValueState() === "Error");
    }

  });
});
