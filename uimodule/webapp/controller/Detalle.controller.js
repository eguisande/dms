sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator",
  "com/aysa/pgo/altaobras/model/formatter"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator, formatter) {
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
      oModel.setProperty("/monto_total", "");
      oModel.setProperty("/monto_contrato", "");
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
        oModel.setProperty("/ObraDetalle/ID", null);
        oModel.setProperty("/ordenes_compra", []);
        oModel.setProperty("/proyectos_inversion", []);
        oModel.setProperty("/p3s", []);
        oModel.setProperty("/importes_p3", []);
        oModel.setProperty("/responsables", []);
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
          aGerencias,
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
          Gerencias: aGerencias.value,
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
        //Ordenes de compra
        await this.getOrdenesCompra(oObra);
        //Info de los pi de cada p3
        await this.getPiData(oObra);
        //Lista de pi para tabla de proyectos de inversion
        await this.getPiList(oObra);
        //Obtengo los importes y tipos de cambio de cada p3
        await this.getP3Data(oObra);
        //Lista de responsables de cada pi - to do 
        await this.getResponsables(oObra);
        const oObraDetalle = {
          ID,
          ...oObra,
          fecha_firma: this.formatter.formatDateInput(oObra.fecha_firma),
          monto_total: this.getMontoTotal(oObra),
          contratista_ID: oObra.contratista[0].contratista_ID,
          razonsocial: oObra.contratista[0].contratista.razonsocial,
          nro_documento: oObra.contratista[0].contratista.nro_documento
        };
        oModel.setProperty("/ObraDetalle", oObraDetalle);
        oModel.setProperty("/Editable", oObraDetalle.estado_ID === "BO" || oObraDetalle.estado_ID === "RE");
        oModel.updateBindings(true);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice");
        MessageToast.show(message);
        oModel.setProperty("/ObraDetalle", []);
      }
    },

    //Combos inspectores y jefes de inspección
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

    //Obtengo la lista de ordenes de compra
    getOrdenesCompra: function (oObra) {
      let ocData = [];
      oObra.ordenes_compra.forEach(oc => {
        ocData.push(oc);
      });
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/ordenes_compra", ocData);
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
    getP3Data: function (oObra) {
      const oModel = this.getModel("AppJsonModel");
      let importesp3 = [];
      oObra.p3.forEach(p3 => {
        p3.importes.forEach(i => {
          i.codigo = p3.codigo;
          importesp3.push(i);
        });
      });
      oModel.setProperty("/p3s", oObra.p3);
      oModel.setProperty("/importes_p3", importesp3);
    },

    //lista de pi
    getPiList: function (oObra) {
      const piData = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(pi => {
          piData.push(pi);
        });
      });
      piData.forEach(item => {
        item.codigo = item.p3.codigo;
      });
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/proyectos_inversion", piData);
    },

    //Obtengo los responsables de cada pi
    getResponsables: async function (oObra) {
      const oModel = this.getModel("AppJsonModel");
      let pi = [];
      let responsables = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(item => {
          pi.push(item);
        });
      });
      pi = pi.filter(e => e.responsables != null);
      pi.forEach(item => {
        item.responsables.pi = item.pi;
        item.responsables.direccion_ID = item.responsables.responsables.direccion_ID;
        item.responsables.gerencia_ID = item.responsables.responsables.gerencia_ID;
      });
      pi.forEach(x => {
        responsables.push(x.responsables);
      });
      oModel.setProperty("/responsables", responsables);
    },

    //Sumo los importes de cada pi
    getMontoTotal: function (oObra) {
      const oModel = this.getModel("AppJsonModel");
      let suma = 0;
      oObra.p3.forEach(e => {
        e.importes.forEach(i => {
          if (i.tipo_cambio !== 1) {
            let montoArs = i.importe * i.tipo_cambio;
            suma = suma + montoArs;
          } else {
            suma = suma + i.importe;
          }
        });
        return suma;
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
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      const aInputs = [this.byId("idComboMonedasOC"), this.byId("idInputTipoCambioOC")];
      const invalidField = this.validateFields(aInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        ordenes_compra.push(OC);
        oModel.setProperty("/ordenes_compra", ordenes_compra);
        this.closeOCDialog();
      }
    },

    deleteOC: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/ordenes_compra");
      items.splice(idx, 1);
      this.byId("idOrdenesCompraTable").getBinding("items").refresh();
    },

    //Agregar proyectos de inversion
    addPI: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/PI", {});
      //Combo de p3s
      const p3s = oModel.getProperty("/p3s");
      const codigosP3 = p3s.map(function (item) { return { codigo: item.codigo }; });
      oModel.setProperty("/P3s", codigosP3);
      //Combo de monedas
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      const monedasOC = ordenes_compra.map(function (item) { return { ID: item.moneda_ID }; });
      oModel.setProperty("/Combos/MonedasP3", monedasOC);
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
      const proyectos_inversion = oModel.getProperty("/proyectos_inversion");
      const aInputs = [this.byId("idComboP3sPI"), this.byId("idNroPI"), this.byId("idComboTiposPI"), this.byId("idComboSistContrat"), this.byId("idMontoPI"),
      this.byId("idComboMonedasPI")];
      const invalidField = this.validateFields(aInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        proyectos_inversion.push(PI);
        oModel.setProperty("/proyectos_inversion", proyectos_inversion);
        //Sumos los importes de cada pi
        this.sumaImportes(proyectos_inversion);
        this.closePIDialog();
      }
    },

    deletePI: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/proyectos_inversion");
      items.splice(idx, 1);
      //Sumos los importes de cada pi
      this.sumaImportes(items);
      this.byId("idProyectosInversionTable").getBinding("items").refresh();
    },

    //Sumo los importes de cada pi - TO DO
    sumaImportes: function (importes) {
      const oModel = this.getModel("AppJsonModel");
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      let suma = 0;
      importes.forEach(e => {
        if (e.moneda_ID !== "ARS") {
          //const cambio = tipos_cambio.find(i=>i.moneda_ID)
          let montoArs = Number(e.monto) * Number(e.tipo_cambio);
          suma = suma + montoArs;
        } else {
          suma = suma + Number(e.monto);
        }
      });
      oModel.setProperty("/monto_total", suma);
      oModel.setProperty("/monto_contrato", suma);
    },

    //Agregar responsables de cada pi
    addResponsables: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/GrupoResponsables", {});
      //Combo de pi
      const proyectos_inversion = oModel.getProperty("/proyectos_inversion");
      const nrosPi = proyectos_inversion.map(function (item) { return { pi: item.pi }; });
      oModel.setProperty("/PIs", nrosPi);
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
        this.clearToken();
        oDialog.open();
      });
    },

    closeResponsablesDialog: function () {
      this.byId("idAddResponsablesDialog").close();
    },

    confirmAddResponsables: function () {
      const oModel = this.getModel("AppJsonModel");
      const grupoResponsables = oModel.getProperty("/GrupoResponsables");
      const responsables = oModel.getProperty("/responsables");
      const aInputs = [this.byId("idComboDirecciones"), this.byId("idComboGerencias"), this.byId("idComboPIResponsable")];
      const aMultiInputs = [this.byId("idMultiInputJefes"), this.byId("idMultiInputInspectores")];
      const invalidField = this.validateFields(aInputs, aMultiInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        grupoResponsables.pi.map(o => o).join(', ');
        grupoResponsables.Inspectores.map(o => o).join(', ');
        grupoResponsables.JefesInspectores.map(o => o).join(', ');
        responsables.push(grupoResponsables);
        oModel.setProperty("/responsables", responsables);
        this.closeResponsablesDialog();
      }
    },

    deleteResponsable: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/responsables");
      items.splice(idx, 1);
      this.byId("idResponsablesTable").getBinding("items").refresh();
    },

    openJefeInspeccionDialog: function () {
      var oView = this.getView();
      if (!this._pJefesDialog) {
        this._pJefesDialog = Fragment.load({
          id: oView.getId(),
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.ValueHelpJefesInspeccion",
          controller: this
        }).then(function (oJefesDialog) {
          oView.addDependent(oJefesDialog);
          return oJefesDialog;
        });
      }
      this._pJefesDialog.then(function (oJefesDialog) {
        oJefesDialog.open();
      }.bind(this));
    },

    searchJefesInspeccion: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oFilter = new sap.ui.model.Filter("nombre", sap.ui.model.FilterOperator.Contains, sValue);
      var oBinding = oEvent.getParameter("itemsBinding");
      oBinding.filter([oFilter]);
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
      oModel.setProperty(`/GrupoResponsables/${sProperty}`, oSelectedItem.map(item => {
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

    clearToken: function () {
      const oMultiJefes = this.getView().byId("idMultiInputJefes");
      const oMultiInspectores = this.getView().byId("idMultiInputInspectores");
      oMultiJefes.setTokens([]);
      oMultiInspectores.setTokens([]);
    },

    closeJefesInspeccionDialog: function () {
      this.byId("idSelectDialogJefes").close();
    },

    closeInspectoresDialog: function () {
      this.byId("idSelectDialogInspectores").close();
    },

    openInspectorDialog: function () {
      var oView = this.getView();
      if (!this._pInspectorDialog) {
        this._pInspectorDialog = Fragment.load({
          id: oView.getId(),
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.ValueHelpInspectores",
          controller: this
        }).then(function (oInspectorDialog) {
          oView.addDependent(oInspectorDialog);
          return oInspectorDialog;
        });
      }
      this._pInspectorDialog.then(function (oInspectorDialog) {
        oInspectorDialog.open();
      }.bind(this));
    },

    searchInspectores: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oFilter = new sap.ui.model.Filter("nombre", sap.ui.model.FilterOperator.Contains, sValue);
      var oBinding = oEvent.getParameter("itemsBinding");
      oBinding.filter([oFilter]);
    },

    closeInspectorDialog: function (oEvent) {
      const aSelectedItems = oEvent.getParameter("selectedItems");
      const oMultiInput = this.byId("idInspectores");
      if (aSelectedItems && aSelectedItems.length > 0) {
        aSelectedItems.forEach(function (oItem) {
          oMultiInput.addToken(new sap.m.Token({
            text: oItem.getTitle()
          }));
        });
      }
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
      const p3s = oModel.getProperty("/p3s");
      const aInputs = [this.byId("idInputCodigoP3"), this.byId("idInputNombreP3"), this.byId("idComboTipoContratoP3"), this.byId("idComboFluidoP3"),
      this.byId("idComboTipoObraP3"), this.byId("idComboPartidoP3"), this.byId("idComboSistemaP3"), this.byId("idInputAnticipoP3")];
      const invalidField = this.validateFields(aInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        p3s.push(P3);
        oModel.setProperty("/p3s", p3s);
        this.closeP3Dialog();
      }
    },

    deleteP3: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/p3s");
      items.splice(idx, 1);
      this.byId("idP3Table").getBinding("items").refresh();
    },

    //Agregar importes para cada p3
    addImporteP3: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/ImporteP3", {});
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      const monedasOC = ordenes_compra.map(function (item) { return { ID: item.moneda_ID }; });
      oModel.setProperty("/Combos/MonedasP3", monedasOC);
      const p3s = oModel.getProperty("/p3s");
      const codigosP3 = p3s.map(function (item) { return { codigo: item.codigo }; });
      oModel.setProperty("/P3s", codigosP3);
      if (!this._oP3ImporteDialog) {
        this._oP3ImporteDialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarImporteP3"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oP3ImporteDialog.then(oDialog => {
        oDialog.open();
      });
    },

    closeImporteP3Dialog: function () {
      this.byId("idAddImporteP3Dialog").close();
    },

    confirmAddImporteP3: function () {
      const oModel = this.getModel("AppJsonModel");
      const ImporteP3 = oModel.getProperty("/ImporteP3");
      const importes_p3 = oModel.getProperty("/importes_p3");
      const aInputs = [this.byId("idComboCodigoImporteP3"), this.byId("idImporteP3"), this.byId("idComboMonedaImporteP3"), this.byId("idPorcentajePondImporteP3")];
      const invalidField = this.validateFields(aInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        importes_p3.push(ImporteP3);
        oModel.setProperty("/importes_p3", importes_p3);
        this.closeImporteP3Dialog();
      }
    },

    deleteImporteP3: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/importes_p3");
      items.splice(idx, 1);
      this.byId("idImportesP3Table").getBinding("items").refresh();
    },

    onMonedaP3Select: function () {
      const oModel = this.getModel("AppJsonModel");
      const aOrdenesCompra = oModel.getProperty("/ordenes_compra");
      const selected = oModel.getProperty("/ImporteP3/moneda");
      const ocData = aOrdenesCompra.filter(item => item.moneda === selected);
      oModel.setProperty("/ImporteP3/tipo_cambio", ocData[0].tipo_cambio);
      const importe = oModel.getProperty("/ImporteP3/importe");
      const tipo_cambio = oModel.getProperty("/ImporteP3/tipo_cambio");
      if (importe !== "") {
        const importe_ars = Number(importe) * Number(tipo_cambio);
        oModel.setProperty("/ImporteP3/importe_ars", importe_ars);
      }
    },

    //Selección de contratista
    onChangeContratista: function () {
      const oModel = this.getModel("AppJsonModel");
      const aContratistas = oModel.getProperty("/Combos/Contratistas");
      const selected = oModel.getProperty("/ObraDetalle/contratista_ID");
      const contratistaData = aContratistas.filter(item => item.ID === selected);
      oModel.setProperty("/ObraDetalle/razonsocial", contratistaData[0].razonsocial);
      oModel.setProperty("/ObraDetalle/nro_documento", contratistaData[0].nro_documento);
    },

    //Seteo las gerencias que corresponden a cada direccion en los combos del apartado de responsables
    onChangeDireccion: function () {
      const oModel = this.getModel("AppJsonModel");
      const sDireccion = oModel.getProperty("/GrupoResponsables/direccion_ID");
      const oCombo = this.byId("idComboGerencias", sDireccion);
      const oBinding = oCombo.getBinding("items");
      const aFilter = [new sap.ui.model.Filter({
        path: 'direccion_ID',
        operator: sap.ui.model.FilterOperator.EQ,
        value1: sDireccion
      })];
      oBinding.filter(aFilter);
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

    setFilterDireccion: function (oValueHelpDialog, oModel) {
      const idDireccion = oModel.getProperty("/ObraDetalle/direccion_ID");
      const oBinding = oValueHelpDialog.getBinding("items");
      oBinding.filter([
        new sap.ui.model.Filter("direccion_ID", sap.ui.model.FilterOperator.Contains, idDireccion),
        new sap.ui.model.Filter("borrado", sap.ui.model.FilterOperator.NE, true)
      ]);
    },

    //Datos financieros y cumplimientos: seteo maximo plazo de extension
    setMaximoPlazo: function () {
      const oModel = this.getModel("AppJsonModel");
      const message = this.getResourceBundle().getText("errorplazomax");
      let plazo_ejecucion_model = oModel.getProperty("/ObraDetalle/plazo_ejecucion");
      if (this.byId("idIncrementoMax").getValue() === 0) {
        oModel.setProperty("/ObraDetalle/incremento_maximo", 0);
      }
      let incremento_maximo_model = oModel.getProperty("/ObraDetalle/incremento_maximo");
      let incremento_maximo = Number(incremento_maximo_model);
      let plazo_ejecucion = Number(plazo_ejecucion_model);
      let maximo_plazo_extension = plazo_ejecucion + ((plazo_ejecucion * incremento_maximo) / 100);
      maximo_plazo_extension = Math.round(maximo_plazo_extension);
      oModel.setProperty("/ObraDetalle/maximo_plazo_extension", maximo_plazo_extension);
      if (maximo_plazo_extension > plazo_ejecucion + 180) {
        this.byId("idPlazoEjecucion").setValueState("Error");
        MessageToast.show(message);
      } else {
        this.byId("idPlazoEjecucion").setValueState("None");
      }
    },

    setUmMaximoPLazo: function () {
      //17/7/23: Se asocia a la entidad UMGeneral y se pone predeterminado no editable la UM Días
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/ObraDetalle/um_plazo_ID", "D");
      let um_plazo_original = oModel.getProperty("/ObraDetalle/um_plazo_ID");
      oModel.setProperty("/ObraDetalle/um_plazo_maximo_ID", um_plazo_original);
    },

    //TO DO completar
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
            // const responsables = oModel.responsables.map(item => { //--- TO DO
            //   return {
            //     direccion_ID: item.direccion,
            //     gerencia_ID: item.gerencia,
            //     inspectores: null 
            //   }
            // })             
            const proyectos_inversion = oModel.proyectos_inversion.map(item => {
              return {
                tipo_pi_ID: item.tipo_pi,
                monto: item.importe,
                moneda_ID: item.moneda,
                sistema_contratacion_ID: item.sistema_contratacion,
                pi: item.pi,
                responsables: null
                //responsables: responsables //--- TO DO
              };
            });
            const importes_p3 = oModel.importes_p3.map(item => {
              return {
                moneda_ID: item.moneda,
                tipo_cambio: item.tipo_cambio,
                importe: item.importe,
                porcentaje_ponderacion: item.porcentaje_ponderacion,
                importe_ars: item.importe_ars
              };
            });
            const p3 = oModel.p3s.map(item => {
              return {
                codigo: item.codigo,
                tipo_obra_ID: item.tipo_obra,
                tipo_contrato_ID: item.tipo_contrato,
                fluido_ID: item.fluido,
                partido_ID: item.partido,
                sistema_ID: item.sistema,
                acumar: item.acumar,
                acopio_materiales: item.acopio,
                anticipo_financiero: item.anticipo_financiero,
                importes: importes_p3,
                pi: proyectos_inversion
              };
            });
            const contratista = oObraDetalle.map(item => {
              return {
                contratista_ID: item.registro_proveedor,
                vigencia_desde: "2023-12-20",
                vigencia_hasta: "9999-12-31"
              };
            });
            const ordenes_compra = oModel.ordenes_compra.map(item => {
              return {
                moneda_ID: item.moneda_ID,
                tipo_cambio: item.tipo_cambio,
                no_redetermina: item.no_redetermina,
                nro_oc: item.nro_oc,
                revision: null,
                fecha: item.fecha
              };
            });
            const oPayload = {
              p3: p3,
              nombre: oObraDetalle.nombre,
              contratista: contratista,
              ordenes_compra: ordenes_compra,
              nro_contrato: oObraDetalle.nro_contrato,
              representante: oObraDetalle.representante,
              telefono: oObraDetalle.telefono,
              correo: oObraDetalle.correo,
              fecha_firma: this.formatter.formatDateToBack(oObraDetalle.fecha_firma),
              representante_tecnico: oObraDetalle.representante_tecnico,
              nro_matricula: oObraDetalle.nro_matricula,
              apoderado: oObraDetalle.apoderado,
              incremento_maximo: Number(oObraDetalle.incremento_maximo),
              moneda_ID: oObraDetalle.moneda_ID,
              plazo_ejecucion: Number(oObraDetalle.plazo_ejecucion),
              um_plazo_ID: oObraDetalle.um_plazo_ID,
              maximo_plazo_extension: Number(oObraDetalle.maximo_plazo_extension),
              um_plazo_maximo_ID: oObraDetalle.um_plazo_maximo_ID,
              financiamiento_obra_ID: oObraDetalle.financiamiento_obra_ID,
              nro_poliza: oObraDetalle.nro_poliza,
              extendida_por: oObraDetalle.extendida_por,
              porcentaje_cobertura: oObraDetalle.porcentaje_cobertura,
              descuento_monto_contrato: oObraDetalle.descuento_monto_contrato
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

    //Valido los campos a completar
    validateFields: function (aInputs, aMultiInputs) {
      let aMultis;
      if (!aMultiInputs) {
        aMultiInputs = [];
      }
      aInputs.forEach(oInput => {
        oInput.setValueState(oInput.getValue() ? "None" : "Error");
      });
      aMultiInputs.forEach(item=> {
        aMultis = item.setValueState(item.getTokens().length ? "None" : "Error");
      })      
      return [...aInputs, aMultis].some(item => item.getValueState() === "Error");
    },

    //TO DO
    // validateFields: function () {
    //   const idMultiInputJefes = this.byId("idMultiInputJefes");
    //   const idMultiInputInspectores = this.byId("idMultiInputInspectores");
    //   const idStep1P3 = this.byId("idStep1P3");
    //   const idStep1Nombre = this.byId("idStep1Nombre");
    //   const idStep2Representante = this.byId("idStep2Representante");
    //   const oModel = this.getModel("AppJsonModel");
    //   if (!oModel.getProperty("/Combos")) {
    //     return;
    //   }
    //   const aInputs = [
    //     this.byId("idStep1P3"),
    //     this.byId("idStep1Nombre"),
    //     this.byId("idStep1TipoContrato"),
    //     this.byId("idStep1Fluido"),
    //     this.byId("idStep1TipoObra"),
    //     this.byId("idStep1Partido"),
    //     this.byId("idStep1Sistema"),
    //     this.byId("idStep2Representante"),
    //     this.byId("idStep2Telefono"),
    //     this.byId("idStep2Correo"),
    //     this.byId("idStep3Direccion"),
    //     this.byId("idComboGerencias"),
    //     //this.byId("idStep4TipoPI"),
    //     this.byId("idStep4FechaFirma"),
    //     this.byId("idStep4PlazoEjecucion"),
    //     this.byId("idStep4UM"),
    //     this.byId("idStep4PlazoMaxEjecucion"),
    //     this.byId("idStep4UMEjecucion"),
    //     this.byId("idStep4Financiamientos"),
    //     this.byId("idStep4Incremento"),
    //     this.byId("idStep4AnticipoFinanciero"),
    //     this.byId("idStep4FondoReparo"),
    //     this.byId("idStep5Poliza"),
    //     this.byId("idStep5ExtendidaPor"),
    //     this.byId("idStep5Cobertura"),
    //     ...oModel.getProperty("/ObraDetalle/PI")
    //   ];
    //   aInputs.forEach(oInput => {
    //     oInput.setValueState(oInput.getValue() ? "None" : "Error");
    //     oInput.getType && oInput.getType() === "Email" && oInput.setValueState(this.mailRegex.test(oInput.getValue()) ? "None" : "Error");
    //     if (oInput.mProperties?.max) {
    //       oInput.setValueState(oInput.getValue() >= 0 && oInput.getValue() <= 100 ? "None" : "Error");
    //     }
    //   });
    //   idMultiInputJefes.setValueState(idMultiInputJefes.getTokens().length ? "None" : "Error");
    //   idMultiInputInspectores.setValueState(idMultiInputInspectores.getTokens().length ? "None" : "Error");
    //   idStep1P3.setValueState(this.numTextInputRegex.test(idStep1P3.getValue()) ? "None" : "Error");
    //   idStep1Nombre.setValueState(this.numTextInputRegex.test(idStep1Nombre.getValue()) ? "None" : "Error");
    //   idStep2Representante.setValueState(this.textInputRegex.test(idStep2Representante.getValue()) ? "None" : "Error");
    //   oModel.updateBindings(true);
    //   return [...aInputs, idMultiInputJefes, idMultiInputInspectores, idStep1P3, idStep1Nombre, idStep2Representante].some(item => item.getValueState() === "Error");
    // }

  });
});
