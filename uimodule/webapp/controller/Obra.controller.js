sap.ui.define([
  "com/aysa/pgo/altaobras/controller/BaseController",
  "com/aysa/pgo/altaobras/services/Services",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/ui/core/BusyIndicator",
  "sap/ui/core/util/File",
  "com/aysa/pgo/altaobras/model/formatter",
  "sap/ui/model/Sorter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, Services, Fragment, MessageBox, MessageToast, BusyIndicator, File, formatter, Sorter, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("com.aysa.pgo.altaobras.controller.Obra", {
    onInit: async function () {
      const oModel = this.getModel("AppJsonModel");
      const oManifest = this.getOwnerComponent().getManifestObject();
      const urlCatalog = oManifest.resolveUri("catalog");
      const urlDMS = oManifest.resolveUri("dms");
      const urlWF = oManifest.resolveUri("bpmworkflowruntime");
      const urlUserApi = oManifest.resolveUri("user-api");
      const urlPdfApi = oManifest.resolveUri("generatePDF");
      Services.setUrl(urlCatalog, urlDMS, urlWF, urlUserApi, urlPdfApi);
      this.getRouter().getRoute("Obra").attachPatternMatched(this._onObjectMatched, this);
      // Services.getContratistas().then(data => {
      //   oModel.setProperty("/Contratistas", data.value);
      // });
    },

    _onObjectMatched: async function () {
      try {
        BusyIndicator.show(0);
        const oModel = this.getModel("AppJsonModel");
        oModel.setProperty("/Detalle", false);
        const { email } = await Services.getUser();
        const oUserRoles = await Services.getUserRoles();
        this.setUserData(oUserRoles.value, email);
        const aObras = await this.getObrasData();
        aObras.forEach(obra => {
          const data = obra.p3.map(function (p3) {
            return {
              codigo: p3.codigo,
              tipo_contrato: p3.tipo_contrato.descripcion,
              tipo_obra: p3.tipo_obra.descripcion,
              tipo_fluido: p3.fluido.descripcion,
              partido: p3.partido.descripcion
            };
          });
          const tipos_fluidos = data.map(o => o.tipo_fluido).join(', ');
          const tipos_contratos = data.map(o => o.tipo_contrato).join(', ');
          const p3 = data.map(o => o.codigo).join(', ');
          const tipos_obras = data.map(o => o.tipo_obra).join(', ');
          const partidos = data.map(o => o.partido).join(', ');
          obra.tipo_fluido = tipos_fluidos;
          obra.tipo_contrato = tipos_contratos;
          obra.nro_p3 = p3;
          obra.tipo_obra = tipos_obras;
          obra.partido = partidos;
          obra.contratista = obra.contratista[0].contratista;
        });
        oModel.setProperty("/altaobras", aObras);
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice");
        MessageToast.show(message);
      } finally {
        BusyIndicator.hide();
      }
    },

    setUserData: function (aGroups, user) {
      const oModel = this.getModel("AppJsonModel");
      const sDetalle = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Contratista" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector");
      const sPartidimetro = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Contratista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Analista" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector");
      const sPlanTrabajo = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Contratista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector");
      const sPreconstruccion = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Contratista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Analista" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector");
      const sOferta = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Analista" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector");
      const sJefeInspector = aGroups.find(oGrupo => oGrupo === "PGO_JefeInspeccion");
      const sInspector = aGroups.find(oGrupo => oGrupo === "PGO_Inspector");
      const sAreaGenero = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaGenero" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaCarteleria = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaCarteleria" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaMedioambiente = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaMedioambiente" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaPolizas = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaPolizas" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaSegHigiene = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaSeguridadHigiene" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaPermisos = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaPermisos" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaIngenieria = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaIngenieria" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAreaInterferencias = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_AreaInterferencias" || oGrupo === "PGO_Contratista" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sAll = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_AreaGenero"
        || oGrupo === "PGO_AreaCarteleria" || oGrupo === "PGO_AreaMedioambiente" || oGrupo === "PGO_AreaPolizas" || oGrupo === "PGO_AreaSeguridadHigiene" || oGrupo === "PGO_AreaPermisos"
        || oGrupo === "PGO_AreaIngenieria" || oGrupo === "PGO_AreaInterferencias");
      const sCreateDelete = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista");
      const sEdit = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Analista");
      const sCargaIncial = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sComunicaciones = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_AreaGenero"
        || oGrupo === "PGO_AreaCarteleria" || oGrupo === "PGO_AreaMedioambiente" || oGrupo === "PGO_AreaPolizas" || oGrupo === "PGO_AreaSeguridadHigiene" || oGrupo === "PGO_AreaPermisos"
        || oGrupo === "PGO_AreaIngenieria" || oGrupo === "PGO_AreaInterferencias" || oGrupo === "PGO_UsuarioGenericoAySA");
      const sNotasMinutas = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Contratista");
      const sEjecucion = aGroups.find(oGrupo => oGrupo === "PGO_Super" || oGrupo === "PGO_UsuarioGenericoAySA" || oGrupo === "PGO_Inspector" || oGrupo === "PGO_JefeInspeccion" || oGrupo === "PGO_Contratista");
      oModel.setProperty("/Permisos", {
        user,
        delete: !!sCreateDelete && true,
        create: !!sCreateDelete && true,
        edit: !!sEdit && true,
        all: !!sAll && true,
        detalle: !!sDetalle && true,
        jefe: !!sJefeInspector && true,
        inspector: !!sInspector && true,
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
        ejecucion: !!sEjecucion && true,
        partidimetro: !!sPartidimetro && true,
        planTrabajo: !!sPlanTrabajo && true,
        preconstruccion: !!sPreconstruccion && true,
        oferta: !!sOferta && true,
        notasMinutas: !!sNotasMinutas && true
      });
    },

    getObrasData: async function () {
      const oModel = this.getModel("AppJsonModel");
      const { all, jefe, inspector, user } = oModel.getProperty("/Permisos");
      if (all) {
        const { value } = await Services.getObras();
        return value;
      }
      if (jefe) {
        const { value } = await Services.getObrasJefeInspector(user, "JE");
        return value;
      }
      if (inspector) {
        const { value } = await Services.getObrasJefeInspector(user, "EM");
        return value;
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
      const aSorters = [new Sorter(sPath, bDescending)];
      oBinding.sort(aSorters);
    },

    onSearch: function (oEvent) {
      const sSearch = oEvent.getParameter("newValue");
      const oTable = this.byId("idTablaaltaobras");
      const oBinding = oTable.getBinding("items");
      const aFilter = [
        new Filter({
          filters: [
            new Filter({
              path: 'nombre',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'estado/descripcion',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'tipo_contrato',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'tipo_obra',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'tipo_fluido',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'p3',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'partido',
              operator: FilterOperator.Contains,
              value1: sSearch
            }),
            new Filter({
              path: 'contratista/registro_proveedor',
              operator: FilterOperator.Contains,
              value1: sSearch
            })
          ],
          and: false
        })
      ];
      oBinding.filter(aFilter);
    },

    onViewObra: function (oEvent) {
      const oModel = this.getModel("AppJsonModel");
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      oModel.setProperty("/Detalle", true);
      this.navTo("Detalle", { ID }, false);
    },

    crearObra: function () {
      const oModel = this.getModel("AppJsonModel");
      oModel.setProperty("/Detalle", false);
      this.navTo("Detalle", false);
    },

    onDeleteObra: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      BusyIndicator.show(0);
      try {
        await this.showMessageConfirm("eliminarregistro");
        const message = this.getResourceBundle().getText("obraeliminada");
        MessageBox.success(message);
        await Services.deleteObra(ID);
        await this._onObjectMatched();
      } catch (error) {
        const message = this.getResourceBundle().getText("errorservice");
        error && MessageToast.show(message);
      }
      finally {
        BusyIndicator.hide();
      }
    },

    showMessageConfirm: function (sText) {
      return new Promise((res, rej) => {
        MessageBox.confirm(this.getResourceBundle().getText(sText), {
          actions: [MessageBox.Action.CANCEL, "Aceptar"],
          emphasizedAction: "Aceptar",
          onClose: sAction => sAction === "Aceptar" ? res() : rej(false)
        });
      });
    },

    onNavigateToCargaInicial: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocargainicial", { ID });
    },

    onNavigateToPermisos: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgopermisos", { ID });
    },

    onNavigateToOferta: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgooferta", { ID });
    },

    onViewPartidimetro: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgopartidimetro", { ID });
    },

    onNavigateToInterferencias: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgointerferencias", { ID });
    },

    onNavigateToPreconstruccion: async function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgopreconstruccion", { ID });
    },

    onNavigateToCargaInicialInspeccion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocargainicial", { ID, area_ID: "IN" });
    },

    onNavigateToCargaInicialGenero: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocargainicial", { ID, area_ID: "GE" });
    },

    onNavigateToCargaInicialCarteleria: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocargainicial", { ID, area_ID: "CA" });
    },

    onNavigateToCargaInicialMedioAmbiente: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocargainicial", { ID, area_ID: "MA" });
    },

    onNavigateToOrdenServicio: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoordenserv", { ID });
    },

    onNavigateToNotaPedido: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgonotapedido", { ID });
    },

    onNavigateToPoliza: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgopolizas", { ID });
    },

    onNavigateToPlanTrabajo: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoplantrabajo", { ID });
    },

    onNavigateToListadoPresentaciones: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgolistadopresentaciones", { ID });
    },

    onNavigateToHigieneSeguridad: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoseguridadhigiene", { ID });
    },

    onNavigateToListadoPlanos: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgolistadoplanos", { ID });
    },

    onNavigateToDiagramaCuadra: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgotramos", { ID });
    },

    onNavigateToControlDocumentacion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocontroldocumentacion", { ID });
    },

    onNavigateToActasSuspension: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactassuspension", { ID });
    },

    onNavigateToNotasMinutas: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgonotasminutas", { ID });
    },

    onNavigateToParteDiario: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgopartediario", { ID });
    },

    onNavigateToMemoriaCalculo: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgomemoriacalculo", { ID });
    },

    onNavigateToMemoriaCalculoOCE: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgomemoriacalculooce", { ID });
    },

    onNavigateToAcopioMateriales: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoacopiomateriales", { ID });
    },

    onNavigateToActasProrroga: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactasprorroga", { ID });
    },

    onNavigateToInspecElectro: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoinspeccioneselectro", { ID });
    },

    onNavigateToInspeccionMyC: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoinspeccionambiente", { ID });
    },

    onNavigateToControlPersonal: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocontrolpersonal", { ID });
    },

    onNavigateToActasTradicion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactastradicion", { ID });
    },

    onNavigateToActasEconomias: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactaeconomias", { ID });
    },

    onNavigateToRegistrosObra: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoregistrosobra", { ID });
    },

    onNavigateToActasConstatacion: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactasconstatacion", { ID });
    },

    onNavigateToActasAdicionales: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactasadicionales", { ID });
    },

    onNavigateToControlSostenimiento: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgocontrolsostenimiento", { ID });
    },

    onNavigateToActasExcedidas: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoactaexcedidas", { ID });
    },

    onNavigateToInspeccionHigSeg: function (oEvent) {
      const { ID } = oEvent.getSource().getBindingContext("AppJsonModel").getObject();
      this.navToCross("pgoinspeccionesseghig", { ID });
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
          sap.m.URLHelper.redirect(sHref);
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
            return;
          }
          try {
            BusyIndicator.show(0);
            const ordenes_compra = oObra.ordenes_compra.map(item => {
              return {
                moneda: item.moneda_ID,
                tipo_cambio: item.tipo_cambio,
                no_redetermina: item.no_redetermina,
                nro_oc: item.nro_oc,
                fecha_oc: item.fecha instanceof Date ? formatter.formatDateToBack(item.fecha) : item.fecha
              };
            });
            const p3 = oObra.p3.map(item => {
              return {
                codigo: item.codigo,
                nombre: item.nombre,
                tipo_contrato: item.tipo_contrato.descripcion,
                tipo_fluido: item.fluido.descripcion,
                tipo_obra: item.tipo_obra.descripcion,
                partido: item.partido.descripcion,
                sistema_cuenca: item.sistema.descripcion,
                acumar: item.acumar,
                acopio: item.acopio_materiales,
                anticipo_financiero: item.anticipo_financiero
              };
            });
            const temp_importes = [];
            oObra.p3.forEach(p3 => {
              p3.importes.forEach(imp => {
                temp_importes.push(imp);
              });
            });
            const importes = temp_importes.map(item => {
              return {
                codigo: item.p3.codigo,
                importe: item.importe,
                importe_ars: item.importe_ars,
                tipo_cambio: item.tipo_cambio,
                moneda: item.moneda_ID,
                porcentaje_ponderacion: item.porcentaje_ponderacion
              };
            });
            const temp_pi = [];
            oObra.p3.forEach(p3 => {
              p3.pi.forEach(pi => {
                temp_pi.push(pi);
              });
            });
            const proyectos_inversion = temp_pi.map(item => {
              return {
                p3: item.p3.codigo,
                pi: item.pi,
                tipo_pi: item.tipo_pi.descripcion,
                sistema_contratacion: item.sistema_contratacion.descripcion,
                importe: item.monto,
                moneda: item.moneda_ID
              };
            });
            const responsables = await this.getResponsables(oObra);  
            const infoResponsables = await this.getCorreosResponsables(oObra);          
            const aprobadores_correo = infoResponsables[0];
            const aprobadores_usuario = infoResponsables[1];
            const oPayload = {
              definitionId: "pgo.wfaltaobra",
              context: {
                id_obra: oObra.ID,
                nombre: oObra.nombre,
                nro_contrato: oObra.nro_contrato,
                monto_original_contrato: oObra.monto_original_contrato,
                moneda: oObra.moneda_ID,
                proveedor: oObra.contratista.registro_proveedor,
                razon_social: oObra.contratista.razonsocial,
                cuit: oObra.contratista.nro_documento,
                representante: oObra.representante,
                telefono: oObra.telefono,
                correo: oObra.correo,
                representante_tecnico: oObra.representante_tecnico,
                nro_matricula: oObra.nro_matricula,
                fecha_firma: oObra.fecha_firma,
                incremento_maximo: oObra.incremento_maximo,
                plazo_ejecucion: oObra.plazo_ejecucion,
                maximo_plazo_extension: oObra.maximo_plazo_extension,
                fondo_reparo: oObra.fondo_reparo === null ? 0 : oObra.fondo_reparo,
                financiamiento_obra: oObra.financiamiento_obra.descripcion,
                descuento_monto_contrato: oObra.descuento_monto_contrato,
                nro_poliza: oObra.nro_poliza,
                extendida_por: oObra.extendida_por,
                porcentaje_cobertura: oObra.porcentaje_cobertura,
                ordenes_compra: ordenes_compra,
                p3: p3,
                importes: importes,
                proyectos_inversion: proyectos_inversion,
                responsables: responsables,
                aprobadores_usuario: aprobadores_usuario,
                aprobadores_correo: aprobadores_correo
              }
            };
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
              });
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

    //Obtengo los responsables de cada pi
    getResponsables: async function (oObra) {
      let pi = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(item => {
          pi.push(item);
        });
      });
      pi = pi.filter(e => e.responsables != null);
      const pi_cod = pi.map(o => o.pi).join(', ')
      const responsables = pi.map(item => {        
        let jefes = item.responsables.responsables.inspectores.filter(e => e.inspector.tipo_inspector_ID === "JE");
        const jefes_nombres = jefes.map(o => o.inspector.nombre).join(', ');
        let inspectores = item.responsables.responsables.inspectores.filter(e => e.inspector.tipo_inspector_ID === "EM")
        const inspectores_nombres = inspectores.map(o => o.inspector.nombre).join(', ');
        return {
          direccion: item.responsables.responsables.direccion.descripcion,
          gerencia: item.responsables.responsables.gerencia.descripcion,
          jefe_inspeccion: jefes_nombres,
          inspector: inspectores_nombres, 
          pi: pi_cod
        };
      });      
      return responsables;
    },

    getCorreosResponsables: function (oObra) {
      let pi = [];
      oObra.p3.forEach(p3 => {
        p3.pi.forEach(item => {
          pi.push(item);
        });
      });
      pi = pi.filter(e => e.responsables != null); 
      let correos = []
      let usuarios = []     
      pi.forEach(item => {        
        correos.push(item.responsables.responsables.inspectores.map(o => o.inspector.correo))
        usuarios.push(item.responsables.responsables.inspectores.map(o => o.inspector.usuario))             
      }); 
      correos = correos.flat().filter(i => i !== null);
      usuarios = usuarios.flat().filter(i => i !== null);  
      return [correos, usuarios];
    },

    createPdf: async function () {
      const oTable = this.byId("idTablaaltaobras");
      const oObras = oTable.getItems();
      const { firstname, lastname } = await Services.getUser();
      const oObrasPayload = oObras.map(item => {
        item = item.getBindingContext("AppJsonModel").getObject();
        return {
          "nombre": item.nombre === null ? "" : item.nombre,
          "estado": item.estado === null ? "" : item.estado.descripcion,
          "tipo_contrato": item.tipo_contrato === null ? "" : item.tipo_contrato,
          "nrop3": item.p3 === null ? "" : item.p3,
          "registro_proveedor": item.contratista.registro_proveedor === null ? "" : item.contratista.registro_proveedor,
          "razonsocial": item.contratista.razonsocial === null ? "" : item.contratista.razonsocial,
          "fluido": item.tipo_fluido === null ? "" : item.tipo_fluido,
          "partido": item.partido === null ? "" : item.partido,
          "tipo_obra": item.tipo_obra === null ? "" : item.tipo_obra
        };
      });
      const oPayload = {
        "doc_id": "listado_obras",
        "usuario": firstname + " " + lastname,
        "fecha": this.formatter.formatDatePdf(new Date()),
        "formato": "base64",
        "obras": oObrasPayload
      };
      const oBinary = await Services.createPdf(oPayload);
      const timeStamp = (new Date()).toLocaleString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[^0-9]/g, '');
      let sFileName = "listado_obras_" + timeStamp;
      const sMimeType = "pdf";
      let aBuffer = this.base64ToArrayBuffer(oBinary.data);
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