sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator",
  "com/aysa/pgo/altaobras/model/formatter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Filter"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator, formatter, FilterOperator, Filter) {
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
        oModel.setProperty("/Visible", true);
        const aSteps = oWizard.getSteps();
        aSteps.forEach(oStep => {
          oWizard.nextStep();
        });
      } else {
        oModel.setProperty("/ObraDetalle", []);
        oModel.setProperty("/GrupoResponsables", []);
        oModel.setProperty("/ObraDetalle/ID", null);
        oModel.setProperty("/Visible", false);
        oModel.setProperty("/ordenes_compra", []);
        oModel.setProperty("/proyectos_inversion", []);
        oModel.setProperty("/p3s", []);
        oModel.setProperty("/importes_p3", []);
        oModel.setProperty("/responsables", []);
        oModel.setProperty("/suma_importes_p3", []);
        oModel.setProperty("/ObraDetalle/moneda_ID", "ARS");
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
          contratista_ID: oObra.contratista[0].contratista_ID,
          razonsocial: oObra.contratista[0].contratista.razonsocial,
          nro_documento: oObra.contratista[0].contratista.nro_documento
        };
        oModel.setProperty("/ObraDetalle", oObraDetalle);
        oModel.setProperty("/monto_total", oObraDetalle.monto_original_contrato);
        oModel.setProperty("/Editable", oObraDetalle.estado_ID === "BO" || oObraDetalle.estado_ID === "RE");
        oModel.updateBindings(true);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice");
        MessageToast.show(message);
        oModel.setProperty("/ObraDetalle", []);
      }
    },

    //Combos inspectores y jefes de inspección
    setInspectoresDeUnJefe: async function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/Inspectores", []);
      oModel.setProperty("/GrupoResponsables/inspectores", []);
      this.byId("idComboInspectores").setSelectedKeys([]);
      const grupoResponsables = oModel.getProperty("/GrupoResponsables");
      const aInspectores = await Services.getInspectores();
      let Inspectores = aInspectores.value.filter(item => item.tipo_inspector_ID === 'EM' && grupoResponsables.jefes.includes(item.jefe_inspeccion_ID));
      oModel.setProperty("/Inspectores", Inspectores);
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
      const oModel = this.getModel("AppJsonModel");
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      oObra.p3.forEach(p3 => {
        let suma = 0;
        const data = p3.pi.map(function (item) {
          return {
            nro_pi: item.pi,
            monto: item.monto,
            moneda_ID: item.moneda_ID
          };
        });
        const nros_pi = data.map(o => o.nro_pi).join(', ');
        p3.nros_pi = nros_pi;
        data.forEach(e => {
          if (e.moneda_ID !== "ARS") {
            const cambio = ordenes_compra.find(i => i.moneda_ID === e.moneda_ID);
            let montoArs = parseFloat(e.monto) * cambio.tipo_cambio;
            suma = suma + montoArs;
          } else {
            suma = suma + parseFloat(e.monto);
          }
        });
        p3.montos_pi = suma;
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
      let piData = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(pi => {
          piData.push(pi);
        });
      });
      piData.forEach(item => {
        if (item.responsables) {
          let inspectores = item.responsables.responsables.inspectores.map(e => {
            return {
              nombre: e.inspector.nombre,
              tipo_inspector_ID: e.inspector.tipo_inspector_ID
            };
          });
          let jefes = inspectores.filter(e => e.tipo_inspector_ID === "JE");
          const jefes_nombres = jefes.map(o => o.nombre).join(', ');
          let inspect = inspectores.filter(e => e.tipo_inspector_ID === "EM");
          const inspectores_nombres = inspect.map(o => o.nombre).join(', ');
          item.jefes_nombres = jefes_nombres;
          item.inspectores_nombres = inspectores_nombres;
          item.codigo = item.p3.codigo;
          item.direccion_ID = item.responsables.responsables.direccion_ID;
          item.gerencia_ID = item.responsables.responsables.gerencia_ID;
        }
      });
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/proyectos_inversion", piData);
    },

    //Obtengo los responsables de cada pi
    getResponsables: async function (oObra) {
      const oModel = this.getModel("AppJsonModel");
      let responsables = oObra.responsables.map(item => {
        let inspectores = item.inspectores.map(e => {
          return {
            nombre: e.inspector.nombre,
            tipo_inspector_ID: e.inspector.tipo_inspector_ID
          };
        });
        return {
          ID: item.ID,
          direccion_ID: item.direccion_ID,
          gerencia_ID: item.gerencia_ID,
          inspectores: inspectores,
          jefes_nombres: "",
          inspectores_nombres: ""
        };
      });
      //elimino ids duplicados
      responsables = responsables.filter((v, i, a) => a.findIndex(v2 => (v2.ID === v.ID)) === i);
      responsables.forEach(item => {
        let jefes = item.inspectores.filter(e => e.tipo_inspector_ID === "JE");
        const jefes_nombres = jefes.map(o => o.nombre).join(', ');
        let inspectores = item.inspectores.filter(e => e.tipo_inspector_ID === "EM");
        const inspectores_nombres = inspectores.map(o => o.nombre).join(', ');
        item.jefes_nombres = jefes_nombres;
        item.inspectores_nombres = inspectores_nombres;
      });
      oModel.setProperty("/responsables", responsables);
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

    //Selección de contratista
    onChangeContratista: function () {
      const oModel = this.getModel("AppJsonModel");
      const aContratistas = oModel.getProperty("/Combos/Contratistas");
      const selected = oModel.getProperty("/ObraDetalle/contratista_ID");
      const contratistaData = aContratistas.filter(item => item.ID === selected);
      oModel.setProperty("/ObraDetalle/razonsocial", contratistaData[0].razonsocial);
      oModel.setProperty("/ObraDetalle/nro_documento", contratistaData[0].nro_documento);
      oModel.setProperty("/ObraDetalle/registro_proveedor", contratistaData[0].registro_proveedor);
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
        OC.no_redetermina === undefined ? OC.no_redetermina = false : OC.no_redetermina;
        ordenes_compra.push(OC);
        oModel.setProperty("/ordenes_compra", ordenes_compra);
        this.closeOCDialog();
      }
    },

    deleteOC: async function (oEvent) {
      await this.showMessageConfirm("deleteconfirm");
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

    confirmAddPI: async function () {
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
        const uuid = await Services.getUUID();
        oModel.setProperty("/PI/uuid", uuid.value);
        proyectos_inversion.push(PI);
        oModel.setProperty("/proyectos_inversion", proyectos_inversion);
        //Sumos los importes de cada pi
        this.sumaImportes(proyectos_inversion);
        this.closePIDialog();
      }
    },

    deletePI: async function (oEvent) {
      await this.showMessageConfirm("deleteconfirm");
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const proyectos_inversion = oModel.getProperty("/proyectos_inversion");
      proyectos_inversion.splice(idx, 1);
      //Sumos los importes de cada pi
      this.sumaImportes(proyectos_inversion);
      this.byId("idProyectosInversionTable").getBinding("items").refresh();
    },

    //Asignar responsables a un PI
    addResponsablesPI: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const responsables = oModel.getProperty("/responsables");
      oModel.setProperty("/ResponsablesPI", responsables);
      const oItem = oEvent.getSource();
      const selectedPI = oItem.getBindingContext("AppJsonModel").getObject();
      oModel.setProperty("/selectedPI", selectedPI);
      if (!this._oRespPIDialog) {
        this._oRespPIDialog = Fragment.load({
          id: this.getView().getId(),
          controller: this,
          name: "com.aysa.pgo.altaobras.view.fragments.dialogs.AgregarResponsablesPI"
        }).then(oDialog => {
          this.getView().addDependent(oDialog);
          return oDialog;
        });
      }
      this._oRespPIDialog.then(oDialog => {
        oDialog.open();
      });
    },

    selectResponsablesPI: async function () {
      const selectedResponsables = this.byId("idResponsablesPITable").getSelectedItem().getBindingContext("AppJsonModel").getObject();
      const oModel = this.getModel("AppJsonModel");
      const selectedPI = oModel.getProperty("/selectedPI");
      //agregar responsable edicion
      if (oModel.getProperty("/ObraDetalle/ID") && selectedPI.responsables) {
        try {
          const piResp = {
            pi_ID: selectedPI.ID ? selectedPI.ID : selectedPI.uuid,
            responsables_ID: selectedResponsables.ID ? selectedResponsables.ID : selectedResponsables.uuid
          };
          await Services.updateResponsablesPI(selectedPI.responsables.ID, piResp);
        } catch (error) {
          const message = this.getResourceBundle().getText("errorresponsables");
          MessageToast.show(message);
        }
      }
      selectedPI.inspectores = selectedResponsables.inspectores;
      selectedPI.jefes_nombres = selectedResponsables.jefes_nombres;
      selectedPI.inspectores_nombres = selectedResponsables.inspectores_nombres;
      selectedPI.direccion_ID = selectedResponsables.direccion_ID;
      selectedPI.gerencia_ID = selectedResponsables.gerencia_ID;
      selectedPI.responsables_ID = selectedResponsables.ID ? selectedResponsables.ID : selectedResponsables.uuid;
      this.closeResponsablesPIDialog();
    },

    closeResponsablesPIDialog: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/selectedPI", {});
      this.byId("idResponsablesPITable").removeSelections();
      this.byId("idResponsablesPIDialog").close();
      oModel.refresh(true);
    },

    //Sumo los importes de cada pi
    sumaImportes: function (proyectos_inversion) {
      const oModel = this.getModel("AppJsonModel");
      const ordenes_compra = oModel.getProperty("/ordenes_compra");
      let suma = 0;
      proyectos_inversion.forEach(e => {
        if (e.moneda_ID !== "ARS") {
          const cambio = ordenes_compra.find(i => i.moneda_ID === e.moneda_ID);
          let montoArs = parseFloat(e.monto) * cambio.tipo_cambio;
          suma = suma + montoArs;
        } else {
          suma = suma + parseFloat(e.monto);
        }
      });
      oModel.setProperty("/monto_total", suma);
      oModel.setProperty("/ObraDetalle/monto_original_contrato", suma);
    },

    //Cambio de seleccion de moneda de pi
    onMonedaPISelect: function () {
      const oModel = this.getModel("AppJsonModel");
      const aOrdenesCompra = oModel.getProperty("/ordenes_compra");
      const selected = oModel.getProperty("/PI/moneda_ID");
      const ocData = aOrdenesCompra.filter(item => item.moneda_ID === selected);
      oModel.setProperty("/PI/tipo_cambio", ocData[0].tipo_cambio);
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

    confirmAddResponsables: async function () {
      const oModel = this.getModel("AppJsonModel");
      const grupoResponsables = oModel.getProperty("/GrupoResponsables");
      const responsables = oModel.getProperty("/responsables");
      const aInputs = [this.byId("idComboDirecciones"), this.byId("idComboGerencias")];
      const aMultiInputs = [this.byId("idComboJefes"), this.byId("idComboInspectores")];
      const invalidField = this.validateFields(aInputs, aMultiInputs);
      if (invalidField) {
        const message = this.getResourceBundle().getText("errorfields");
        MessageToast.show(message);
      } else {
        const uuid = await Services.getUUID();
        oModel.setProperty("/GrupoResponsables/uuid", uuid.value);
        const direccion = this.byId("idComboDirecciones").getSelectedItem().mProperties.key;
        const gerencia = this.byId("idComboGerencias").getSelectedItem().mProperties.key;
        oModel.setProperty("/GrupoResponsables/direccion_ID", direccion);
        oModel.setProperty("/GrupoResponsables/gerencia_ID", gerencia);
        const jefesArray = this.byId("idComboJefes").getSelectedItems().map(i => i.mProperties);
        const nombresJefes = jefesArray.map(o => o.text).join(', ');
        oModel.setProperty("/GrupoResponsables/jefes_nombres", nombresJefes);
        const inspectoresArray = this.byId("idComboInspectores").getSelectedItems().map(i => i.mProperties);
        const nombresInspectores = inspectoresArray.map(o => o.text).join(', ');
        oModel.setProperty("/GrupoResponsables/inspectores_nombres", nombresInspectores);
        responsables.push(grupoResponsables);
        oModel.setProperty("/responsables", responsables);
        //Si está editando hago el post del nuevo responsable a la bd
        if (oModel.getProperty("/ObraDetalle/ID")) {
          try {
            const jefesIDs = grupoResponsables.jefes || [];
            const inspectoresIDs = grupoResponsables.inspectores || [];
            const inspectorIDs = [...jefesIDs, ...inspectoresIDs];
            const inspectores = inspectorIDs.map(elem => {
              return {
                inspector_ID: elem
              };
            });
            const nuevosResponsables = {
              ID: grupoResponsables.uuid,
              direccion_ID: grupoResponsables.direccion_ID,
              gerencia_ID: grupoResponsables.gerencia_ID,
              inspectores: inspectores
            };
            await Services.postResponsables({ ...nuevosResponsables, obra_ID: oModel.getProperty("/ObraDetalle/ID") });
          } catch (error) {
            const message = this.getResourceBundle().getText("errorresponsables");
            MessageToast.show(message);
          }
        }
        this.closeResponsablesDialog();
      }
    },

    deleteResponsable: async function (oEvent) {
      await this.showMessageConfirm("deleteconfirm");
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/responsables");
      let selectedpi = [];
      let respID = "";
      if (oEvent.getSource().getBindingContext("AppJsonModel").getObject().ID) { //si esta editando lo borro de la bd
        try {
          BusyIndicator.show(0);
          respID = oEvent.getSource().getBindingContext("AppJsonModel").getObject().ID;
          selectedpi = oModel.getData().proyectos_inversion.filter(function (e) {
            if (e.responsables) {
              return e.responsables.responsables_ID === respID;
            } else {
              return e.responsables_ID === respID;
            }
          });
          const resp = await Services.getResponsablesPI(respID);
          const selectedResp = resp.value[0];
          await Services.deleteResponsablesPI(selectedResp.ID);
          await Services.deleteResponsables(respID);
        } catch (error) {
          const message = this.getResourceBundle().getText("errordelete");
          MessageToast.show(message);
        } finally {
          BusyIndicator.hide();
        }
      } else {
        respID = oEvent.getSource().getBindingContext("AppJsonModel").getObject().uuid;
        selectedpi = oModel.getData().proyectos_inversion.filter(function (e) {
          if (e.responsables) {
            return e.responsables.responsables_ID === respID;
          } else {
            return e.responsables_ID === respID;
          }
        });
      }
      if (selectedpi !== undefined) { //limpio los campos del grupo de responsables asignado al pi
        selectedpi.forEach(pi => {
          delete pi.responsables;
          delete pi.inspectores_nombres;
          delete pi.jefes_nombres;
          delete pi.gerencia_ID;
          delete pi.direccion_ID;
        });
        this.byId("idPiTable").getBinding("items").refresh();
        oModel.refresh(true);
      }
      items.splice(idx, 1);
      this.byId("idResponsablesTable").getBinding("items").refresh();
    },

    //Seteo las gerencias que corresponden a cada direccion en los combos del apartado de responsables
    onChangeDireccion: async function () {
      const oModel = this.getModel("AppJsonModel");
      this.byId("idComboGerencias").setSelectedKey("");
      oModel.setProperty("/Jefes", []);
      oModel.setProperty("/Inspectores", []);
      oModel.setProperty("/GrupoResponsables/jefes", []);
      oModel.setProperty("/GrupoResponsables/inspectores", []);
      const sDireccion = oModel.getProperty("/GrupoResponsables/direccion_ID");
      const oCombo = this.byId("idComboGerencias", sDireccion);
      const oBinding = oCombo.getBinding("items");
      const aFilter = [new Filter({
        path: 'direccion_ID',
        operator: FilterOperator.EQ,
        value1: sDireccion
      })];
      oBinding.filter(aFilter);
      const aInspectores = await Services.getInspectores();
      let Jefes = aInspectores.value.filter(item => item.tipo_inspector_ID === 'JE' && item.direccion_ID === sDireccion);
      oModel.setProperty("/Jefes", Jefes);
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
        this.byId("idInputAnticipoP3").setEnabled(true);
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
        P3.acopio_materiales === undefined ? P3.acopio_materiales = false : P3.acopio_materiales;
        P3.acumar === undefined ? P3.acumar = false : P3.acumar;
        P3.anticipo_financiero === undefined ? P3.anticipo_financiero = 0 : P3.anticipo_financiero;
        p3s.push(P3);
        oModel.setProperty("/p3s", p3s);
        this.closeP3Dialog();
      }
    },

    deleteP3: async function (oEvent) {
      await this.showMessageConfirm("deletep3confirm");
      try {
        const oModel = this.getModel("AppJsonModel");
        const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
        const selectedP3 = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
        await Services.deleteP3(selectedP3.ID);
        const idx = /[0-9]+$/.exec(path)[0];
        const items = oModel.getProperty("/p3s");
        items.splice(idx, 1);
        this.byId("idP3Table").getBinding("items").refresh();
        let importesP3 = oModel.getData().importes_p3.filter(function (e) {
          return e.codigo !== selectedP3.codigo;
        });
        if (importesP3 === undefined) {
          importesP3 = [];
        }
        oModel.setProperty("/importes_p3", importesP3);
        let pi = oModel.getData().proyectos_inversion.filter(function (e) {
          return e.codigo !== selectedP3.codigo;
        });
        if (pi === undefined) {
          pi = [];
        }
        oModel.setProperty("/proyectos_inversion", pi);
        await this.sumaImportes(oModel.getProperty("/proyectos_inversion"));
        oModel.refresh(true);
      } catch (error) {
        const message = this.getResourceBundle().getText("errordeletep3");
        MessageToast.show(message);
      }
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
        ImporteP3.porcentaje_ponderacion === undefined ? ImporteP3.porcentaje_ponderacion = 0 : ImporteP3.porcentaje_ponderacion;
        ImporteP3.importe = parseFloat(ImporteP3.importe);
        importes_p3.push(ImporteP3);
        let importesTemp = importes_p3.filter(e => e.codigo === ImporteP3.codigo);
        const sum = importesTemp.reduce((accumulator, object) => {
          return accumulator + object.porcentaje_ponderacion;
        }, 0);
        if (sum > 100) {
          importes_p3.pop();
          const message = this.getResourceBundle().getText("errorporcponderacion");
          MessageBox.error(message);
        } else {
          oModel.setProperty("/importes_p3", importes_p3);
        }
        this.closeImporteP3Dialog();
      }
    },

    deleteImporteP3: async function (oEvent) {
      await this.showMessageConfirm("deleteconfirm");
      const oModel = this.getModel("AppJsonModel");
      const path = oEvent.getSource().getBindingContext("AppJsonModel").getPath();
      const idx = /[0-9]+$/.exec(path)[0];
      const items = oModel.getProperty("/importes_p3");
      items.splice(idx, 1);
      this.byId("idImportesP3Table").getBinding("items").refresh();
    },

    importeP3Change: function () {
      const oModel = this.getModel("AppJsonModel");
      const aOrdenesCompra = oModel.getProperty("/ordenes_compra");
      const selected = oModel.getProperty("/ImporteP3/moneda_ID");
      let importe = oModel.getProperty("/ImporteP3/importe");
      if (importe !== "" && selected !== undefined) {
        importe = parseFloat(importe.replace(",", "."));
        const ocData = aOrdenesCompra.filter(item => item.moneda_ID === selected);
        oModel.setProperty("/ImporteP3/tipo_cambio", ocData[0].tipo_cambio);
        const tipo_cambio = Number(oModel.getProperty("/ImporteP3/tipo_cambio"));
        let importe_ars = importe * tipo_cambio;
        oModel.setProperty("/ImporteP3/importe_ars", importe_ars);
      }
    },

    onAcopioChange: function () {
      const oModel = this.getModel("AppJsonModel");
      const acopio = oModel.getProperty("/P3/acopio_materiales");
      if (acopio === true) {
        this.byId("idInputAnticipoP3").setEnabled(false);
        oModel.setProperty("/P3/anticipo_financiero", 0);
      } else {
        this.byId("idInputAnticipoP3").setEnabled(true);
      }
    },

    //Pregunta confirma borrado
    showMessageConfirm: function (sText) {
      return new Promise((res, rej) => {
        MessageBox.confirm(this.getResourceBundle().getText(sText), {
          actions: [MessageBox.Action.CANCEL, "Aceptar"],
          emphasizedAction: "Aceptar",
          onClose: sAction => sAction === "Aceptar" ? res() : rej(false)
        });
      });
    },

    //Accion del boton "revisar"
    wizardCompletedHandler: function () {
      const oModel = this.getModel("AppJsonModel");
      if (oModel.getProperty("/Detalle")) {
        const oNavPage = this.byId("wizardNavContainer");
        const oPageReview = this.byId("wizardReviewPage");
        oNavPage.to(oPageReview);
      } else {
        //Chequeo campos obligatorios del step 1
        const aInputs = [this.byId("idNombreObra"), this.byId("idNroContrato"), this.byId("idMontoContrato"), this.byId("idComboMonedas"), this.byId("idComboContratista"),
        this.byId("idRazonSocial"), this.byId("idNroDocumento"), this.byId("inputCorreo"), this.byId("idFechaFirma"), this.byId("idIncrementoMax"), this.byId("idPlazoEjecucion"),
        this.byId("idFondoReparo"), this.byId("idFinanciamiento"), this.byId("idDescuentoMonto"), this.byId("idNroPoliza"), this.byId("idPolizaExtendidaPor"), this.byId("idPorcentajeCobertura")];
        const invalidField = this.validateFields(aInputs);
        if (invalidField) {
          const message = this.getResourceBundle().getText("errorfields");
          MessageBox.error(message);
        } else {
          //Se debe asignar responsables a todos los pi
          const piRespVacio = oModel.getData().proyectos_inversion.find(i => !i.hasOwnProperty("inspectores_nombres"));
          if (piRespVacio) {
            const messagePi = this.getResourceBundle().getText("errorresppi");
            MessageBox.error(messagePi);
          } else {
            const suma = oModel.getData().importes_p3.reduce((total, i) => total + i.importe_ars, 0);
            const monto_total = oModel.getProperty("/monto_total");
            //El total de la suma de los importes pi no es igual al total de los importes de los p3
            //Calulo de margen de error
            const margin = this.errorMarginCalculation(suma, monto_total);
            if (!margin) { //si es mayor a 0,01% muestro el aviso de confirmacion
              this.errorAmountsConfirm();
            } else { //si es menor a 0,01% no muestro el aviso
              const oNavPage = this.byId("wizardNavContainer");
              const oPageReview = this.byId("wizardReviewPage");
              oNavPage.to(oPageReview);
            }
          }
        }
      }
    },

    errorMarginCalculation: function (suma, monto_total) {  
      const marginOfErrorPercent = 0.01;    
      const marginOfError = Math.abs(suma * marginOfErrorPercent / 100);
      const minValue = suma - marginOfError;
      const maxValue = suma + marginOfError;
      return monto_total >= minValue && monto_total <= maxValue;
    },

    //Navegacion de los steps del wizard
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
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/Detalle", false);
      const oWizard = this.byId("CreateObraWizard");
      const oStep = oWizard.getSteps().at(nStep);
      setTimeout(() => {
        oWizard.goToStep(oStep);
      }, 200);
    },

    //Boton cancelar
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

    //Dialogo de advertencia: La suma de los importes de los proyectos de inversión no coincide con el total de los importes de cada P3
    errorAmountsConfirm: function () {
      const errorMessage = this.getResourceBundle().getText("errormontostotales");
      MessageBox.warning(errorMessage, {
        actions: ["Sí", "No"],
        emphasizedAction: "Sí",
        onClose: async (sAction) => {
          if (sAction === "No") {
            return;
          } else {
            const oNavPage = this.byId("wizardNavContainer");
            const oPageReview = this.byId("wizardReviewPage");
            oNavPage.to(oPageReview);
          }
        }
      });
    },

    //Valido los campos a completar
    validateFields: function (aInputs, aMultiInputs) {
      if (!aMultiInputs) {
        aMultiInputs = [];
      }
      if (aMultiInputs.length !== 0) {
        aMultiInputs.forEach(item => {
          item.setValueState(item.getSelectedKeys().length ? "None" : "Error");
        });
      }
      aInputs.forEach(oInput => {
        oInput.setValueState(oInput.getValue() ? "None" : "Error");
        oInput.getType && oInput.getType() === "Email" && oInput.setValueState(this.mailRegex.test(oInput.getValue()) ? "None" : "Error");
        if (oInput.mProperties?.max) {
          oInput.setValueState(oInput.getValue() >= 0 && oInput.getValue() <= 100 ? "None" : "Error");
        }
      });
      return [...aInputs, ...aMultiInputs].some(item => item.getValueState() === "Error");
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
            if (oObraDetalle.ID) {
              await this.updateObra(oObraDetalle);
            } else {
              const responsables = oModel.getData().responsables.map(item => {
                const jefesIDs = item.jefes || [];
                const inspectoresIDs = item.inspectores || [];
                const inspectorIDs = [...jefesIDs, ...inspectoresIDs];
                const inspectores = inspectorIDs.map(elem => {
                  return {
                    inspector_ID: elem
                  };
                });
                return {
                  ID: item.ID ? item.ID : item.uuid,
                  direccion_ID: item.direccion_ID,
                  gerencia_ID: item.gerencia_ID,
                  inspectores: inspectores
                };
              });
              const piList = oModel.getData().proyectos_inversion.map(item => {
                return {
                  ID: item.ID ? item.ID : item.uuid,
                  codigo: item.codigo,
                  tipo_pi_ID: item.tipo_pi_ID,
                  monto: item.monto,
                  moneda_ID: item.moneda_ID,
                  sistema_contratacion_ID: item.sistema_contratacion_ID,
                  pi: item.pi
                };
              });
              const importesList = oModel.getData().importes_p3.map(item => {
                return {
                  codigo: item.codigo,
                  moneda_ID: item.moneda_ID,
                  tipo_cambio: item.tipo_cambio,
                  importe: item.importe,
                  porcentaje_ponderacion: item.porcentaje_ponderacion,
                  importe_ars: item.importe_ars
                };
              });
              const p3s = oModel.getData().p3s.map(item => {
                return {
                  nombre: item.nombre,
                  codigo: item.codigo,
                  tipo_obra_ID: item.tipo_obra_ID,
                  tipo_contrato_ID: item.tipo_contrato_ID,
                  fluido_ID: item.fluido_ID,
                  partido_ID: item.partido_ID,
                  sistema_ID: item.sistema_ID,
                  acumar: item.acumar,
                  acopio_materiales: item.acopio_materiales,
                  anticipo_financiero: item.anticipo_financiero,
                  importes: [],
                  pi: []
                };
              });
              p3s.forEach(p3 => {
                piList.forEach(pi => {
                  if (p3.codigo === pi.codigo) {
                    delete pi.codigo;
                    p3.pi.push(pi);
                  }
                });
                importesList.forEach(imp => {
                  if (p3.codigo === imp.codigo) {
                    delete imp.codigo;
                    p3.importes.push(imp);
                  }
                });
              });
              const contratista = [
                {
                  contratista_ID: oObraDetalle.contratista_ID,
                  vigencia_desde: "2023-12-26",
                  vigencia_hasta: "9999-12-31"
                }
              ];
              const ordenes_compra = oModel.getData().ordenes_compra.map(item => {
                return {
                  moneda_ID: item.moneda_ID,
                  tipo_cambio: item.tipo_cambio,
                  no_redetermina: item.no_redetermina,
                  nro_oc: item.nro_oc,
                  fecha: item.fecha instanceof Date ? formatter.formatDateToBack(item.fecha) : item.fecha
                };
              });
              const oPayload = {
                p3: p3s,
                nombre: oObraDetalle.nombre,
                contratista: contratista,
                ordenes_compra: ordenes_compra,
                nro_contrato: oObraDetalle.nro_contrato,
                representante: oObraDetalle.representante,
                telefono: oObraDetalle.telefono,
                correo: oObraDetalle.correo,
                fecha_firma: oObraDetalle.fecha_firma instanceof Date ? formatter.formatDateToBack(oObraDetalle.fecha_firma) : oObraDetalle.fecha_firma,
                representante_tecnico: oObraDetalle.representante_tecnico,
                nro_matricula: oObraDetalle.nro_matricula,
                apoderado: oObraDetalle.apoderado,
                incremento_maximo: oObraDetalle.incremento_maximo === undefined ? oObraDetalle.incremento_maximo = 0 : Number(oObraDetalle.incremento_maximo),
                moneda_ID: oObraDetalle.moneda_ID,
                plazo_ejecucion: Number(oObraDetalle.plazo_ejecucion),
                um_plazo_ID: oObraDetalle.um_plazo_ID,
                maximo_plazo_extension: Number(oObraDetalle.maximo_plazo_extension),
                um_plazo_maximo_ID: oObraDetalle.um_plazo_maximo_ID,
                financiamiento_obra_ID: oObraDetalle.financiamiento_obra_ID,
                nro_poliza: oObraDetalle.nro_poliza,
                extendida_por: oObraDetalle.extendida_por,
                porcentaje_cobertura: oObraDetalle.porcentaje_cobertura === undefined ? oObraDetalle.porcentaje_cobertura = 0 : Number(oObraDetalle.porcentaje_cobertura),
                fondo_reparo: oObraDetalle.fondo_reparo,
                descuento_monto_contrato: oObraDetalle.descuento_monto_contrato === undefined ? oObraDetalle.descuento_monto_contrato = 0 : Number(oObraDetalle.descuento_monto_contrato),
                monto_original_contrato: oObraDetalle.monto_original_contrato
              };
              const oPreconstruccion = await Services.createPreconstruccion();
              const newObra = await Services.postObra({
                ...oPayload,
                estado_ID: "BO",
                estado_datos_contratista_ID: "AC",
                preconstruccion_ID: oPreconstruccion.ID
              });
              //Responsables
              await this.postResponsables(responsables, newObra.ID);
              //Carpetas DMS
              await Services.createFolderDMSUnificado(oObraDetalle.registro_proveedor, newObra.ID, aAreas); //carpeta unificada
              const promisesDms = [];
              p3s.forEach(p3 => {
                p3.pi.forEach(pi => {
                  promisesDms.push(Services.createFolderDMS(oObraDetalle.registro_proveedor, newObra.ID, p3.codigo, pi.pi, aAreas));
                });
              });
              await Promise.all(promisesDms);
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

    postResponsables: async function (responsables, newObraID) {
      try {
        const oModel = this.getModel("AppJsonModel");
        const promisesResponsables = [];
        responsables.forEach(resp => {
          promisesResponsables.push(Services.postResponsables({ ...resp, obra_ID: newObraID }));
        });
        await Promise.all(promisesResponsables);
        const promisesResponsablesPI = [];
        const proy_inv = oModel.getData().proyectos_inversion.map(item => {
          return {
            pi_ID: item.uuid,
            responsables_ID: item.responsables_ID
          };
        });
        proy_inv.forEach(pi => {
          promisesResponsablesPI.push(Services.postResponsablesPI({ ...pi }));
        });
        await Promise.all(promisesResponsablesPI);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorresponsables");
        MessageToast.show(message);
      }
    },

    updateObra: async function (oObraDetalle) {
      const oModel = this.getModel("AppJsonModel");
      const piList = oModel.getData().proyectos_inversion.map(item => {
        let responsables = {};
        if (item.responsables) {
          responsables = {
            ID: item.responsables.ID,
            pi_ID: item.responsables.pi_ID,
            responsables_ID: item.responsables.responsables_ID
          };
        } else {
          responsables = {
            pi_ID: item.ID ? item.ID : item.uuid,
            responsables_ID: item.responsables_ID
          };
        }
        return {
          ID: item.ID ? item.ID : item.uuid,
          codigo: item.codigo,
          tipo_pi_ID: item.tipo_pi_ID,
          monto: item.monto,
          moneda_ID: item.moneda_ID,
          sistema_contratacion_ID: item.sistema_contratacion_ID,
          pi: item.pi,
          responsables: responsables
        };
      });
      const importesList = oModel.getData().importes_p3.map(item => {
        return {
          codigo: item.codigo,
          moneda_ID: item.moneda_ID,
          tipo_cambio: item.tipo_cambio,
          importe: item.importe,
          porcentaje_ponderacion: item.porcentaje_ponderacion,
          importe_ars: item.importe_ars
        };
      });
      const p3s = oModel.getData().p3s.map(item => {
        return {
          nombre: item.nombre,
          codigo: item.codigo,
          tipo_obra_ID: item.tipo_obra_ID,
          tipo_contrato_ID: item.tipo_contrato_ID,
          fluido_ID: item.fluido_ID,
          partido_ID: item.partido_ID,
          sistema_ID: item.sistema_ID,
          acumar: item.acumar,
          acopio_materiales: item.acopio_materiales,
          anticipo_financiero: item.anticipo_financiero,
          importes: [],
          pi: []
        };
      });
      p3s.forEach(p3 => {
        piList.forEach(pi => {
          if (p3.codigo === pi.codigo) {
            delete pi.codigo;
            p3.pi.push(pi);
          }
        });
        importesList.forEach(imp => {
          if (p3.codigo === imp.codigo) {
            delete imp.codigo;
            p3.importes.push(imp);
          }
        });
      });
      const contratista = [
        {
          contratista_ID: oObraDetalle.contratista_ID,
          vigencia_desde: "2023-12-26",
          vigencia_hasta: "9999-12-31"
        }
      ];
      const ordenes_compra = oModel.getData().ordenes_compra.map(item => {
        return {
          moneda_ID: item.moneda_ID,
          tipo_cambio: item.tipo_cambio,
          no_redetermina: item.no_redetermina,
          nro_oc: item.nro_oc,
          fecha: item.fecha instanceof Date ? formatter.formatDateToBack(item.fecha) : item.fecha
        };
      });
      const oPayload = {
        p3: p3s,
        nombre: oObraDetalle.nombre,
        contratista: contratista,
        ordenes_compra: ordenes_compra,
        nro_contrato: oObraDetalle.nro_contrato,
        representante: oObraDetalle.representante,
        telefono: oObraDetalle.telefono,
        correo: oObraDetalle.correo,
        fecha_firma: oObraDetalle.fecha_firma instanceof Date ? formatter.formatDateToBack(oObraDetalle.fecha_firma) : oObraDetalle.fecha_firma,
        representante_tecnico: oObraDetalle.representante_tecnico,
        nro_matricula: oObraDetalle.nro_matricula,
        apoderado: oObraDetalle.apoderado,
        incremento_maximo: oObraDetalle.incremento_maximo === undefined ? oObraDetalle.incremento_maximo = 0 : Number(oObraDetalle.incremento_maximo),
        moneda_ID: oObraDetalle.moneda_ID,
        plazo_ejecucion: Number(oObraDetalle.plazo_ejecucion),
        um_plazo_ID: oObraDetalle.um_plazo_ID,
        maximo_plazo_extension: Number(oObraDetalle.maximo_plazo_extension),
        um_plazo_maximo_ID: oObraDetalle.um_plazo_maximo_ID,
        financiamiento_obra_ID: oObraDetalle.financiamiento_obra_ID,
        nro_poliza: oObraDetalle.nro_poliza,
        extendida_por: oObraDetalle.extendida_por,
        porcentaje_cobertura: oObraDetalle.porcentaje_cobertura === undefined ? oObraDetalle.porcentaje_cobertura = 0 : Number(oObraDetalle.porcentaje_cobertura),
        fondo_reparo: oObraDetalle.fondo_reparo,
        descuento_monto_contrato: oObraDetalle.descuento_monto_contrato === undefined ? oObraDetalle.descuento_monto_contrato = 0 : Number(oObraDetalle.descuento_monto_contrato),
        monto_original_contrato: oObraDetalle.monto_original_contrato
      };
      try {
        await Services.updateObra(oObraDetalle.ID, oPayload);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorupdate");
        MessageToast.show(message);
      }
    }

  });
});
