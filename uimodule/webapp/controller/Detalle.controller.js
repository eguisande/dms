sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator) {
  "use strict";

  return Controller.extend("com.aysa.pgo.altaobras.controller.Detalle", {
    mailRegex: /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/,
    numTextInputRegex: /^[0-9A-Za-z]+([\s]{1}[0-9A-Za-z]+)*$/,  
    textInputRegex: /^[A-Za-z]+([\s]{1}[A-Za-z]+)*$/, 

    onInit: function () {
      this.getRouter().getRoute("Detalle").attachPatternMatched(this._onObjectMatched, this);
    },

    _onObjectMatched: async function (oEvent) {
      const { ID } = oEvent.getParameter("arguments")
      const oModel = this.getModel("AppJsonModel")
      oModel.setProperty("/Editable", true)
      this.clearToken()
      this.loadCombos()
      const oNavPage = this.byId("wizardNavContainer");
      const oPageWizard = this.byId("wizardContentPage")
      const oPageReview = this.byId("wizardReviewPage")
      //Reset Wizard
      const oWizard = this.byId("CreateObraWizard");
      const oFirstStep = oWizard.getSteps().at(0);
      oWizard.discardProgress(oFirstStep);
      // scroll to top
      oWizard.goToStep(oFirstStep);
      //navigate wizard
      if (ID) {
        oNavPage.to(oPageReview)
        await this.setDataToView(oModel, ID)
        const aSteps = oWizard.getSteps()
        aSteps.forEach(oStep => {
          oWizard.nextStep()
        });
      } else {
        oModel.setProperty("/ObraDetalle/ID", null)
        const oFirstStep = oWizard.getSteps().at(0);
        oWizard.discardProgress(oFirstStep);
        // scroll to top
        oWizard.goToStep(oFirstStep);
        oNavPage.to(oPageWizard)
      }
    },

    loadCombos: async function () {
      try {
        const oModel = this.getModel("AppJsonModel")
        BusyIndicator.show(0)
        const [
          aDirecciones,
          aDireccionGerencias,
          aInspectores,
          aTiposContratos,
          aFluidos,
          aPartidos,
          aSistemas,
          aTiposaltaobras,
          aMonedas,
          aUnidadesMedida,
          aSistemasContratacion,
          aFinanciamientos,
          aAreas,
        ] = await Promise.all([
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
        ])
        oModel.setProperty("/Combos", {
          Direcciones: aDirecciones.value,
          DireccionGerencias: aDireccionGerencias.value,
          JefeInspectores: aInspectores.value.filter(item => item.tipo_inspector_ID === 'JE'),
          Inspectores: aInspectores.value.filter(item => item.tipo_inspector_ID === 'EM'),
          TiposContratos: aTiposContratos.value,
          Fluidos: aFluidos.value,
          Partidos: aPartidos.value,
          Sistemas: aSistemas.value,
          Tiposaltaobras: aTiposaltaobras.value,
          Monedas: aMonedas.value,
          UnidadesMedida: aUnidadesMedida.value,
          SistemasContratacion: aSistemasContratacion.value,
          Financiamientos: aFinanciamientos.value,
          Areas: aAreas.value,
        })
        BusyIndicator.hide()
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice")
        BusyIndicator.hide()
        MessageToast.show(message)
      }
    },

    setDataToView: async function (oModel, ID) {
      try {
        const oObra = await Services.getObra(ID)
        const [oOrdenCompra, { value: quantity }, { value: OCQuantity }] = await Promise.all([
          Services.getValidatePIPorveedor(oObra.proyecto_inversion, oObra.contratista.registro_proveedor),
          Services.getQuantity(oObra.proyecto_inversion),
          Services.getOCQuantity(oObra.proyecto_inversion)
        ])
        const oMultiJefes = this.getView().byId("idMultiInputJefes")
        const oMultiInspectores = this.getView().byId("idMultiInputInspectores")
        const aJefes = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID === 'JE')
        const aInspectores = oObra.inspectores.filter(item => item.inspector.tipo_inspector_ID === 'EM')
        const oObraDetalle = {
          ID,
          ...oOrdenCompra,
          ...oObra,
          quantity,
          PI: this.getPITable(oObra.pi),
          fecha_firma: this.formatter.formatDateInput(oObra.fecha_firma),
          JefesInspectores: aJefes.map(item => (item.inspector_ID)),
          Inspectores: aInspectores.map(item => (item.inspector_ID))
        }
        this.setTokensWizard(oMultiJefes, aJefes)
        this.setTokensWizard(oMultiInspectores, aInspectores)
        oModel.setProperty("/ObraDetalle", oObraDetalle);
        oModel.setProperty("/Editable", oObraDetalle.estado_ID === "BO" || oObraDetalle.estado_ID === "RE")
        oModel.updateBindings(true)
      } catch (error) {
        console.log(error)
      }
    },

    setTokensWizard: function (oMultiInput, aData) {
      oMultiInput.setTokens(
        aData.map(item => {
          const { ID, nombre } = item.inspector;
          return new sap.m.Token({ text: nombre, key: ID })
        })
      );
    },

    wizardCompletedHandler: function () {
      const oModel = this.getModel("AppJsonModel");
      const oObraDetalle = oModel.getProperty("/ObraDetalle");
      if (this.validateFields(oObraDetalle)) {
        const message = this.getResourceBundle().getText("errorfields")
        return MessageToast.show(message)
      }
      const oNavPage = this.byId("wizardNavContainer");
      const oPageReview = this.byId("wizardReviewPage")
      oNavPage.to(oPageReview)
    },

    onChangeDireccion: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const sDireccion = oModel.getProperty("/ObraDetalle/direccion_ID")
      const oDialogJefes = this.byId("idSelectDialogJefes");
      const oDialogInspectores = this.byId("idSelectDialogInspectores");
      oModel.setProperty("/ObraDetalle/gerencia_ID", null)
      oModel.setProperty("/ObraDetalle/JefesInspectores", [])
      oModel.setProperty("/ObraDetalle/Inspectores", [])
      oDialogJefes && oDialogJefes.clearSelection()
      oDialogInspectores && oDialogInspectores.clearSelection()
      this.setComboFilter(sDireccion)
      this.clearToken()
    },

    clearToken: function () {
      const oMultiJefes = this.getView().byId("idMultiInputJefes")
      const oMultiInspectores = this.getView().byId("idMultiInputInspectores")
      oMultiJefes.setTokens([])
      oMultiInspectores.setTokens([])
    },

    setComboFilter: function (sDireccion) {
      const oCombo = this.byId("idComboDireccionGerencias", sDireccion)
      const oBinding = oCombo.getBinding("items")
      const aFilter = [new sap.ui.model.Filter({
        path: 'direccion_ID',
        operator: sap.ui.model.FilterOperator.EQ,
        value1: sDireccion
      })]
      oBinding.filter(aFilter)
    },

    editStepOne: function () {
      this.navigationToStep(0)
    },

    editStepTwo: function () {
      this.navigationToStep(1)
    },

    editStepThree: function () {
      this.navigationToStep(2)
    },

    editStepFour: function () {
      this.navigationToStep(3)
    },

    editStepFive: function () {
      this.navigationToStep(4)
    },

    navigationToStep: function (nStep) {
      this.byId("wizardNavContainer").back()
      const oWizard = this.byId("CreateObraWizard");
      const oStep = oWizard.getSteps().at(nStep);
      setTimeout(() => {
        oWizard.goToStep(oStep)
      }, 200);
    },

    handleWizardCancel: function () {
      this.onNavBack()
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
        oValueHelpDialog.setModel(oModel)
        this.setFilterDireccion(oValueHelpDialog, oModel)
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
        oValueHelpDialog.setModel(oModel)
        this.setFilterDireccion(oValueHelpDialog, oModel)
        oValueHelpDialog.open();
      });
    },

    setFilterDireccion: function (oValueHelpDialog, oModel) {
      const idDireccion = oModel.getProperty("/ObraDetalle/direccion_ID")
      const oBinding = oValueHelpDialog.getBinding("items")
      oBinding.filter([
        new sap.ui.model.Filter("direccion_ID", sap.ui.model.FilterOperator.Contains, idDireccion),
        new sap.ui.model.Filter("borrado", sap.ui.model.FilterOperator.NE, true)
      ])
    },

    onValueHelpDialogJefesConfirm: function (oEvent) {
      const oMultiJefes = this.getView().byId("idMultiInputJefes");
      this.setDataMultiInput(oEvent, oMultiJefes, "JefesInspectores")
    },

    onValueHelpDialogInpectoresConfirm: function (oEvent) {
      const oMultiInspectores = this.getView().byId("idMultiInputInspectores");
      this.setDataMultiInput(oEvent, oMultiInspectores, "Inspectores")
    },

    setDataMultiInput: function (oEvent, oMultiJefes, sProperty) {
      const oSelectedItem = oEvent.getParameter("selectedItems")
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty(`/ObraDetalle/${sProperty}`, oSelectedItem.map(item => {
        const { ID } = item.getBindingContext("AppJsonModel").getObject();
        return ID;
      }))
      oMultiJefes.setTokens(
        oSelectedItem.map(item => {
          const { ID, nombre } = item.getBindingContext("AppJsonModel").getObject();
          return new sap.m.Token({ text: nombre, key: ID })
        })
      );
    },

    onValueHelpDialogJefesClose: function () {
      this.byId("idSelectDialogJefes").close()
    },

    onValueHelpDialogInspectoresClose: function () {
      this.byId("idSelectDialogInspectores").close()
    },

    onSearchInspector: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const sValue = oEvent.getParameter("value");
      const idDireccion = oModel.getProperty("/ObraDetalle/direccion_ID")
      const aFilter =
        [
          new sap.ui.model.Filter("nombre", sap.ui.model.FilterOperator.Contains, sValue),
          new sap.ui.model.Filter("direccion_ID", sap.ui.model.FilterOperator.Contains, idDireccion)
        ];
      const oBinding = oEvent.getParameter("itemsBinding");
      oBinding.filter(aFilter);
    },

    handleWizardSubmit: async function () {
      let that = this;
      MessageBox.confirm(this.getResourceBundle().getText("saveConfirm"), {
        actions: [MessageBox.Action.CANCEL, "Aceptar"],
        emphasizedAction: "Aceptar",
        onClose: async (sAction) => {
          if (sAction !== "Aceptar") {
            return
          }
          try {
            BusyIndicator.show(0)
            const oModel = this.getModel("AppJsonModel");
            const oObraDetalle = oModel.getProperty("/ObraDetalle");
            const aAreas = oModel.getProperty("/Combos/Areas");
            const inspectores = [...oObraDetalle.JefesInspectores?.map(jefe => { return { inspector_ID: jefe } }) || [],
            ...oObraDetalle.Inspectores?.map(item => { return { inspector_ID: item } }) || []]
            const pi = oObraDetalle.PI.map(item => {
              const oPI = {
                pi: item.pi,
                tipo_pi_ID: item.tipo_pi_ID,
                quantity: item.quantity
              }
              return item.ID ? { ID: item.ID, ...oPI } : oPI
            })
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
              sistema_contratacion_ID: oObraDetalle.sistema_contratacion_ID,
              financiamiento_obra_ID: oObraDetalle.financiamiento_obra_ID,
              contratista_ID: oObraDetalle.contratista.ID,
              nro_poliza: Number(oObraDetalle.nro_poliza),
              extendida_por: oObraDetalle.extendida_por,
              porcentaje_cobertura: oObraDetalle.porcentaje_cobertura
            }
            if (oObraDetalle.ID) {
              Services.updateObra(oObraDetalle.ID, oPayload)
            } else {
              const oPreconstruccion = await Services.cretePreconstruccion()
              await Promise.all([
                Services.postObra({
                  ...oPayload,
                  estado_ID: "BO",
                  estado_datos_contratista_ID: "AC",
                  preconstruccion_ID: oPreconstruccion.ID
                }),
                Services.creteFolderDMS(oObraDetalle.p3, oObraDetalle.nro_proveedor, aAreas)
              ])
            }
            const message = this.getResourceBundle().getText("cambiosguardados");
            MessageBox.success(message, {
              actions: [MessageBox.Action.CLOSE],
              onClose: function () {
                that.onNavBack();
              }
            });           
          } catch (error) {
            const message = this.getResourceBundle().getText("errorservice")
            MessageToast.show(message)
          } finally {
            BusyIndicator.hide()
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
        return
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
        this.byId("idStep4SistemasContratacion"),
        this.byId("idStep4Financiamientos"),
        this.byId("idStep4Incremento"),
        this.byId("idStep4AnticipoFinanciero"),
        this.byId("idStep4FondoReparo"),
        this.byId("idStep5Poliza"),
        this.byId("idStep5ExtendidaPor"),
        this.byId("idStep5Cobertura"),
        ...oModel.getProperty("/ObraDetalle/PI")
      ]
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
